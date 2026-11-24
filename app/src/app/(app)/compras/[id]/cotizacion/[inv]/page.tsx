import { notFound } from 'next/navigation'

import { Encabezado, Volver } from '@/componentes/ui'
import FormAccion from '@/componentes/form-accion'
import { compraCompleta } from '@/lib/compras-db'
import { codigo } from '@/lib/codigos'
import { INCOTERM_LABEL } from '@/lib/incoterms'
import { fechaInput, conUnidad } from '@/lib/formato'
import { registrarCotizacion } from '@/app/acciones/compras'

export const dynamic = 'force-dynamic'

export default async function PaginaCotizacion({ params }: { params: Promise<{ id: string; inv: string }> }) {
  const { id, inv } = await params
  const c = await compraCompleta(id)
  const i = c?.invitaciones.find((x) => x.id === inv)
  if (!c || !i) notFound()
  const cot = i.cotizacion
  const precio = (lineaId: string) => cot?.lineas.find((l) => l.compraLineaId === lineaId)?.precioUnitario
  const lc = (cot?.aceptaCartaCredito ?? i.proveedor.aceptaCartaCredito)
  const fmt = (x: number | null | undefined) => (x == null ? '' : String(x).replace('.', ','))

  return (
    <div className="space-y-5 max-w-4xl">
      <Volver href={`/compras/${c.id}`}>{codigo('compra', c.numero)}</Volver>
      <Encabezado titulo={`Cotización de ${i.proveedor.nombre}`} descripcion="Copia lo que dice su documento. Un dato que no viene, déjalo en blanco: no lo supongas." />
      <FormAccion accion={registrarCotizacion.bind(null, c.id, i.id)} etiqueta="Guardar cotización" clase="space-y-5">
        <section className="panel p-5 grid gap-3 sm:grid-cols-3">
          <label className="text-sm space-y-1">
            <span className="font-medium">Recibida el</span>
            <input name="recibidaEl" type="date" className="campo" defaultValue={fechaInput(cot?.recibidaEl ?? new Date())} />
          </label>
          <label className="text-sm space-y-1">
            <span className="font-medium">N° o referencia del proveedor</span>
            <input name="referencia" className="campo" defaultValue={cot?.referencia ?? ''} />
          </label>
          <label className="text-sm space-y-1">
            <span className="font-medium">Moneda</span>
            <input name="moneda" className="campo" defaultValue={cot?.moneda ?? 'USD'} />
          </label>
          <label className="text-sm space-y-1">
            <span className="font-medium">Incoterm que cotizó</span>
            <select name="incoterm" className="campo" defaultValue={cot?.incoterm ?? c.incoterm}>
              {Object.entries(INCOTERM_LABEL).map(([k, v]) => (
                <option key={k} value={k}>
                  {k} — {v}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm space-y-1">
            <span className="font-medium">Lugar</span>
            <input name="lugar" className="campo" defaultValue={cot?.lugar ?? c.lugar ?? ''} />
          </label>
          <label className="text-sm space-y-1">
            <span className="font-medium">¿Acepta carta de crédito?</span>
            <select name="aceptaCartaCredito" className="campo" defaultValue={lc === true ? 'SI' : lc === false ? 'NO' : ''}>
              <option value="">No lo dice</option>
              <option value="SI">Sí</option>
              <option value="NO">No</option>
            </select>
          </label>
          <label className="text-sm space-y-1">
            <span className="font-medium">Plazo de producción (días)</span>
            <input name="leadTimeDias" className="campo num" inputMode="numeric" defaultValue={cot?.leadTimeDias ?? ''} />
          </label>
          <label className="text-sm space-y-1">
            <span className="font-medium">Validez (días)</span>
            <input name="validezDias" className="campo num" inputMode="numeric" defaultValue={cot?.validezDias ?? ''} />
          </label>
          <label className="text-sm space-y-1">
            <span className="font-medium">MOQ</span>
            <input name="moq" className="campo" defaultValue={cot?.moq ?? ''} placeholder="1 contenedor de 40'" />
          </label>
        </section>
        <section className="panel scroll-x">
          <h2 className="font-semibold text-sm px-4 pt-3 pb-2">Precio por producto</h2>
          <table className="tabla">
            <thead>
              <tr>
                <th>Producto</th>
                <th className="text-right">Cantidad pedida</th>
                <th className="text-right">Precio unitario</th>
              </tr>
            </thead>
            <tbody>
              {c.lineas.map((l) => (
                <tr key={l.id}>
                  <td>
                    {l.descripcion}
                    {l.especificacion && <div className="text-xs text-[var(--texto-tenue)]">{l.especificacion}</div>}
                  </td>
                  <td className="text-right num">{conUnidad(l.cantidad, l.unidad, l.cantidad % 1 ? 2 : 0)}</td>
                  <td className="text-right">
                    <input name={`precio-${l.id}`} className="campo num w-32 ml-auto" inputMode="decimal" defaultValue={fmt(precio(l.id))} aria-label={`Precio de ${l.descripcion}`} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
        <label className="text-sm space-y-1 block">
          <span className="font-medium">Notas</span>
          <textarea name="notas" rows={2} className="campo" defaultValue={cot?.notas ?? ''} placeholder="Descuento por volumen, condiciones especiales…" />
        </label>
      </FormAccion>
    </div>
  )
}
