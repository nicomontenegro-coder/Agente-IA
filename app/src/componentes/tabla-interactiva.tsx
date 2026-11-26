'use client'

import { useMemo, useState } from 'react'

import { ordenar, coincide, type Valor } from '@/lib/ordenar'

export interface Columna {
  clave: string
  titulo: string
  derecha?: boolean
  destacada?: boolean
}

export interface Fila {
  id: string
  /** Si las filas traen sección, la tabla las agrupa y ordena dentro de cada una. */
  seccion?: string
  /** Lo que se muestra (ya formateado) y el valor con que se ordena. */
  celdas: Record<string, { texto: string; valor: Valor; sub?: string }>
}

/**
 * Una tabla con lo más usado de los filtros de Excel: clic en un encabezado
 * ordena (otro clic invierte), un buscador y un filtro por grupo. Ordena y
 * filtra lo que ya calculó el servidor: no calcula nada.
 */
export default function TablaInteractiva({ columnas, filas, filtrarPor, etiquetaFiltro }: { columnas: Columna[]; filas: Fila[]; filtrarPor: string; etiquetaFiltro: string }) {
  const [orden, setOrden] = useState<{ clave: string; desc: boolean } | null>(null)
  const [busqueda, setBusqueda] = useState('')
  const [grupo, setGrupo] = useState('')

  // El buscador mira solo las columnas de texto: buscar «20» es buscar la
  // medida, no cualquier precio que tenga un 20 adentro.
  const textuales = useMemo(() => columnas.filter((c) => !c.derecha).map((c) => c.clave), [columnas])
  const grupos = useMemo(() => [...new Set(filas.map((f) => f.seccion ?? String(f.celdas[filtrarPor]?.valor ?? '')))].filter(Boolean), [filas, filtrarPor])
  const visibles = useMemo(() => {
    const filtradas = filas.filter(
      (f) => (!grupo || (f.seccion ?? String(f.celdas[filtrarPor]?.valor ?? '')) === grupo) && coincide(textuales.flatMap((k) => [f.celdas[k]?.texto ?? null, f.celdas[k]?.sub ?? null]), busqueda)
    )
    return orden ? ordenar(filtradas, (f) => f.celdas[orden.clave]?.valor ?? null, orden.desc) : filtradas
  }, [filas, grupo, busqueda, orden, filtrarPor, textuales])
  const secciones = useMemo(() => {
    const m = new Map<string, Fila[]>()
    for (const f of visibles) m.set(f.seccion ?? '', [...(m.get(f.seccion ?? '') ?? []), f])
    return [...m]
  }, [visibles])

  const clic = (clave: string) => setOrden((o) => (o?.clave !== clave ? { clave, desc: false } : o.desc ? null : { clave, desc: true }))

  return (
    <div>
      <div className="flex flex-wrap items-end gap-3 px-4 py-3">
        <label className="text-sm space-y-1 grow min-w-40">
          <span className="font-medium">Buscar</span>
          <input className="campo" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="codo 20, PN16, tira…" />
        </label>
        <label className="text-sm space-y-1">
          <span className="font-medium">{etiquetaFiltro}</span>
          <select className="campo" value={grupo} onChange={(e) => setGrupo(e.target.value)}>
            <option value="">Todas</option>
            {grupos.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </label>
        <p className="text-xs text-[var(--texto-tenue)] basis-full">
          {visibles.length} de {filas.length} filas · clic en un encabezado para ordenar
        </p>
      </div>
      <div className="scroll-x">
        <table className="tabla">
          <thead>
            <tr>
              {columnas.map((c) => (
                <th key={c.clave} className={c.derecha ? 'text-right' : ''}>
                  <button type="button" onClick={() => clic(c.clave)} className="uppercase tracking-wide hover:text-[var(--acento)]" aria-label={`Ordenar por ${c.titulo}`}>
                    {c.titulo}
                    {orden?.clave === c.clave ? (orden.desc ? ' ↓' : ' ↑') : ''}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          {secciones.map(([seccion, fs]) => (
            <tbody key={seccion || 'todo'}>
              {seccion && (
                <tr>
                  <td colSpan={columnas.length} className="font-semibold bg-[var(--panel-alt)]">
                    {seccion}
                  </td>
                </tr>
              )}
              {fs.map((f) => (
                <tr key={f.id}>
                  {columnas.map((c) => {
                    const celda = f.celdas[c.clave]
                    return (
                      <td key={c.clave} className={`${c.derecha ? 'text-right num' : ''} ${c.destacada ? 'font-semibold' : ''}`}>
                        {celda?.texto ?? '—'}
                        {celda?.sub && <div className="text-xs text-[var(--texto-tenue)] font-normal">{celda.sub}</div>}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          ))}
        </table>
      </div>
    </div>
  )
}
