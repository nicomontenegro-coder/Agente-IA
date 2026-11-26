/**
 * Revisión de una cotización leída por la IA, e indicadores para comparar
 * ofertas que cada proveedor cubica distinto (como un galpón).
 *
 * La IA lee; la app verifica. Un número mal leído que entra solo a una orden
 * de compra es el error que no se puede permitir, así que aquí se rehacen las
 * cuentas del documento: cada ítem (cantidad × precio = monto) y los totales.
 *
 * Funciones puras.
 */

export interface LineaDesglose {
  descripcion: string
  unidad: string | null
  cantidad: number | null
  precioUnitario: number | null
  monto: number | null
}

const dos = (x: number) => new Intl.NumberFormat('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(x)
const redondear = (x: number) => Math.round(x * 100) / 100
/** Medio centavo por línea, y un centavo por ítem en las sumas: el documento redondea. */
const cerca = (a: number, b: number, n = 1) => Math.abs(a - b) <= 0.01 * Math.max(1, n)

export function revisarDesglose(
  lineas: LineaDesglose[],
  doc: { subtotal: number | null; gastos: number | null; total: number | null }
): { suma: number | null; problemas: string[] } {
  if (lineas.length === 0) return { suma: null, problemas: [] }
  const problemas: string[] = []
  lineas.forEach((l, i) => {
    if (l.cantidad == null || l.precioUnitario == null || l.monto == null) return
    const calculado = redondear(l.cantidad * l.precioUnitario)
    if (!cerca(calculado, l.monto)) {
      const c = new Intl.NumberFormat('es-CL', { maximumFractionDigits: 3 }).format(l.cantidad)
      problemas.push(`Ítem ${i + 1} (${l.descripcion}): ${c} × ${dos(l.precioUnitario).replace(/,00$/, '')} = ${dos(calculado)}, pero el documento dice ${dos(l.monto)}`)
    }
  })
  const montos = lineas.map((l) => l.monto)
  const suma = montos.every((m) => m != null) ? redondear(montos.reduce((a: number, m) => a + (m ?? 0), 0)) : null
  if (suma != null && doc.subtotal != null && !cerca(suma, doc.subtotal, lineas.length)) {
    problemas.push(`La suma de los ítems (${dos(suma)}) no coincide con el subtotal del documento (${dos(doc.subtotal)})`)
  }
  if (doc.subtotal != null && doc.total != null) {
    const esperado = redondear(doc.subtotal + (doc.gastos ?? 0))
    if (!cerca(esperado, doc.total)) {
      problemas.push(
        doc.gastos
          ? `Subtotal ${dos(doc.subtotal)} + gastos ${dos(doc.gastos)} = ${dos(esperado)}, pero el documento dice ${dos(doc.total)}`
          : `El subtotal ${dos(doc.subtotal)} no coincide con el total del documento (${dos(doc.total)})`
      )
    }
  }
  return { suma, problemas }
}

const ES_TONELADA = /^(t|ton|tons|tonne|tonnes|tonelada|toneladas|mt)\.?$/i

/** Toneladas de acero según el desglose: las líneas cotizadas por tonelada. Null si no hay. */
export function toneladas(lineas: LineaDesglose[]): number | null {
  const enTon = lineas.filter((l) => l.unidad && ES_TONELADA.test(l.unidad.trim()) && l.cantidad != null)
  if (enTon.length === 0) return null
  return redondear(enTon.reduce((a, l) => a + (l.cantidad ?? 0), 0))
}

/** Un total dividido por la medida de referencia (m² del galpón, metros de tubería…). */
export function porMedida(total: number | null, medida: number | null): number | null {
  if (total == null || medida == null || !(medida > 0)) return null
  return redondear(total / medida)
}

/**
 * Lo que se compara y se compra son las líneas que pidió GESI. Si su total no
 * da el total del documento, a una línea le falta precio o se le puso otro.
 */
export function cuadraConPedido(totalLineas: number | null, totalDocumento: number | null, moneda = 'USD'): string | null {
  if (totalLineas == null || totalDocumento == null) return null
  if (cerca(totalLineas, totalDocumento)) return null
  return `Los precios por línea suman ${moneda} ${dos(totalLineas)}, pero el documento dice ${moneda} ${dos(totalDocumento)}`
}

/**
 * El precio por la unidad que pidió GESI. Si el documento cotiza un monto
 * global (el galpón completo) y GESI lo pidió en m², la división la hace la
 * app y sin redondear a centavos: 68,91 × 722 m² ya no da el total del
 * documento, y la verificación lo marcaría como error.
 */
export function precioDeLinea(leido: { precioUnitario: number | null; montoTotal: number | null }, cantidad: number): number | null {
  if (leido.precioUnitario != null) return leido.precioUnitario
  if (leido.montoTotal == null || !(cantidad > 0)) return null
  return Math.round((leido.montoTotal / cantidad) * 1e6) / 1e6
}

/** Las formas de escribir cada unidad, en inglés y en español. */
const UNIDADES: string[][] = [
  ['m', 'mt', 'mts', 'meter', 'meters', 'metre', 'metres', 'metro', 'metros', 'ml'],
  ['u', 'un', 'und', 'unidad', 'unidades', 'pc', 'pcs', 'piece', 'pieces', 'pieza', 'piezas', 'pza', 'pzas', 'ea', 'each'],
  ['m2', 'm²', 'sqm', 'sq m', 'square meter', 'square meters', 'metro cuadrado', 'metros cuadrados'],
  ['t', 'ton', 'tons', 'tonne', 'tonnes', 'tonelada', 'toneladas', 'mt.'],
  ['kg', 'kgs', 'kilo', 'kilos', 'kilogram', 'kilograms', 'kilogramo', 'kilogramos'],
  ['set', 'sets', 'juego', 'juegos', 'conjunto', 'lot', 'lote']
]
const unidadNormal = (u: string) => {
  const x = u.trim().toLowerCase().replace(/\.$/, '')
  const grupo = UNIDADES.find((g) => g.includes(x))
  return grupo ? grupo[0] : x
}

/**
 * Si el documento da el precio en otra unidad que la pedida, el total sale
 * mal sin que nada se vea raro: la lista de Lvzhou cobra el tubo por metro y
 * la compra lo pedía en unidades. Null si coinciden o si no se sabe.
 */
export function avisoUnidad(pedida: string, enDocumento: string | null): string | null {
  if (!enDocumento || !enDocumento.trim()) return null
  if (unidadNormal(pedida) === unidadNormal(enDocumento)) return null
  return `El documento da el precio por ${enDocumento.trim()} y la compra pide en ${pedida}: revisa la conversión`
}
