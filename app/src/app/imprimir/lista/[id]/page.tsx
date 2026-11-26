import { notFound } from 'next/navigation'

import { db } from '@/lib/db'
import { empresa } from '@/lib/compras-db'
import { filasDeVenta, familiasDe } from '@/lib/lista-venta'
import Botones from './botones'

export const dynamic = 'force-dynamic'

const fechaDoc = (d: Date) => new Intl.DateTimeFormat('es-CL', { day: 'numeric', month: 'long', year: 'numeric' }).format(d)
const pesos = (x: number) => new Intl.NumberFormat('es-CL', { maximumFractionDigits: 0 }).format(x)
/** La unidad como la lee un cliente: «por metro», no «m». */
const UNIDAD: Record<string, string> = { m: 'metro', mt: 'metro', meter: 'metro', pieza: 'unidad', pc: 'unidad', pcs: 'unidad', piece: 'unidad', u: 'unidad', kg: 'kg' }

/**
 * La lista de precios para clientes. Solo producto, medida, unidad y precio:
 * nunca el costo, el factor ni el margen.
 */
export default async function ImprimirLista({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [v, e] = await Promise.all([
    db.listaVenta.findUnique({ where: { id }, include: { familias: true, listaPrecios: { include: { items: { orderBy: { posicion: 'asc' } } } } } }),
    empresa()
  ])
  if (!v) notFound()
  const filas = filasDeVenta(v.listaPrecios.items, v.familias, v.tipoCambio)
  const familias = familiasDe(filas)
  const vence = v.validezDias != null ? new Date(v.actualizadoEn.getTime() + v.validezDias * 86400000) : null

  return (
    <>
      <Botones id={v.id} />
      <div className="hoja">
        <style>{`
          body { background: #e5e7eb; }
          .hoja { max-width: 210mm; margin: 16px auto; background: #fff; padding: 14mm; color: #1f2937; font-size: 10pt; }
          .hoja h1 { font-size: 16pt; color: #1d4ed8; margin: 0; }
          .hoja h2 { font-size: 10pt; color: #fff; background: #0f766e; padding: 4px 8px; border-radius: 4px; margin: 14px 0 6px; }
          .hoja table { width: 100%; border-collapse: collapse; font-size: 9.5pt; }
          .hoja th { background: #ecfdf5; text-align: left; padding: 4px 6px; border: 1px solid #d1d5db; }
          .hoja td { padding: 4px 6px; border: 1px solid #e5e7eb; }
          .hoja .der { text-align: right; font-variant-numeric: tabular-nums; }
          .hoja .pie { margin-top: 14px; font-size: 9pt; color: #4b5563; }
          .botones { max-width: 210mm; margin: 0 auto; display: flex; gap: 8px; justify-content: flex-end; }
          @media print { body { background: #fff; } .botones { display: none; } .hoja { margin: 0; padding: 0; } h2 { break-after: avoid; } tr { break-inside: avoid; } }
        `}</style>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start' }}>
          <div>
            <strong style={{ fontSize: '13pt' }}>{e.nombre}</strong>
            <div>{[e.rut && `RUT ${e.rut}`, e.direccion].filter(Boolean).join(' · ')}</div>
            <div>{[e.contacto, e.email, e.telefono].filter(Boolean).join(' · ')}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <h1>LISTA DE PRECIOS</h1>
            <div>{fechaDoc(v.actualizadoEn)}</div>
          </div>
        </div>
        <p style={{ fontSize: '12pt', fontWeight: 600, margin: '14px 0 4px' }}>{v.titulo}</p>
        {(v.entrega || v.condiciones || vence) && (
          <table style={{ marginBottom: 6 }}>
            <tbody>
              {v.entrega && (
                <tr>
                  <th style={{ width: '25%' }}>Entrega</th>
                  <td>{v.entrega}</td>
                </tr>
              )}
              {v.condiciones && (
                <tr>
                  <th>Condiciones</th>
                  <td>{v.condiciones}</td>
                </tr>
              )}
              {vence && (
                <tr>
                  <th>Válida hasta</th>
                  <td>{fechaDoc(vence)}</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
        {familias.map((f) => (
          <div key={f.familia}>
            <h2>{f.familia}</h2>
            <table>
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Medida</th>
                  <th>Unidad</th>
                  <th className="der">Precio neto CLP</th>
                </tr>
              </thead>
              <tbody>
                {filas
                  .filter((x) => x.familia === f.familia)
                  .map((x, k) => (
                    <tr key={k}>
                      <td>{x.descripcion}</td>
                      <td>{[x.especificacion, x.pn].filter(Boolean).join(' · ') || '—'}</td>
                      <td>{UNIDAD[x.unidad.toLowerCase()] ?? x.unidad}</td>
                      <td className="der">${pesos(x.precioClp)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        ))}
        <p className="pie">Precios netos en pesos chilenos, más IVA. Sujetos a disponibilidad de stock del embarque.</p>
      </div>
    </>
  )
}
