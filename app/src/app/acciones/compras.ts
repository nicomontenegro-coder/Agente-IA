'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { db } from '@/lib/db'
import { siguienteNumero, compraCompleta } from '@/lib/compras-db'
import { validarCambio } from '@/lib/compra'
import { INCOTERM_LABEL } from '@/lib/incoterms'
import { leerNumero } from '@/lib/numeros'

export interface EstadoForm {
  error?: string
  ok?: string
}

const texto = (v: FormDataEntryValue | null) => {
  const s = typeof v === 'string' ? v.trim() : ''
  return s === '' ? null : s
}
const numero = (v: FormDataEntryValue | null): number | null => leerNumero(typeof v === 'string' ? v : null)
/** Mediodía y no medianoche: así la zona horaria no la corre al día anterior. */
const fechaDe = (v: FormDataEntryValue | null) => {
  const s = texto(v)
  return s ? new Date(`${s}T12:00:00`) : null
}
const incotermValido = (i: string | null) => !!i && i in INCOTERM_LABEL

function refrescar(id?: string) {
  revalidatePath('/compras')
  if (id) revalidatePath(`/compras/${id}`)
}

/** Crea la compra con sus líneas. Las líneas se leen con getAll: son varias filas con los mismos nombres. */
export async function crearCompra(_e: EstadoForm, datos: FormData): Promise<EstadoForm> {
  const titulo = texto(datos.get('titulo'))
  if (!titulo) return { error: 'Escribe de qué se trata la compra' }
  const incoterm = texto(datos.get('incoterm')) ?? 'FOB'
  if (!incotermValido(incoterm)) return { error: 'Elige un incoterm' }

  const descripciones = datos.getAll('descripcion')
  const especificaciones = datos.getAll('especificacion')
  const cantidades = datos.getAll('cantidad')
  const unidades = datos.getAll('unidad')
  const productos = datos.getAll('productoId')
  const lineas: { descripcion: string; especificacion: string | null; cantidad: number; unidad: string; productoId: string | null; orden: number }[] = []
  const problemas: string[] = []
  descripciones.forEach((d, i) => {
    const descripcion = texto(d)
    const cantidad = numero(cantidades[i] ?? null)
    if (!descripcion && cantidad == null) return
    if (!descripcion) return problemas.push(`La línea ${i + 1} tiene cantidad pero no dice qué producto es`)
    if (cantidad == null || cantidad <= 0) return problemas.push(`«${descripcion}» no tiene cantidad: sin ella el proveedor no puede cotizar`)
    lineas.push({
      descripcion,
      especificacion: texto(especificaciones[i] ?? null),
      cantidad,
      unidad: texto(unidades[i] ?? null) ?? 'u',
      productoId: texto(productos[i] ?? null),
      orden: lineas.length
    })
  })
  if (problemas.length) return { error: problemas.join('. ') }
  if (lineas.length === 0) return { error: 'Agrega al menos un producto con su cantidad' }

  const c = await db.compra.create({
    data: {
      numero: await siguienteNumero('compra'),
      titulo,
      incoterm,
      lugar: texto(datos.get('lugar')),
      destino: texto(datos.get('destino')),
      plazoRespuesta: fechaDe(datos.get('plazoRespuesta')),
      etapa: 'BUSCANDO',
      lineas: { create: lineas }
    }
  })
  refrescar()
  redirect(`/compras/${c.id}`)
}

export async function invitarProveedor(compraId: string, _e: EstadoForm, datos: FormData): Promise<EstadoForm> {
  const proveedorId = texto(datos.get('proveedorId'))
  if (!proveedorId) return { error: 'Elige un proveedor' }
  const ya = await db.invitacion.findUnique({ where: { compraId_proveedorId: { compraId, proveedorId } } })
  if (ya) return { error: 'Ese proveedor ya está invitado' }
  await db.invitacion.create({ data: { compraId, proveedorId } })
  refrescar(compraId)
  return { ok: 'Proveedor agregado: abre su RFQ para enviarla' }
}

export async function marcarEnviada(compraId: string, invitacionId: string) {
  await db.invitacion.update({ where: { id: invitacionId }, data: { enviadaEl: new Date() } })
  refrescar(compraId)
  revalidatePath(`/compras/${compraId}/rfq/${invitacionId}`)
}

export async function marcarDeclino(compraId: string, invitacionId: string) {
  await db.invitacion.update({ where: { id: invitacionId }, data: { declino: true } })
  refrescar(compraId)
}

/**
 * Registra la cotización de un proveedor: sus condiciones y un precio por
 * cada línea de la compra. Un precio en blanco queda en blanco: no se
 * inventa, y el total de esa cotización no se calcula hasta tenerlo.
 */
export async function registrarCotizacion(compraId: string, invitacionId: string, _e: EstadoForm, datos: FormData): Promise<EstadoForm> {
  const incoterm = texto(datos.get('incoterm'))
  if (!incotermValido(incoterm)) return { error: 'Elige el incoterm que cotizó el proveedor' }
  const compra = await db.compra.findUnique({ where: { id: compraId }, include: { lineas: true } })
  if (!compra) return { error: 'Esa compra ya no existe' }
  const aceptaTexto = texto(datos.get('aceptaCartaCredito'))
  const aceptaCartaCredito = aceptaTexto === 'SI' ? true : aceptaTexto === 'NO' ? false : null
  const precios = compra.lineas.map((l) => ({ compraLineaId: l.id, precioUnitario: numero(datos.get(`precio-${l.id}`)) }))
  if (precios.every((p) => p.precioUnitario == null)) return { error: 'Escribe al menos un precio' }
  if (precios.some((p) => p.precioUnitario != null && p.precioUnitario < 0)) return { error: 'Un precio no puede ser negativo' }

  const cabecera = {
    referencia: texto(datos.get('referencia')),
    moneda: texto(datos.get('moneda')) ?? 'USD',
    incoterm: incoterm!,
    lugar: texto(datos.get('lugar')),
    leadTimeDias: numero(datos.get('leadTimeDias')),
    validezDias: numero(datos.get('validezDias')),
    moq: texto(datos.get('moq')),
    aceptaCartaCredito,
    notas: texto(datos.get('notas')),
    recibidaEl: fechaDe(datos.get('recibidaEl')) ?? new Date()
  }
  const inv = await db.invitacion.findUnique({ where: { id: invitacionId }, include: { cotizacion: true } })
  if (!inv) return { error: 'Esa invitación ya no existe' }
  await db.$transaction(async (tx) => {
    if (inv.cotizacion) {
      await tx.cotizacionLinea.deleteMany({ where: { cotizacionId: inv.cotizacion.id } })
      await tx.cotizacion.update({ where: { id: inv.cotizacion.id }, data: { ...cabecera, leadTimeDias: cabecera.leadTimeDias ?? null, validezDias: cabecera.validezDias ?? null, lineas: { create: precios } } })
    } else {
      await tx.cotizacion.create({ data: { ...cabecera, invitacionId, lineas: { create: precios } } })
    }
    // Si la invitación no estaba marcada como enviada, haber cotizado lo prueba.
    if (!inv.enviadaEl) await tx.invitacion.update({ where: { id: invitacionId }, data: { enviadaEl: cabecera.recibidaEl } })
    // Lo que el proveedor dice de la carta de crédito queda en su ficha.
    if (aceptaCartaCredito != null) await tx.proveedor.update({ where: { id: inv.proveedorId }, data: { aceptaCartaCredito } })
  })
  refrescar(compraId)
  redirect(`/compras/${compraId}`)
}

/**
 * Emite la OC desde una cotización: copia descripción, cantidad y precio de
 * cada línea. Lo decidido se congela: si después cambia la cotización, la OC
 * sigue diciendo lo que se acordó.
 */
export async function emitirOrden(compraId: string, cotizacionId: string, _e: EstadoForm, datos: FormData): Promise<EstadoForm> {
  const cot = await db.cotizacion.findUnique({ where: { id: cotizacionId }, include: { lineas: true, invitacion: true } })
  const compra = await db.compra.findUnique({ where: { id: compraId }, include: { lineas: { orderBy: { orden: 'asc' }, include: { producto: true } } } })
  if (!cot || !compra || cot.invitacion.compraId !== compraId) return { error: 'Esa cotización no es de esta compra' }
  const faltan = compra.lineas.filter((l) => cot.lineas.find((x) => x.compraLineaId === l.id)?.precioUnitario == null)
  if (faltan.length) return { error: `Falta el precio de: ${faltan.map((l) => l.descripcion).join(', ')}. Complétalo en la cotización antes de emitir la OC` }
  const formaPago = texto(datos.get('formaPago'))
  if (formaPago !== 'CARTA_CREDITO' && formaPago !== 'TT') return { error: 'Elige la forma de pago' }

  const o = await db.ordenCompra.create({
    data: {
      numero: await siguienteNumero('orden'),
      compraId,
      cotizacionId,
      moneda: cot.moneda,
      incoterm: cot.incoterm,
      lugar: cot.lugar,
      destino: compra.destino,
      consignatario: texto(datos.get('consignatario')),
      etd: fechaDe(datos.get('etd')),
      formaPago,
      anticipoPct: formaPago === 'TT' ? numero(datos.get('anticipoPct')) : null,
      descuentoPct: numero(datos.get('descuentoPct')),
      garantiaMeses: numero(datos.get('garantiaMeses')),
      lineas: {
        create: compra.lineas.map((l, i) => ({
          compraLineaId: l.id,
          codigo: l.producto?.codigo ?? null,
          descripcion: l.descripcion,
          especificacion: l.especificacion,
          cantidad: l.cantidad,
          unidad: l.unidad,
          precioUnitario: cot.lineas.find((x) => x.compraLineaId === l.id)!.precioUnitario!,
          posicion: i
        }))
      }
    }
  })
  refrescar(compraId)
  redirect(`/imprimir/oc/${o.id}`)
}

export async function registrarPago(compraId: string, ordenId: string, _e: EstadoForm, datos: FormData): Promise<EstadoForm> {
  const tipo = texto(datos.get('tipo'))
  if (!tipo || !['CARTA_CREDITO', 'ANTICIPO', 'SALDO'].includes(tipo)) return { error: 'Elige qué pago es' }
  await db.pago.create({ data: { ordenId, tipo, monto: numero(datos.get('monto')), fecha: fechaDe(datos.get('fecha')) ?? new Date(), nota: texto(datos.get('nota')) } })
  refrescar(compraId)
  return { ok: 'Pago registrado' }
}

/** Cambio de etapa a mano, comparado contra la etapa que vale (no la guardada). */
export async function cambiarEtapa(compraId: string, _e: EstadoForm, datos: FormData): Promise<EstadoForm> {
  const c = await compraCompleta(compraId)
  if (!c) return { error: 'Esa compra ya no existe' }
  const a = texto(datos.get('etapa'))
  if (!a) return { error: 'Elige la etapa' }
  const nota = texto(datos.get('nota'))
  const error = validarCambio(c.etapaVale, a, nota)
  if (error) return { error }
  await db.compra.update({ where: { id: compraId }, data: { etapa: a, ...(nota ? { nota } : {}) } })
  refrescar(compraId)
  return { ok: 'Etapa actualizada' }
}

