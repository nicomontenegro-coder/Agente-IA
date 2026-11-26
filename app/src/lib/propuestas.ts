/**
 * Los cambios que propone el asistente. El asistente no escribe en la base:
 * deja una propuesta, y Nico la aprueba o la descarta. Aquí se valida que la
 * propuesta toque solo productos de la lista abierta y campos que se pueden
 * cambiar, y se arma lo que se mostrará (antes → después).
 *
 * Funciones puras.
 */

export const CAMPOS_EDITABLES = ['pn', 'descripcion', 'especificacion', 'familia', 'unidad'] as const
export type CampoEditable = (typeof CAMPOS_EDITABLES)[number]

export interface Cambio {
  itemId: string
  campo: CampoEditable
  valor: string
}

export type ItemEditable = { id: string } & Record<CampoEditable, string | null>

export function prepararCambios(cambios: Cambio[], items: ItemEditable[]): { ok: true; cambios: (Cambio & { antes: string | null })[] } | { ok: false; error: string } {
  if (cambios.length === 0) return { ok: false, error: 'La propuesta no trae cambios' }
  const por = new Map(items.map((i) => [i.id, i]))
  const listos: (Cambio & { antes: string | null })[] = []
  for (const c of cambios) {
    const item = por.get(c.itemId)
    if (!item) return { ok: false, error: `El producto ${c.itemId} no es de esta lista` }
    if (!CAMPOS_EDITABLES.includes(c.campo)) return { ok: false, error: `El campo ${c.campo} no se puede cambiar` }
    const valor = c.valor.trim()
    if (!valor && c.campo !== 'pn') return { ok: false, error: `El campo ${c.campo} no puede quedar vacío` }
    if ((item[c.campo] ?? '') === valor) continue
    listos.push({ ...c, valor, antes: item[c.campo] })
  }
  if (listos.length === 0) return { ok: false, error: 'Los cambios propuestos ya están aplicados' }
  return { ok: true, cambios: listos }
}
