'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { db } from '@/lib/db'
import { leerTabla, prepararClientes, validarRut, formatoRut, TIPOS_CLIENTE } from '@/lib/importar-clientes'
import { validarCambio, tipoDeCambio } from '@/lib/embudo'
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
  const existentes = await db.cliente.findMany({ select: { id: true, nombre: true, rut: true } })
  const listos = prepararClientes(filas, existentes)
  let creados = 0
  let actualizados = 0
  for (const c of listos) {
    if (c.estado === 'nuevo') {
      await db.cliente.create({ data: { ...c.datos, nombre: c.datos.nombre! } })
      creados++
    } else if (c.estado === 'actualiza') {
      // Solo completa lo que viene: un dato vacío en la tabla no borra lo que ya había.
      const completar = Object.fromEntries(Object.entries(c.datos).filter(([k, v]) => v != null && k !== 'nombre'))
      await db.cliente.update({ where: { id: c.existenteId! }, data: completar })
      actualizados++
    }
  }
  revalidatePath('/clientes')
  redirect(`/clientes?importados=${creados}&actualizados=${actualizados}`)
}

export async function guardarCliente(id: string | null, _e: EstadoForm, datos: FormData): Promise<EstadoForm> {
  const nombre = texto(datos.get('nombre'))
  if (!nombre) return { error: 'Ingresa el nombre del cliente' }
  const otro = await db.cliente.findUnique({ where: { nombre } })
  if (otro && otro.id !== id) return { error: 'Ya existe un cliente con ese nombre' }
  const rutTexto = texto(datos.get('rut'))
  if (rutTexto && !validarRut(rutTexto)) return { error: 'El RUT no es válido: revisa el dígito verificador' }
  const tipo = texto(datos.get('tipo'))
  if (tipo && !(TIPOS_CLIENTE as readonly string[]).includes(tipo)) return { error: 'Selecciona el tipo de cliente' }

  const actual = id ? await db.cliente.findUnique({ where: { id } }) : null
  const etapa = texto(datos.get('etapa')) ?? actual?.etapa ?? 'IDENTIFICADO'
  const notaEtapa = texto(datos.get('notaEtapa'))
  if (actual) {
    const error = validarCambio(actual.etapa, etapa, notaEtapa)
    if (error) return { error }
  }
  const proximaFecha = texto(datos.get('proximaFecha'))
  const data = {
    nombre,
    rut: rutTexto ? formatoRut(rutTexto) : null,
    tipo,
    ciudad: texto(datos.get('ciudad')),
    direccion: texto(datos.get('direccion')),
    contacto: texto(datos.get('contacto')),
    telefono: texto(datos.get('telefono')),
    email: texto(datos.get('email')),
    notas: texto(datos.get('notas')),
    etapa,
    // La nota de la etapa solo se reemplaza cuando la etapa cambia de verdad.
    ...(actual && tipoDeCambio(actual.etapa, etapa) !== 'NINGUNO' ? { notaEtapa } : {}),
    proximaAccion: texto(datos.get('proximaAccion')),
    proximaFecha: proximaFecha ? new Date(`${proximaFecha}T12:00:00`) : null
  }
  const c = actual ? await db.cliente.update({ where: { id: actual.id }, data }) : await db.cliente.create({ data })
  revalidatePath('/clientes')
  if (!actual) redirect(`/clientes/${c.id}`)
  revalidatePath(`/clientes/${c.id}`)
  return { ok: 'Cliente guardado' }
}
