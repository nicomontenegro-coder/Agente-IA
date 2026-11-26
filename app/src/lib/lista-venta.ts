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
}

/**
 * Las filas de una lista de venta: la pantalla interna y el documento para
 * clientes llaman a esta misma función, para que nunca digan dos precios
 * distintos del mismo producto. Solo entran las medidas con precio del
 * proveedor y las familias con factor y margen.
 */
export function filasDeVenta<T extends ItemLista>(
  items: T[],
  familias: ({ familia: string } & ParametrosFamilia)[],
  tipoCambio: number | null
): (T & PrecioVenta)[] {
  const por = new Map(familias.map((f) => [f.familia, f]))
  return items.flatMap((i) => {
    const f = por.get(i.familia)
    const p = f ? precioVenta(i.precio, f, tipoCambio) : null
    return p ? [{ ...i, ...p }] : []
  })
}
