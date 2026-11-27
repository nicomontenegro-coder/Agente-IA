'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'

import { ordenar, coincide, type Valor } from '@/lib/ordenar'
import { aCsv, BOM, nombreArchivo, type Celda } from '@/lib/exportar'

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
  /** Si la fila lleva a otra pantalla, la primera columna es un enlace. */
  enlace?: string
  /** Lo que se muestra (ya formateado) y el valor con que se ordena. */
  celdas: Record<string, { texto: string; valor: Valor; sub?: string }>
}

/**
 * Una tabla con lo más usado de los filtros de Excel: clic en un encabezado
 * ordena (otro clic invierte), un buscador y un filtro por grupo. Ordena y
 * filtra lo que ya calculó el servidor: no calcula nada.
 */
export default function TablaInteractiva({ columnas, filas, filtrarPor, etiquetaFiltro, archivo = 'tabla' }: { columnas: Columna[]; filas: Fila[]; filtrarPor: string; etiquetaFiltro: string; archivo?: string }) {
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

  /**
   * Exporta lo que se está viendo (con el orden y el filtro aplicados). Los
   * números van como números para que Excel los sume; la línea secundaria de
   * una celda va en su propia columna.
   */
  function exportar() {
    const conSub = columnas.filter((c) => filas.some((f) => f.celdas[c.clave]?.sub))
    const conSeccion = filas.some((f) => f.seccion)
    const encabezados = [...(conSeccion ? ['Sección'] : []), ...columnas.flatMap((c) => (conSub.includes(c) ? [c.titulo, `${c.titulo} (detalle)`] : [c.titulo]))]
    const datos: Celda[][] = visibles.map((f) => [
      ...(conSeccion ? [f.seccion ?? ''] : []),
      ...columnas.flatMap((c) => {
        const celda = f.celdas[c.clave]
        const valor: Celda = c.derecha && typeof celda?.valor === 'number' ? celda.valor : celda?.texto
        return conSub.includes(c) ? [valor, celda?.sub ?? ''] : [valor]
      })
    ])
    const blob = new Blob([BOM + aCsv(encabezados, datos)], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = nombreArchivo(grupo ? `${archivo} ${grupo}` : archivo)
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const clic = (clave: string) => setOrden((o) => (o?.clave !== clave ? { clave, desc: false } : o.desc ? null : { clave, desc: true }))

  return (
    <div>
      <div className="flex flex-wrap items-end gap-3 px-4 py-3 no-imprimir">
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
        <div className="flex gap-2">
          <button type="button" className="btn btn-neutro" onClick={exportar}>
            Exportar a Excel
          </button>
          <button type="button" className="btn btn-neutro" onClick={() => window.print()}>
            Imprimir
          </button>
        </div>
        <p className="text-xs text-[var(--texto-tenue)] basis-full">
          {visibles.length} de {filas.length} filas · clic en un encabezado para ordenar · se exporta lo que ves
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
                  {columnas.map((c, n) => {
                    const celda = f.celdas[c.clave]
                    return (
                      <td key={c.clave} className={`${c.derecha ? 'text-right num' : ''} ${c.destacada ? 'font-semibold' : ''}`}>
                        {n === 0 && f.enlace ? (
                          <Link href={f.enlace} className="font-medium hover:text-[var(--acento)]">
                            {celda?.texto ?? '—'}
                          </Link>
                        ) : (
                          celda?.texto ?? '—'
                        )}
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
