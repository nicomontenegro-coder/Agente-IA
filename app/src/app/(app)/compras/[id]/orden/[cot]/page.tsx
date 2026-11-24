import { notFound } from 'next/navigation'

import { Encabezado, Volver } from '@/componentes/ui'
import FormAccion from '@/componentes/form-accion'
import { compraCompleta, empresa } from '@/lib/compras-db'
import { db } from '@/lib/db'
import { codigo } from '@/lib/codigos'
import { formaPagoSugerida } from '@/lib/documentos'
import { numero } from '@/lib/formato'
import { emitirOrden } from '@/app/acciones/compras'

export const dynamic = 'force-dynamic'

export default async function PaginaEmitirOrden({ params }: { params: Promise<{ id: string; cot: string }> }) {
  const { id, cot } = await params
  const [c, e] = await Promise.all([compraCompleta(id), empresa()])
  const i = c?.invitaciones.find((x) => x.cotizacion?.id === cot)
  if (!c || !i || !i.cotizacion) notFound()
  const previas = await db.ordenCompra.count({ where: { cotizacion: { invitacion: { proveedorId: i.proveedorId } } } })
  const sugerida = formaPagoSugerida(previas)

  return (
    <div className="space-y-5 max-w-3xl">
      <Volver href={`/compras/${c.id}`}>{codigo('compra', c.numero)}</Volver>
      <Encabezado
        titulo={`Emitir OC a ${i.proveedor.nombre}`}
        descripcion={`Se copian los precios de su cotización${i.total != null ? ` (${i.cotizacion.moneda} ${numero(i.total)}, ${i.cotizacion.incoterm} ${i.cotizacion.lugar ?? ''})` : ''}. Desde aquí quedan congelados.`}
      />
      {i.evaluacion.pendientes.length > 0 && (
        <p className="panel p-4 text-sm bg-[var(--alerta-suave)]">Ojo: {i.evaluacion.pendientes.join('; ')}.</p>
      )}
      <FormAccion accion={emitirOrden.bind(null, c.id, cot)} etiqueta="Emitir OC" clase="panel p-5 space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm space-y-1">
            <span className="font-medium">Forma de pago</span>
            <select name="formaPago" className="campo" defaultValue={sugerida}>
              <option value="CARTA_CREDITO">Carta de crédito</option>
              <option value="TT">T/T (anticipo y saldo)</option>
            </select>
            <span className="block text-xs text-[var(--texto-tenue)]">
              {sugerida === 'CARTA_CREDITO' ? 'Primer embarque con este proveedor: carta de crédito, según la regla de GESI.' : `Ya hay ${previas} OC con este proveedor: puede ir por T/T.`}
            </span>
          </label>
          <label className="text-sm space-y-1">
            <span className="font-medium">Anticipo, si es T/T (%)</span>
            <input name="anticipoPct" className="campo num" inputMode="decimal" defaultValue={e.anticipoPct} />
          </label>
          <label className="text-sm space-y-1">
            <span className="font-medium">Fecha de embarque comprometida (ETD)</span>
            <input name="etd" type="date" className="campo" />
          </label>
          <label className="text-sm space-y-1">
            <span className="font-medium">Descuento acordado (%)</span>
            <input name="descuentoPct" className="campo num" inputMode="decimal" placeholder="0" />
          </label>
          <label className="text-sm space-y-1">
            <span className="font-medium">Garantía (meses)</span>
            <input name="garantiaMeses" className="campo num" inputMode="numeric" defaultValue={e.garantiaMeses ?? ''} />
          </label>
          <label className="text-sm space-y-1">
            <span className="font-medium">Consignatario</span>
            <input name="consignatario" className="campo" placeholder={e.nombre} />
            <span className="block text-xs text-[var(--texto-tenue)]">En blanco: GESI. En una triangulación, el cliente final.</span>
          </label>
        </div>
      </FormAccion>
    </div>
  )
}
