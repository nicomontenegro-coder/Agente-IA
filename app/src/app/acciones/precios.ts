'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { db } from '@/lib/db'
import { leerNumero } from '@/lib/numeros'
import { guardarPdf, esPdf, MAXIMO_PDF } from '@/lib/archivos'
import { leerLista } from '@/lib/leer-lista'
import { familiasDe } from '@/lib/lista-venta'
import type { EstadoForm } from './compras'

const texto = (v: FormDataEntryValue | null) => {
  const s = typeof v === 'string' ? v.trim() : ''
  return s === '' ? null : s
}
const numero = (v: FormDataEntryValue | null) => leerNumero(typeof v === 'string' ? v : null)

/** Sube la lista de precios de un proveedor y la lee completa. */
export async function subirLista(_e: EstadoForm, datos: FormData): Promise<EstadoForm> {
  const proveedorId = texto(datos.get('proveedorId'))
  if (!proveedorId) return { error: 'Selecciona el proveedor' }
  const archivo = datos.get('pdf')
  if (!(archivo instanceof File) || archivo.size === 0) return { error: 'Selecciona el PDF de la lista' }
  if (archivo.size > MAXIMO_PDF) return { error: 'El PDF supera el máximo de 30 MB' }
  const contenido = Buffer.from(await archivo.arrayBuffer())
  if (!esPdf(contenido)) return { error: 'El archivo no es un PDF válido' }

  const r = await leerLista(contenido.toString('base64'), archivo.name)
  if (!r.ok) return { error: r.error }
  const l = r.lectura
  if (l.items.length === 0) return { error: 'No se encontraron productos en el documento' }
  const nombre = await guardarPdf(archivo)
  const fecha = l.fecha && !Number.isNaN(Date.parse(l.fecha)) ? new Date(`${l.fecha}T12:00:00`) : new Date()
  const lista = await db.listaPrecios.create({
    data: {
      proveedorId,
      archivo: nombre,
      archivoNombre: archivo.name || 'lista.pdf',
      fecha,
      validezDias: l.validezDias,
      moneda: l.moneda ?? 'USD',
      incoterm: l.incoterm,
      lugar: l.lugar,
      notas: l.dudas.length ? l.dudas.join('\n') : null,
      items: { create: l.items.map((i, posicion) => ({ ...i, posicion })) }
    }
  })
  revalidatePath('/precios')
  redirect(`/precios/${lista.id}`)
}

/** Crea una lista de venta desde una lista del proveedor, con una fila por familia. */
export async function crearListaVenta(listaId: string): Promise<void> {
  const lista = await db.listaPrecios.findUnique({ where: { id: listaId }, include: { items: true, proveedor: true } })
  if (!lista) return
  const v = await db.listaVenta.create({
    data: {
      listaPreciosId: listaId,
      titulo: `Lista de precios ${lista.proveedor.nombre}`,
      familias: { create: familiasDe(lista.items).map((f) => ({ familia: f.familia })) }
    }
  })
  redirect(`/precios/venta/${v.id}`)
}

/** Guarda los parámetros de la lista de venta: tipo de cambio, condiciones, factor y margen por familia. */
export async function guardarListaVenta(ventaId: string, _e: EstadoForm, datos: FormData): Promise<EstadoForm> {
  const titulo = texto(datos.get('titulo'))
  if (!titulo) return { error: 'Ingresa el título de la lista' }
  const tipoCambio = numero(datos.get('tipoCambio'))
  if (tipoCambio != null && tipoCambio <= 0) return { error: 'El tipo de cambio debe ser mayor que cero' }
  const factor = numero(datos.get('factor'))
  const factorOrigen = texto(datos.get('factorOrigen'))
  if (factor != null && factor < 1) return { error: 'El factor no puede ser menor que 1: el costo puesto en bodega nunca es menor que el FOB' }
  if (factor != null && !factorOrigen) return { error: 'Indica de dónde sale el factor' }
  const familias = datos.getAll('familia')
  const margenes = datos.getAll('margen')
  const unidades = datos.getAll('unidadVenta')
  const contenidos = datos.getAll('contenido')
  const filas = familias.map((f, k) => ({
    familia: String(f),
    margenPct: numero(margenes[k] ?? null),
    unidadVenta: texto(unidades[k] ?? null),
    contenido: numero(contenidos[k] ?? null)
  }))
  for (const f of filas) {
    if (f.margenPct != null && (f.margenPct < 0 || f.margenPct >= 100)) return { error: `${f.familia}: el margen debe estar entre 0 y 99%` }
    if (f.unidadVenta && !(f.contenido && f.contenido > 0)) return { error: `${f.familia}: indica cuánto trae cada ${f.unidadVenta}` }
    if (!f.unidadVenta && f.contenido != null) return { error: `${f.familia}: indica la unidad de venta (por ejemplo, tira de 4 m)` }
  }
  await db.$transaction([
    db.listaVenta.update({
      where: { id: ventaId },
      data: {
        titulo,
        tipoCambio,
        factor,
        factorOrigen,
        entrega: texto(datos.get('entrega')),
        condiciones: texto(datos.get('condiciones')),
        validezDias: (() => { const d = numero(datos.get('validezDias')); return d == null ? null : Math.round(d) })()
      }
    }),
    ...filas.map((f) => db.listaVentaFamilia.update({ where: { listaVentaId_familia: { listaVentaId: ventaId, familia: f.familia } }, data: f }))
  ])
  revalidatePath(`/precios/venta/${ventaId}`)
  return { ok: 'Lista guardada' }
}
