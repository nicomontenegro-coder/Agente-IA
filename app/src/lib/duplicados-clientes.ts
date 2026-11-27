/**
 * Clientes duplicados: avisar antes de crear uno repetido, y fusionar dos
 * fichas cuando ya se creó. Funciones puras.
 */

const normal = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

/** Lo que dice la forma legal o el rubro, y no distingue a una empresa de otra. */
const RELLENO = new Set([
  'ltda', 'limitada', 'spa', 'sa', 'eirl', 'cia', 'y', 'de', 'del', 'la', 'el', 'los', 'las', 'sociedad', 'comercial', 'empresa', 'empresas',
  'ferreteria', 'ferreterias', 'constructora', 'construcciones', 'instalaciones', 'instalador', 'distribuidora', 'importadora', 'inversiones', 'servicios'
])

/** Las palabras que identifican al cliente: «Ferretería Austral Ltda.» → austral. */
export function nucleo(nombre: string): string[] {
  return normal(nombre)
    .replace(/[^a-z0-9]+/g, ' ')
    .split(' ')
    .filter((p) => p.length > 1 && !RELLENO.has(p))
}

export interface ClienteResumen {
  id: string
  nombre: string
  rut: string | null
}

/**
 * Los clientes que podrían ser el mismo: comparten todas las palabras que
 * identifican al más corto. Con RUT distintos son empresas distintas, aunque
 * se llamen parecido: no se avisa.
 */
export function posiblesDuplicados(c: { id?: string | null; nombre: string; rut: string | null }, otros: ClienteResumen[]): ClienteResumen[] {
  const n = nucleo(c.nombre)
  if (!n.length) return []
  return otros.filter((o) => {
    if (o.id === c.id) return false
    if (c.rut && o.rut) return c.rut === o.rut
    const m = nucleo(o.nombre)
    if (!m.length) return false
    const [corto, largo] = n.length <= m.length ? [n, m] : [m, n]
    return corto.every((p) => largo.includes(p))
  })
}

export const CAMPOS_FUSION = ['nombre', 'rut', 'canalId', 'ciudad', 'direccion', 'contacto', 'telefono', 'email', 'notas', 'etapa', 'proximaAccion'] as const
export type CampoFusion = (typeof CAMPOS_FUSION)[number]
export type DatosCliente = Record<CampoFusion, string | null>

/**
 * Cómo queda la ficha al fusionar «origen» en «destino»: lo que falta en el
 * destino se completa con el origen; donde los dos tienen datos distintos hay
 * un conflicto, y por defecto gana el destino hasta que se elija otra cosa.
 * Las notas no compiten: se juntan.
 */
export function combinarClientes(destino: DatosCliente, origen: DatosCliente): { resultado: DatosCliente; conflictos: CampoFusion[] } {
  const resultado = { ...destino }
  const conflictos: CampoFusion[] = []
  for (const k of CAMPOS_FUSION) {
    const d = destino[k]
    const o = origen[k]
    if (o == null || o === '' || o === d) continue
    if (d == null || d === '') resultado[k] = o
    else if (k === 'notas') resultado.notas = `${d}\n${o}`
    else conflictos.push(k)
  }
  return { resultado, conflictos }
}
