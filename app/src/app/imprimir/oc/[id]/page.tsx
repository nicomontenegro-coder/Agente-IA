import { notFound } from 'next/navigation'

import { db } from '@/lib/db'
import { empresa } from '@/lib/compras-db'
import { codigo } from '@/lib/codigos'
import { totalesOrden, condicionesOrden, type FormaPago, type Idioma } from '@/lib/documentos'
import { incotermEn, cantidadEn } from '@/lib/pedido-cotizacion'
import Botones from './botones'

export const dynamic = 'force-dynamic'

const T = {
  en: { titulo: 'PURCHASE ORDER', fecha: 'Date', compra: 'Purchase', cotizacion: 'Supplier quotation', proveedor: 'Supplier', consignatario: 'Consignee', notificar: 'Notify party: customs broker or freight forwarder', condiciones: 'Commercial terms', etd: 'Shipment date (ETD)', destino: 'Destination', moneda: 'Currency', productos: 'Products', codigo: 'Code', descripcion: 'Description', especificacion: 'Specification / standard', cantidad: 'Qty', unidad: 'Unit', precio: 'Unit price', total: 'Total', subtotal: 'Subtotal', descuento: 'Discount', firmaGesi: 'For GESI SpA', firmaProv: 'Supplier signature and stamp', porConfirmar: 'to be confirmed' },
  es: { titulo: 'ORDEN DE COMPRA', fecha: 'Fecha', compra: 'Compra', cotizacion: 'Cotización del proveedor', proveedor: 'Proveedor', consignatario: 'Consignatario', notificar: 'Notificar a: agente de aduana o forwarder', condiciones: 'Condiciones comerciales', etd: 'Fecha de embarque (ETD)', destino: 'Destino', moneda: 'Moneda', productos: 'Productos', codigo: 'Código', descripcion: 'Descripción', especificacion: 'Especificación / norma', cantidad: 'Cant.', unidad: 'Unidad', precio: 'Precio unit.', total: 'Total', subtotal: 'Subtotal', descuento: 'Descuento', firmaGesi: 'Por GESI SpA', firmaProv: 'Firma y timbre del proveedor', porConfirmar: 'por confirmar' }
}

const dinero = (x: number, idioma: Idioma) => new Intl.NumberFormat(idioma === 'en' ? 'en-US' : 'es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(x)
const fechaDoc = (d: Date, idioma: Idioma) => new Intl.DateTimeFormat(idioma === 'en' ? 'en-GB' : 'es-CL', { day: 'numeric', month: 'long', year: 'numeric' }).format(d)

export default async function ImprimirOC({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ idioma?: string }> }) {
  const { id } = await params
  const idioma: Idioma = (await searchParams).idioma === 'es' ? 'es' : 'en'
  const t = T[idioma]
  const [o, e] = await Promise.all([
    db.ordenCompra.findUnique({ where: { id }, include: { lineas: { orderBy: { posicion: 'asc' } }, compra: true, cotizacion: { include: { invitacion: { include: { proveedor: true } } } } } }),
    empresa()
  ])
  if (!o) notFound()
  const p = o.cotizacion.invitacion.proveedor
  const tot = totalesOrden(o.lineas, o.descuentoPct)
  const cod = codigo('orden', o.numero)
  const secciones = condicionesOrden({ formaPago: o.formaPago as FormaPago, anticipoPct: o.anticipoPct, garantiaMeses: o.garantiaMeses, codigo: cod }, idioma)
  const cant = (x: number) => (idioma === 'en' ? cantidadEn(x) : new Intl.NumberFormat('es-CL', { maximumFractionDigits: 3 }).format(x))

  return (
    <>
    <Botones id={o.id} compraId={o.compraId} idioma={idioma} />
    <div className="hoja">
      <style>{`
        body { background: #e5e7eb; }
        .hoja { max-width: 210mm; margin: 16px auto; background: #fff; padding: 14mm; color: #1f2937; font-size: 10pt; }
        .hoja h1 { font-size: 18pt; color: #1d4ed8; margin: 0; text-align: right; }
        .hoja .anulada { display: inline-block; margin: 4px 0; padding: 2px 10px; border: 2px solid #b91c1c; color: #b91c1c; font-weight: 700; letter-spacing: 1px; }
        .hoja h2 { font-size: 10pt; color: #fff; background: #0f766e; padding: 4px 8px; border-radius: 4px; margin: 12px 0 6px; }
        .hoja h2.regla { background: #b45309; }
        .hoja table { width: 100%; border-collapse: collapse; font-size: 9pt; }
        .hoja th { background: #ecfdf5; text-align: left; padding: 4px; border: 1px solid #d1d5db; }
        .hoja td { padding: 4px; border: 1px solid #e5e7eb; vertical-align: top; }
        .hoja .der { text-align: right; font-variant-numeric: tabular-nums; }
        .hoja .cab { display: flex; justify-content: space-between; gap: 16px; }
        .hoja .suave { color: #6b7280; }
        .hoja ul { margin: 0; padding-left: 16px; }
        .hoja .firmas { display: flex; justify-content: space-between; margin-top: 28px; gap: 24px; }
        .hoja .firmas div { flex: 1; border-top: 1px solid #1f2937; padding-top: 4px; font-size: 9pt; }
        .botones { max-width: 210mm; margin: 0 auto; display: flex; gap: 8px; }
        @media print { body { background: #fff; } .hoja { margin: 0; padding: 0; } .botones { display: none; } }
      `}</style>
      <div className="cab">
        <div>
          <strong style={{ fontSize: '13pt' }}>{e.nombre}</strong>
          <div className="suave">{[e.rut && `RUT ${e.rut}`, e.direccion].filter(Boolean).join(' · ')}</div>
          <div className="suave">{[e.contacto, e.email, e.telefono].filter(Boolean).join(' · ')}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <h1>{t.titulo}</h1>
          {o.anuladaEl && (
            <div className="anulada">
              {idioma === 'en' ? 'VOID' : 'ANULADA'} · {fechaDoc(o.anuladaEl, idioma)}
            </div>
          )}
          <div>
            <strong>{cod}</strong> · {t.fecha}: {fechaDoc(o.fecha, idioma)}
          </div>
          <div className="suave">
            {t.compra} {codigo('compra', o.compra.numero)}
            {o.cotizacion.referencia ? ` · ${t.cotizacion} ${o.cotizacion.referencia}` : ''}
          </div>
        </div>
      </div>

      <h2>1. {t.proveedor}</h2>
      <div>
        <strong>{p.nombre}</strong>
        {p.pais ? `, ${p.pais}` : ''}
      </div>
      <div className="suave">{[p.contacto, p.email, p.telefono].filter(Boolean).join(' · ')}</div>

      <h2>2. {t.consignatario}</h2>
      <div>{o.consignatario ?? e.nombre}</div>
      <div className="suave">{t.notificar}</div>

      <h2>3. {t.condiciones}</h2>
      <div>
        Incoterm: {idioma === 'en' ? incotermEn(o.incoterm) : o.incoterm} {o.lugar ?? ''} (Incoterms 2020)
        {o.destino ? ` · ${t.destino}: ${o.destino}` : ''}
      </div>
      <div>
        {t.etd}: {o.etd ? fechaDoc(o.etd, idioma) : t.porConfirmar} · {t.moneda}: {o.moneda}
      </div>

      <h2>4. {t.productos}</h2>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>{t.codigo}</th>
            <th>{t.descripcion}</th>
            <th>{t.especificacion}</th>
            <th className="der">{t.cantidad}</th>
            <th>{t.unidad}</th>
            <th className="der">{t.precio}</th>
            <th className="der">{t.total}</th>
          </tr>
        </thead>
        <tbody>
          {o.lineas.map((l, i) => (
            <tr key={l.id}>
              <td>{i + 1}</td>
              <td>{l.codigo ?? ''}</td>
              <td>{l.descripcion}</td>
              <td>{l.especificacion ?? ''}</td>
              <td className="der">{cant(l.cantidad)}</td>
              <td>{l.unidad}</td>
              <td className="der">{dinero(l.precioUnitario, idioma)}</td>
              <td className="der">{dinero(l.cantidad * l.precioUnitario, idioma)}</td>
            </tr>
          ))}
          {tot.descuento > 0 && (
            <>
              <tr>
                <td colSpan={7} className="der">{t.subtotal}</td>
                <td className="der">{dinero(tot.subtotal, idioma)}</td>
              </tr>
              <tr>
                <td colSpan={7} className="der">
                  {t.descuento} {o.descuentoPct}%
                </td>
                <td className="der">−{dinero(tot.descuento, idioma)}</td>
              </tr>
            </>
          )}
          <tr>
            <td colSpan={7} className="der">
              <strong>
                {t.total} {o.moneda} {o.incoterm} {o.lugar ?? ''}
              </strong>
            </td>
            <td className="der">
              <strong>{dinero(tot.total, idioma)}</strong>
            </td>
          </tr>
        </tbody>
      </table>

      {secciones.map((s, i) => (
        <div key={s.titulo}>
          <h2 className={i < 2 ? 'regla' : undefined}>
            {i + 5}. {s.titulo}
          </h2>
          <ul>
            {s.lineas.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
        </div>
      ))}

      <div className="firmas">
        <div>{t.firmaGesi}</div>
        <div>{t.firmaProv}</div>
      </div>
    </div>
    </>
  )
}
