/**
 * De la lista de precios del proveedor (FOB) a la lista de venta.
 *
 *   landed estimado = FOB × factor de internación de la familia
 *   precio de venta = landed en pesos ÷ (1 − margen)
 *
 * El factor va por familia y no uno para todo: el flete se cobra por volumen,
 * y un metro de tubo lleva mucho más aire por dólar que un codo. Un factor
 * único abarata los tubos y encarece los codos.
 *
 * El margen es sobre el precio de venta, como en las ofertas de Importa: 35%
 * de margen sobre un costo de 65 da 100, no 87,75 (eso sería markup).
 *
 * Funciones puras.
 */

import { seccionDe } from './normas-ppr'

export interface ParametrosFamilia {
  factor: number | null
  margenPct: number | null
}

export interface PrecioVenta {
  landedUsd: number
  landedClp: number
  /** Neto, en pesos sin decimales. */
  precioClp: number
}

const redondear = (x: number, d: number) => Math.round(x * 10 ** d) / 10 ** d

export function precioVenta(fob: number | null, f: ParametrosFamilia, tipoCambio: number | null): PrecioVenta | null {
  if (fob == null || !(fob > 0)) return null
  if (f.factor == null || !(f.factor > 0)) return null
  if (f.margenPct == null || f.margenPct < 0 || f.margenPct >= 100) return null
  if (tipoCambio == null || !(tipoCambio > 0)) return null
  const landedUsd = redondear(fob * f.factor, 6)
  const landedClp = redondear(landedUsd * tipoCambio, 4)
  return { landedUsd, landedClp, precioClp: Math.round(landedClp / (1 - f.margenPct / 100)) }
}

/** Hasta cuándo vale la lista del proveedor, y cuántos días le quedan (negativo si venció). */
export function vigencia(fecha: Date, validezDias: number | null, hoy = new Date()): { vence: Date | null; vencida: boolean; dias: number | null } {
  if (validezDias == null) return { vence: null, vencida: false, dias: null }
  const vence = new Date(fecha)
  vence.setDate(vence.getDate() + validezDias)
  const dia = (d: Date) => Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())
  const dias = Math.round((dia(vence) - dia(hoy)) / 86400000)
  return { vence, vencida: dias < 0, dias }
}

export function familiasDe(items: { familia: string }[]): { familia: string; productos: number }[] {
  const cuenta = new Map<string, number>()
  for (const i of items) cuenta.set(i.familia, (cuenta.get(i.familia) ?? 0) + 1)
  return [...cuenta].map(([familia, productos]) => ({ familia, productos }))
}

export interface ItemLista {
  familia: string
  descripcion: string
  especificacion: string | null
  unidad: string
  precio: number | null
  /** PN aprobado a mano; si no hay, se calcula de la medida. */
  pn?: string | null
}

/** Cómo se vende una familia: el margen y, si no se vende en la unidad del proveedor, la unidad de venta. */
export interface VentaFamilia {
  familia: string
  margenPct: number | null
  /** «tira de 4 m». Null: se vende en la unidad del proveedor. */
  unidadVenta: string | null
  /** Cuántas unidades del proveedor trae una unidad de venta: 4 metros por tira. */
  contenido: number | null
}

/**
 * Las filas de una lista de venta: la pantalla interna y el documento para
 * clientes llaman a esta misma función, para que nunca digan dos precios
 * distintos del mismo producto.
 *
 * El factor y el tipo de cambio son uno para toda la lista; el margen y la
 * unidad de venta van por familia. El tubo se cotiza por metro y se vende por
 * tira: el costo de la tira es el del metro por 4, y el margen va encima.
 * Solo entran las medidas con precio del proveedor y las familias con margen.
 */
export function filasDeVenta<T extends ItemLista>(
  items: T[],
  general: { factor: number | null; tipoCambio: number | null },
  familias: VentaFamilia[]
): (T & PrecioVenta & { unidadVenta: string; fobVenta: number; seccion: string })[] {
  const por = new Map(familias.map((f) => [f.familia, f]))
  return items.flatMap((i) => {
    const f = por.get(i.familia)
    if (!f || i.precio == null) return []
    const porUnidad = f.unidadVenta && f.contenido && f.contenido > 0
    const fobVenta = porUnidad ? redondear(i.precio * f.contenido!, 6) : i.precio
    const p = precioVenta(fobVenta, { factor: general.factor, margenPct: f.margenPct }, general.tipoCambio)
    return p ? [{ ...i, ...p, fobVenta, unidadVenta: porUnidad ? f.unidadVenta! : i.unidad, seccion: seccionDe(i.familia, i.especificacion, i.pn ?? null) }] : []
  })
}

/**
 * El piso de una negociación: el precio con el margen mínimo, y cuánto se
 * puede descontar del precio de lista sin bajar de él. Los márgenes son sobre
 * el precio, así que no se restan: con 65% de lista y 35% mínimo, el descuento
 * máximo es 46,2%, no 30%.
 */
export function pisoDeVenta(landedClp: number, precioLista: number, margenMinimoPct: number | null): { precioMinimo: number; descuentoMaxPct: number } | null {
  if (margenMinimoPct == null || margenMinimoPct < 0 || margenMinimoPct >= 100 || !(precioLista > 0)) return null
  const precioMinimo = Math.ceil(landedClp / (1 - margenMinimoPct / 100))
  if (precioMinimo > precioLista) return { precioMinimo, descuentoMaxPct: 0 }
  return { precioMinimo, descuentoMaxPct: Math.floor((1 - precioMinimo / precioLista) * 1000) / 10 }
}

/** El margen que queda sobre el costo después de un descuento a un canal: no es la resta. */
export function margenConDescuento(margenListaPct: number, descuentoPct: number): number {
  return Math.round((1 - (1 - margenListaPct / 100) / (1 - descuentoPct / 100)) * 1000) / 10
}

/** El precio de un canal (ferreterías, instaladores): el de lista con su descuento, en pesos. */
export function precioCanal(precioLista: number, descuentoPct: number): number {
  return Math.round(precioLista * (1 - descuentoPct / 100))
}

/** Las filas agrupadas por sección, en el orden en que aparecen. */
export function porSeccion<F extends { seccion: string }>(filas: F[]): { seccion: string; filas: F[] }[] {
  const grupos = new Map<string, F[]>()
  for (const f of filas) grupos.set(f.seccion, [...(grupos.get(f.seccion) ?? []), f])
  return [...grupos].map(([seccion, filas]) => ({ seccion, filas }))
}
