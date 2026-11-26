/**
 * Ordenar y filtrar tablas, como en Excel: clic en un encabezado ordena de
 * menor a mayor, otro clic de mayor a menor. Funciones puras.
 */

export type Valor = string | number | null

/** Compara como lo haría una persona: números como números, textos sin importar tildes ni mayúsculas, vacíos al final. */
export function comparar(a: Valor, b: Valor): number {
  if (a == null || a === '') return b == null || b === '' ? 0 : 1
  if (b == null || b === '') return -1
  if (typeof a === 'number' && typeof b === 'number') return a - b
  return String(a).localeCompare(String(b), 'es', { numeric: true, sensitivity: 'base' })
}

export function ordenar<T>(filas: T[], valor: (f: T) => Valor, descendente: boolean): T[] {
  // Los vacíos van al final en los dos sentidos: un «sin precio» no es el más caro.
  return [...filas].sort((x, y) => {
    const a = valor(x)
    const b = valor(y)
    const vacioA = a == null || a === ''
    const vacioB = b == null || b === ''
    if (vacioA || vacioB) return comparar(a, b)
    return descendente ? comparar(b, a) : comparar(a, b)
  })
}

/** Una fila pasa el buscador si cada palabra buscada aparece en alguno de sus textos. */
export function coincide(textos: Valor[], busqueda: string): boolean {
  const normal = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  const todo = normal(textos.filter((t) => t != null).join(' '))
  return normal(busqueda).split(/\s+/).filter(Boolean).every((p) => todo.includes(p))
}
