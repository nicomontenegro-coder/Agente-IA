'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { db } from '@/lib/db'
import { leerTabla, prepararClientes, validarRut, formatoRut } from '@/lib/importar-clientes'
import { validarCambio, tipoDeCambio, ETIQUETA_ETAPA, CANALES_GESTION, type EtapaCliente } from '@/lib/embudo'
import { posiblesDuplicados, combinarClientes, unirSucursales, CAMPOS_FUSION, type DatosCliente, type CampoFusion } from '@/lib/duplicados-clientes'
import type { EstadoForm } from './compras'

const texto = (v: FormDataEntryValue | null) => {
  const s = typeof v === 'string' ? v.trim() : ''
  return s === '' ? null : s
}

/** Importa la tabla pegada. Se vuelve a validar aquí: la pantalla solo mostró la propuesta. */
export async function importarClientes(_e: EstadoForm, datos: FormData): Promise<EstadoForm> {
  const tabla = String(datos.get('tabla') ?? '')
  const filas = leerTabla(tabla)
  if (filas.length === 0) return { error: 'No se encontró una tabla: pega el encabezado y al menos una fila' }
  if (!filas.some((f) => f.nombre !== undefined)) return { error: 'La tabla no tiene columna «Nombre»' }
  const [filasExistentes, canales] = await Promise.all([
    db.cliente.findMany({ select: { id: true, nombre: true, rut: true, sucursales: { select: { id: true, ciudad: true, direccion: true } } } }),
    db.canalVenta.findMany()
  ])
  const existentes = filasExistentes.map((c) => ({ id: c.id, nombre: c.nombre, rut: c.rut, ciudades: c.sucursales.map((x) => x.ciudad) }))
  const listos = prepararClientes(filas, existentes, canales)
  let creados = 0
  let actualizados = 0
  for (const c of listos) {
    const { ciudad, direccion, ...cliente } = c.datos
    const local = ciudad || direccion ? { ciudad: ciudad ?? 'Sin ciudad', direccion } : null
    if (c.estado === 'nuevo') {
      await db.cliente.create({
        data: { ...cliente, nombre: cliente.nombre!, etapa: cliente.etapa ?? 'IDENTIFICADO', ...(local ? { sucursales: { create: local } } : {}) }
      })
      creados++
    } else if (c.estado === 'actualiza') {
      // Solo completa lo que viene: un dato vacío en la tabla no borra lo que ya había.
      const completar = Object.fromEntries(Object.entries(cliente).filter(([k, v]) => v != null && k !== 'nombre'))
      await db.cliente.update({ where: { id: c.existenteId! }, data: completar })
      if (local && c.sucursalNueva) {
        await db.sucursal.create({ data: { ...local, clienteId: c.existenteId! } })
      } else if (local?.direccion) {
        // Misma ciudad: completa la dirección si el local no la tenía.
        const mismo = filasExistentes.find((x) => x.id === c.existenteId)?.sucursales.find((x) => x.ciudad.toLowerCase() === local.ciudad.toLowerCase() && !x.direccion)
        if (mismo) await db.sucursal.update({ where: { id: mismo.id }, data: { direccion: local.direccion } })
      }
      actualizados++
    }
  }
  revalidatePath('/clientes')
  redirect(`/clientes?importados=${creados}&actualizados=${actualizados}`)
}

export async function guardarCliente(id: string | null, _e: EstadoForm, datos: FormData): Promise<EstadoForm> {
  const nombre = texto(datos.get('nombre'))
  if (!nombre) return { error: 'Ingresa el nombre del cliente' }
  const rutTexto = texto(datos.get('rut'))
  if (rutTexto && !validarRut(rutTexto)) return { error: 'El RUT no es válido: revisa el dígito verificador' }
  const rut = rutTexto ? formatoRut(rutTexto) : null
  if (rut) {
    // El RUT identifica al cliente: dos fichas con el mismo RUT son el mismo cliente.
    const otro = await db.cliente.findUnique({ where: { rut } })
    if (otro && otro.id !== id) return { error: `Ese RUT ya es de ${otro.nombre}` }
  }
  const canalId = texto(datos.get('canalId'))
  if (canalId && !(await db.canalVenta.findUnique({ where: { id: canalId } }))) return { error: 'Selecciona un canal de venta' }

  const actual = id ? await db.cliente.findUnique({ where: { id } }) : null
  if (!actual && datos.get('distinto') !== 'on') {
    // Avisar antes es mejor que fusionar después.
    const parecidos = posiblesDuplicados({ nombre, rut }, await db.cliente.findMany({ select: { id: true, nombre: true, rut: true } }))
    if (parecidos.length) return { error: `Puede ser el mismo cliente que ${parecidos.map((x) => x.nombre).join(', ')}. Si es otro, marca «Es un cliente distinto» y guarda.` }
  }
  const etapa = texto(datos.get('etapa')) ?? actual?.etapa ?? 'IDENTIFICADO'
  const motivo = texto(datos.get('motivo'))
  const cambio = actual ? tipoDeCambio(actual.etapa, etapa) : 'NINGUNO'
  if (actual) {
    const error = validarCambio(actual.etapa, etapa, motivo)
    if (error) return { error }
  }
  const proximaFecha = texto(datos.get('proximaFecha'))
  const data = {
    nombre,
    rut,
    canalId,
    contacto: texto(datos.get('contacto')),
    telefono: texto(datos.get('telefono')),
    email: texto(datos.get('email')),
    notas: texto(datos.get('notas')),
    etapa,
    proximaAccion: texto(datos.get('proximaAccion')),
    proximaFecha: proximaFecha ? new Date(`${proximaFecha}T12:00:00`) : null
  }
  const c = await db.$transaction(async (tx) => {
    const guardado = actual ? await tx.cliente.update({ where: { id: actual.id }, data }) : await tx.cliente.create({ data })
    // Todo cambio de etapa queda en el historial, con su motivo.
    if (actual && cambio !== 'NINGUNO') {
      const de = ETIQUETA_ETAPA[actual.etapa as EtapaCliente] ?? actual.etapa
      const a = ETIQUETA_ETAPA[etapa as EtapaCliente] ?? etapa
      await tx.gestion.create({ data: { clienteId: guardado.id, medio: 'NOTA', texto: `Etapa: ${de} → ${a}${motivo ? `. ${motivo}` : ''}`, etapaDe: actual.etapa, etapaA: etapa } })
    }
    return guardado
  })
  revalidatePath('/clientes')
  if (!actual) redirect(`/clientes/${c.id}`)
  revalidatePath(`/clientes/${c.id}`)
  return { ok: 'Cliente guardado' }
}

/** Registra lo que pasó con el cliente: una visita, una llamada, un WhatsApp. */
export async function registrarGestion(clienteId: string, _e: EstadoForm, datos: FormData): Promise<EstadoForm> {
  const medio = texto(datos.get('medio'))
  if (!medio || !CANALES_GESTION.some((c) => c.valor === medio)) return { error: 'Selecciona cómo fue el contacto' }
  const contenido = texto(datos.get('texto'))
  if (!contenido) return { error: 'Escribe qué pasó' }
  const f = texto(datos.get('fecha'))
  const sucursalId = texto(datos.get('sucursalId'))
  if (sucursalId && !(await db.sucursal.findFirst({ where: { id: sucursalId, clienteId } }))) return { error: 'Esa sucursal no es de este cliente' }
  await db.gestion.create({ data: { clienteId, sucursalId, medio, texto: contenido, fecha: f ? new Date(`${f}T12:00:00`) : new Date() } })
  revalidatePath(`/clientes/${clienteId}`)
  return { ok: 'Gestión registrada' }
}

/** Agrega un canal de venta. Los canales son datos: no hace falta programar para sumar uno. */
export async function agregarCanal(_e: EstadoForm, datos: FormData): Promise<EstadoForm> {
  const nombre = texto(datos.get('nombre'))
  if (!nombre) return { error: 'Ingresa el nombre del canal' }
  if (await db.canalVenta.findUnique({ where: { nombre } })) return { error: 'Ese canal ya existe' }
  const ultimo = await db.canalVenta.aggregate({ _max: { posicion: true } })
  await db.canalVenta.create({ data: { nombre, posicion: (ultimo._max.posicion ?? 0) + 1 } })
  revalidatePath('/ajustes')
  return { ok: 'Canal agregado' }
}

const datosDe = (c: Record<string, unknown>): DatosCliente => Object.fromEntries(CAMPOS_FUSION.map((k) => [k, (c[k] as string | null) ?? null])) as DatosCliente

/**
 * Fusiona «origen» en «destino»: la ficha que queda toma lo que le falta,
 * en los conflictos gana lo que se eligió, las gestiones se mueven y la
 * fusión queda anotada. La ficha de origen se borra.
 */
export async function fusionarClientes(destinoId: string, origenId: string, _e: EstadoForm, datos: FormData): Promise<EstadoForm> {
  if (destinoId === origenId) return { error: 'Selecciona otro cliente' }
  const [destino, origen] = await Promise.all([
    db.cliente.findUnique({ where: { id: destinoId }, include: { sucursales: true } }),
    db.cliente.findUnique({ where: { id: origenId }, include: { sucursales: true } })
  ])
  if (!destino || !origen) return { error: 'Uno de los clientes ya no existe' }
  if (destino.rut && origen.rut && destino.rut !== origen.rut) return { error: 'Tienen RUT distintos: son empresas distintas y no se fusionan' }
  const { resultado, conflictos } = combinarClientes(datosDe(destino), datosDe(origen))
  for (const k of conflictos) if (datos.get(`elegir-${k}`) === 'origen') resultado[k as CampoFusion] = datosDe(origen)[k]
  const locales = unirSucursales(destino.sucursales, origen.sucursales)
  await db.$transaction([
    // Las sucursales no compiten: las nuevas pasan a la ficha que queda, y un mismo local se junta en uno.
    db.sucursal.updateMany({ where: { id: { in: locales.mover } }, data: { clienteId: destino.id } }),
    ...locales.completar.flatMap((x) => [
      db.sucursal.update({ where: { id: x.queda }, data: x.datos }),
      db.gestion.updateMany({ where: { sucursalId: x.sale }, data: { sucursalId: x.queda } }),
      db.sucursal.delete({ where: { id: x.sale } })
    ]),
    // El RUT es único: se suelta del origen antes de pasarlo al destino.
    db.cliente.update({ where: { id: origen.id }, data: { rut: null } }),
    db.gestion.updateMany({ where: { clienteId: origen.id }, data: { clienteId: destino.id } }),
    db.cliente.update({ where: { id: destino.id }, data: { ...resultado, nombre: resultado.nombre ?? destino.nombre, etapa: resultado.etapa ?? destino.etapa } }),
    db.gestion.create({ data: { clienteId: destino.id, medio: 'NOTA', texto: `Fusionado con «${origen.nombre}»${origen.rut ? ` (RUT ${origen.rut})` : ''}: sus datos y gestiones quedaron en esta ficha` } }),
    db.cliente.delete({ where: { id: origen.id } })
  ])
  revalidatePath('/clientes')
  redirect(`/clientes/${destino.id}`)
}

/** Agrega o corrige una sucursal del cliente. */
export async function guardarSucursal(clienteId: string, sucursalId: string | null, _e: EstadoForm, datos: FormData): Promise<EstadoForm> {
  const ciudad = texto(datos.get('ciudad'))
  if (!ciudad) return { error: 'Ingresa la ciudad de la sucursal' }
  const data = { ciudad, direccion: texto(datos.get('direccion')), contacto: texto(datos.get('contacto')), telefono: texto(datos.get('telefono')) }
  if (sucursalId) {
    const r = await db.sucursal.updateMany({ where: { id: sucursalId, clienteId }, data })
    if (!r.count) return { error: 'Esa sucursal no es de este cliente' }
  } else {
    await db.sucursal.create({ data: { ...data, clienteId } })
  }
  revalidatePath(`/clientes/${clienteId}`)
  revalidatePath('/clientes')
  return { ok: sucursalId ? 'Sucursal guardada' : 'Sucursal agregada' }
}

/** Quita una sucursal. Sus gestiones quedan en el cliente, sin local. */
export async function quitarSucursal(clienteId: string, sucursalId: string): Promise<void> {
  await db.sucursal.deleteMany({ where: { id: sucursalId, clienteId } })
  revalidatePath(`/clientes/${clienteId}`)
  revalidatePath('/clientes')
}
