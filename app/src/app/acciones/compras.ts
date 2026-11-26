'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { db } from '@/lib/db'
import { siguienteNumero, compraCompleta } from '@/lib/compras-db'
import { validarCambio, validarAnulacion } from '@/lib/compra'
import { INCOTERM_LABEL } from '@/lib/incoterms'
import { leerNumero } from '@/lib/numeros'
import { guardarPdf, esPdf, MAXIMO_PDF } from '@/lib/archivos'
import { hayLectorIa, leerCotizacion } from '@/lib/leer-cotizacion'
import { revisarDesglose, cuadraConPedido, type LineaDesglose } from '@/lib/lectura'
import { totalCotizacion } from '@/lib/proveedores'
import { aplicarRespuesta, convertirUnidad } from '@/lib/preguntas'
import type { LecturaCotizacion } from '@/lib/lectura-esquema'

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
  if (!titulo) return { error: 'Ingresa el título de la compra' }
  const incoterm = texto(datos.get('incoterm')) ?? 'FOB'
  if (!incotermValido(incoterm)) return { error: 'Selecciona un incoterm' }

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
    if (!descripcion) return problemas.push(`Línea ${i + 1}: ingresa la descripción del producto`)
    if (cantidad == null || cantidad <= 0) return problemas.push(`«${descripcion}»: ingresa la cantidad`)
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
  if (lineas.length === 0) return { error: 'Agrega al menos un producto con cantidad' }

  const plazoRespuesta = fechaDe(datos.get('plazoRespuesta'))
  if (plazoRespuesta && plazoRespuesta.getTime() < new Date().setHours(0, 0, 0, 0)) {
    return { error: 'El plazo de respuesta debe ser igual o posterior a hoy' }
  }
  const c = await db.compra.create({
    data: {
      numero: await siguienteNumero('compra'),
      titulo,
      incoterm,
      lugar: texto(datos.get('lugar')),
      destino: texto(datos.get('destino')),
      plazoRespuesta,
      etapa: 'BUSCANDO',
      lineas: { create: lineas }
    }
  })
  refrescar()
  redirect(`/compras/${c.id}`)
}

export async function invitarProveedor(compraId: string, _e: EstadoForm, datos: FormData): Promise<EstadoForm> {
  const proveedorId = texto(datos.get('proveedorId'))
  if (!proveedorId) return { error: 'Selecciona un proveedor' }
  const ya = await db.invitacion.findUnique({ where: { compraId_proveedorId: { compraId, proveedorId } } })
  if (ya) return { error: 'El proveedor ya está invitado' }
  await db.invitacion.create({ data: { compraId, proveedorId } })
  refrescar(compraId)
  return { ok: 'Proveedor invitado. Abre su RFQ para enviarla' }
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
  if (!incotermValido(incoterm)) return { error: 'Selecciona el incoterm cotizado' }
  const compra = await db.compra.findUnique({ where: { id: compraId }, include: { lineas: true } })
  if (!compra) return { error: 'La compra no existe' }
  const aceptaTexto = texto(datos.get('aceptaCartaCredito'))
  const aceptaCartaCredito = aceptaTexto === 'SI' ? true : aceptaTexto === 'NO' ? false : null
  const precios = compra.lineas.map((l) => ({ compraLineaId: l.id, precioUnitario: numero(datos.get(`precio-${l.id}`)) }))
  if (precios.every((p) => p.precioUnitario == null)) return { error: 'Ingresa al menos un precio' }
  if (precios.some((p) => p.precioUnitario != null && p.precioUnitario < 0)) return { error: 'Un precio no puede ser negativo' }

  // El desglose del proveedor: filas con los mismos nombres, se leen con getAll.
  const dDesc = datos.getAll('d-descripcion')
  const dUni = datos.getAll('d-unidad')
  const dCant = datos.getAll('d-cantidad')
  const dPrecio = datos.getAll('d-precio')
  const dMonto = datos.getAll('d-monto')
  const desglose: LineaDesglose[] = []
  dDesc.forEach((d, k) => {
    const descripcion = texto(d)
    if (!descripcion) return
    desglose.push({
      descripcion,
      unidad: texto(dUni[k] ?? null),
      cantidad: numero(dCant[k] ?? null),
      precioUnitario: numero(dPrecio[k] ?? null),
      monto: numero(dMonto[k] ?? null)
    })
  })
  const documento = {
    subtotal: numero(datos.get('subtotalDocumento')),
    gastos: numero(datos.get('gastosDocumento')),
    total: numero(datos.get('totalDocumento'))
  }
  // Las cuentas se rehacen al guardar, no solo al leer: lo que se corrigió a
  // mano también tiene que cuadrar.
  const moneda = texto(datos.get('moneda')) ?? 'USD'
  const totalLineas = totalCotizacion(compra.lineas.map((l) => ({ compraLineaId: l.id, cantidad: l.cantidad, precioUnitario: precios.find((p) => p.compraLineaId === l.id)!.precioUnitario })))
  const problemas = [...revisarDesglose(desglose, documento).problemas, cuadraConPedido(totalLineas, documento.total, moneda)].filter((x): x is string => !!x)
  if (problemas.length && datos.get('aceptoDiferencias') !== 'on') {
    return { error: `Diferencias en los montos: ${problemas.join('. ')}. Corrige el dato o marca «Guardar con diferencias» si el error está en el documento del proveedor.` }
  }

  // El PDF viene de la lectura que se está revisando, si la hay.
  const lecturaId = texto(datos.get('lecturaId'))
  const lectura = lecturaId ? await db.lecturaPendiente.findUnique({ where: { id: lecturaId } }) : null
  const adjunto = lectura && lectura.invitacionId === invitacionId ? { archivo: lectura.archivo, archivoNombre: lectura.archivoNombre } : {}

  const cabecera = {
    ...adjunto,
    subtotalDocumento: documento.subtotal,
    gastosDocumento: documento.gastos,
    totalDocumento: documento.total,
    referencia: texto(datos.get('referencia')),
    moneda,
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
  if (!inv) return { error: 'La invitación no existe' }
  await db.$transaction(async (tx) => {
    const filas = desglose.map((d, posicion) => ({ ...d, posicion }))
    if (inv.cotizacion) {
      await tx.cotizacionLinea.deleteMany({ where: { cotizacionId: inv.cotizacion.id } })
      await tx.cotizacionDesglose.deleteMany({ where: { cotizacionId: inv.cotizacion.id } })
      await tx.cotizacion.update({ where: { id: inv.cotizacion.id }, data: { ...cabecera, leadTimeDias: cabecera.leadTimeDias ?? null, validezDias: cabecera.validezDias ?? null, lineas: { create: precios }, desglose: { create: filas } } })
    } else {
      await tx.cotizacion.create({ data: { ...cabecera, invitacionId, lineas: { create: precios }, desglose: { create: filas } } })
    }
    // La IA propuso, la persona aceptó: la propuesta ya no hace falta.
    if (lectura) await tx.lecturaPendiente.delete({ where: { id: lectura.id } })
    // Si la invitación no estaba marcada como enviada, haber cotizado lo prueba.
    if (!inv.enviadaEl) await tx.invitacion.update({ where: { id: invitacionId }, data: { enviadaEl: cabecera.recibidaEl } })
    // Lo que el proveedor dice de la carta de crédito queda en su ficha.
    if (aceptaCartaCredito != null) await tx.proveedor.update({ where: { id: inv.proveedorId }, data: { aceptaCartaCredito } })
  })
  refrescar(compraId)
  redirect(`/compras/${compraId}`)
}

/** Guarda el PDF y, si hay lector, lo lee. Lo comparten las dos formas de subirlo. */
async function guardarYLeer(compraId: string, datos: FormData): Promise<{ error: string } | { archivo: string; archivoNombre: string; lectura: string | null; error: string | null }> {
  const archivo = datos.get('pdf')
  if (!(archivo instanceof File) || archivo.size === 0) return { error: 'Selecciona el PDF de la cotización' }
  if (archivo.size > MAXIMO_PDF) return { error: 'El PDF supera el máximo de 30 MB' }
  const contenido = Buffer.from(await archivo.arrayBuffer())
  if (!esPdf(contenido)) return { error: 'El archivo no es un PDF válido' }
  const compra = await db.compra.findUnique({ where: { id: compraId }, include: { lineas: { orderBy: { orden: 'asc' } } } })
  if (!compra) return { error: 'La compra no existe' }

  const nombre = await guardarPdf(archivo)
  let lectura: string | null = null
  let error: string | null = null
  if (hayLectorIa()) {
    const r = await leerCotizacion(contenido.toString('base64'), compra.lineas.map((l) => ({ id: l.id, descripcion: l.descripcion, cantidad: l.cantidad, unidad: l.unidad })), archivo.name)
    if (r.ok) lectura = JSON.stringify(r.lectura)
    else error = r.error
  }
  return { archivo: nombre, archivoNombre: archivo.name || 'cotizacion.pdf', lectura, error }
}

/**
 * Sube el PDF de un proveedor ya invitado. No guarda la cotización: deja la
 * lectura pendiente y vuelve al formulario ya lleno, para que una persona la
 * revise contra el documento.
 */
export async function subirPdf(compraId: string, invitacionId: string, _e: EstadoForm, datos: FormData): Promise<EstadoForm> {
  const r = await guardarYLeer(compraId, datos)
  if (!('archivo' in r)) return r
  const p = await db.lecturaPendiente.create({ data: { compraId, invitacionId, ...r } })
  redirect(`/compras/${compraId}/cotizacion/${invitacionId}?lectura=${p.id}`)
}

/**
 * Sube una cotización sin decir de quién es: la IA lee quién la firma y la
 * pantalla siguiente sugiere a cuál de los proveedores guardados corresponde.
 */
export async function subirCotizacion(compraId: string, _e: EstadoForm, datos: FormData): Promise<EstadoForm> {
  const r = await guardarYLeer(compraId, datos)
  if (!('archivo' in r)) return r
  const p = await db.lecturaPendiente.create({ data: { compraId, invitacionId: null, ...r } })
  redirect(`/compras/${compraId}/lectura/${p.id}`)
}

/**
 * Asigna la lectura a un proveedor. Si no estaba invitado a esta compra, se
 * invita: que haya cotizado prueba que recibió la RFQ, por el canal que sea.
 */
async function asignarA(compraId: string, lecturaId: string, proveedorId: string): Promise<never> {
  const inv = await db.invitacion.upsert({
    where: { compraId_proveedorId: { compraId, proveedorId } },
    create: { compraId, proveedorId },
    update: {}
  })
  await db.lecturaPendiente.update({ where: { id: lecturaId }, data: { invitacionId: inv.id } })
  refrescar(compraId)
  redirect(`/compras/${compraId}/cotizacion/${inv.id}?lectura=${lecturaId}`)
}

export async function asignarLectura(compraId: string, lecturaId: string, _e: EstadoForm, datos: FormData): Promise<EstadoForm> {
  const proveedorId = texto(datos.get('proveedorId'))
  if (!proveedorId) return { error: 'Selecciona un proveedor' }
  if (!(await db.proveedor.findUnique({ where: { id: proveedorId } }))) return { error: 'El proveedor no existe' }
  return asignarA(compraId, lecturaId, proveedorId)
}

/** Crea el proveedor con los datos del membrete y le asigna la lectura. */
export async function crearProveedorDeLectura(compraId: string, lecturaId: string, _e: EstadoForm, datos: FormData): Promise<EstadoForm> {
  const nombre = texto(datos.get('nombre'))
  if (!nombre) return { error: 'Ingresa el nombre del proveedor' }
  if (await db.proveedor.findUnique({ where: { nombre } })) return { error: 'Ya existe un proveedor con ese nombre: selecciónalo en la lista' }
  const p = await db.proveedor.create({
    data: { nombre, pais: texto(datos.get('pais')), contacto: texto(datos.get('contacto')), email: texto(datos.get('email')), telefono: texto(datos.get('telefono')) }
  })
  revalidatePath('/proveedores')
  return asignarA(compraId, lecturaId, p.id)
}

/** Lee la lectura pendiente de una invitación, para responder sus preguntas. */
async function lecturaDe(lecturaId: string, invitacionId: string) {
  const lp = await db.lecturaPendiente.findUnique({ where: { id: lecturaId } })
  if (!lp || lp.invitacionId !== invitacionId || !lp.lectura) return null
  const lectura = JSON.parse(lp.lectura) as LecturaCotizacion
  // Las lecturas guardadas antes de que existieran las preguntas no las traen.
  return { lp, lectura: { ...lectura, preguntas: lectura.preguntas ?? [] } }
}

/** Responde una pregunta de la lectura: la respuesta llena el campo. */
export async function responderPregunta(compraId: string, invitacionId: string, lecturaId: string, indice: number, _e: EstadoForm, datos: FormData): Promise<EstadoForm> {
  const l = await lecturaDe(lecturaId, invitacionId)
  if (!l) return { error: 'La lectura ya no está disponible: vuelve a leer el PDF' }
  const valor = texto(datos.get('otro')) ?? texto(datos.get('valor'))
  if (!valor) return { error: 'Selecciona una opción o ingresa un valor' }
  const r = aplicarRespuesta(l.lectura, indice, valor)
  if (!r.ok) return { error: r.error }
  await db.lecturaPendiente.update({ where: { id: lecturaId }, data: { lectura: JSON.stringify(r.lectura) } })
  redirect(`/compras/${compraId}/cotizacion/${invitacionId}?lectura=${lecturaId}`)
}

/** Pasa el precio de una línea a la unidad pedida (metros por barra, por ejemplo). */
export async function convertirPrecio(compraId: string, invitacionId: string, lecturaId: string, lineaId: string, _e: EstadoForm, datos: FormData): Promise<EstadoForm> {
  const l = await lecturaDe(lecturaId, invitacionId)
  if (!l) return { error: 'La lectura ya no está disponible: vuelve a leer el PDF' }
  const linea = await db.compraLinea.findUnique({ where: { id: lineaId } })
  if (!linea || linea.compraId !== compraId) return { error: 'La línea no corresponde a esta compra' }
  const r = convertirUnidad(l.lectura, lineaId, numero(datos.get('factor')), linea.unidad)
  if (!r.ok) return { error: r.error }
  await db.lecturaPendiente.update({ where: { id: lecturaId }, data: { lectura: JSON.stringify(r.lectura) } })
  redirect(`/compras/${compraId}/cotizacion/${invitacionId}?lectura=${lecturaId}`)
}

/** La medida para comparar ofertas que cada proveedor cubica distinto. */
export async function guardarMedida(compraId: string, _e: EstadoForm, datos: FormData): Promise<EstadoForm> {
  const medidaRef = numero(datos.get('medidaRef'))
  const unidadRef = texto(datos.get('unidadRef'))
  if (medidaRef != null && medidaRef <= 0) return { error: 'La medida debe ser mayor que cero' }
  if (medidaRef != null && !unidadRef) return { error: 'Ingresa la unidad de medida: m², m, kg…' }
  await db.compra.update({ where: { id: compraId }, data: { medidaRef, unidadRef: medidaRef == null ? null : unidadRef } })
  refrescar(compraId)
  return { ok: medidaRef == null ? 'Medida borrada' : 'Medida guardada' }
}

/**
 * Emite la OC desde una cotización: copia descripción, cantidad y precio de
 * cada línea. Lo decidido se congela: si después cambia la cotización, la OC
 * sigue diciendo lo que se acordó.
 */
export async function emitirOrden(compraId: string, cotizacionId: string, _e: EstadoForm, datos: FormData): Promise<EstadoForm> {
  const cot = await db.cotizacion.findUnique({ where: { id: cotizacionId }, include: { lineas: true, invitacion: true } })
  const compra = await db.compra.findUnique({ where: { id: compraId }, include: { lineas: { orderBy: { orden: 'asc' }, include: { producto: true } } } })
  if (!cot || !compra || cot.invitacion.compraId !== compraId) return { error: 'La cotización no corresponde a esta compra' }
  const faltan = compra.lineas.filter((l) => cot.lineas.find((x) => x.compraLineaId === l.id)?.precioUnitario == null)
  if (faltan.length) return { error: `Falta el precio de: ${faltan.map((l) => l.descripcion).join(', ')}. Complétalo en la cotización para emitir la OC` }
  const formaPago = texto(datos.get('formaPago'))
  if (formaPago !== 'CARTA_CREDITO' && formaPago !== 'TT') return { error: 'Selecciona la forma de pago' }

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

/** Anula una OC: queda con su número y el motivo, y deja de contar para la etapa. */
export async function anularOrden(compraId: string, ordenId: string, _e: EstadoForm, datos: FormData): Promise<EstadoForm> {
  const o = await db.ordenCompra.findUnique({ where: { id: ordenId }, include: { pagos: true } })
  if (!o || o.compraId !== compraId) return { error: 'La orden no corresponde a esta compra' }
  const motivo = texto(datos.get('motivo'))
  const error = validarAnulacion({ anulada: !!o.anuladaEl, pagos: o.pagos.length }, motivo)
  if (error) return { error }
  await db.ordenCompra.update({ where: { id: ordenId }, data: { anuladaEl: new Date(), motivoAnulacion: motivo } })
  refrescar(compraId)
  revalidatePath(`/imprimir/oc/${ordenId}`)
  return { ok: 'Orden anulada' }
}

export async function registrarPago(compraId: string, ordenId: string, _e: EstadoForm, datos: FormData): Promise<EstadoForm> {
  const tipo = texto(datos.get('tipo'))
  if (!tipo || !['CARTA_CREDITO', 'ANTICIPO', 'SALDO'].includes(tipo)) return { error: 'Selecciona el tipo de pago' }
  await db.pago.create({ data: { ordenId, tipo, monto: numero(datos.get('monto')), fecha: fechaDe(datos.get('fecha')) ?? new Date(), nota: texto(datos.get('nota')) } })
  refrescar(compraId)
  return { ok: 'Pago registrado' }
}

/** Cambio de etapa a mano, comparado contra la etapa que vale (no la guardada). */
export async function cambiarEtapa(compraId: string, _e: EstadoForm, datos: FormData): Promise<EstadoForm> {
  const c = await compraCompleta(compraId)
  if (!c) return { error: 'La compra no existe' }
  const a = texto(datos.get('etapa'))
  if (!a) return { error: 'Selecciona la etapa' }
  const nota = texto(datos.get('nota'))
  const error = validarCambio(c.etapaVale, a, nota)
  if (error) return { error }
  await db.compra.update({ where: { id: compraId }, data: { etapa: a, ...(nota ? { nota } : {}) } })
  refrescar(compraId)
  return { ok: 'Etapa actualizada' }
}

