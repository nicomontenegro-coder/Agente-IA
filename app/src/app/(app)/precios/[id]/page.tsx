import Link from 'next/link'
import { notFound } from 'next/navigation'

import { Encabezado, Volver, Chip } from '@/componentes/ui'
import { db } from '@/lib/db'
import { fecha, numero } from '@/lib/formato'
import { vigencia, familiasDe } from '@/lib/lista-venta'
import { crearListaVenta } from '@/app/acciones/precios'

export const dynamic = 'force-dynamic'

export default async function PaginaLista({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const l = await db.listaPrecios.findUnique({ where: { id }, include: { proveedor: true, items: { orderBy: { posicion: 'asc' } }, ventas: { orderBy: { creadoEn: 'desc' } } } })
  if (!l) notFound()
  const v = vigencia(l.fecha, l.validezDias)
  const familias = familiasDe(l.items)
  const sinPrecio = l.items.filter((i) => i.precio == null).length
  return (
    <div className="space-y-5">
      <Volver href="/precios">Listas de precios</Volver>
      <Encabezado
        titulo={`Lista de precios de ${l.proveedor.nombre}`}
        descripcion={[`${fecha(l.fecha)}`, `${l.incoterm ?? ''} ${l.lugar ?? ''}`.trim(), l.moneda, `${l.items.length} productos`].filter(Boolean).join(' · ')}
      />
      <section className="panel p-4 space-y-2 text-sm">
        <div className="flex flex-wrap items-center gap-3">
          {v.dias == null ? <Chip>Sin validez indicada</Chip> : v.vencida ? <Chip tono="malo">Vencida el {fecha(v.vence!)}</Chip> : <Chip tono="ok">Vigente hasta el {fecha(v.vence!)}</Chip>}
          <a href={`/documentos/${l.archivo}`} target="_blank" rel="noreferrer" className="text-[var(--acento)] underline">
            Abrir {l.archivoNombre} ↗
          </a>
        </div>
        {v.vencida && <p className="text-[var(--alerta)]">Los precios pueden haber cambiado: confírmalos con el proveedor antes de vender sobre ellos.</p>}
        {sinPrecio > 0 && <p className="text-[var(--texto-suave)]">{sinPrecio} medidas sin precio en la lista: no se incluyen en las listas de venta.</p>}
        {l.notas && (
          <ul className="list-disc pl-5 text-[var(--texto-suave)]">
            {l.notas.split('\n').map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        )}
      </section>

      <section className="panel p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold text-sm">Listas de venta</h2>
          <form action={crearListaVenta.bind(null, l.id)}>
            <button className="btn btn-primario">Nueva lista de venta</button>
          </form>
        </div>
        {l.ventas.length === 0 ? (
          <p className="text-sm text-[var(--texto-suave)]">Sin listas de venta. Crea una para fijar factor y margen por familia.</p>
        ) : (
          <ul className="text-sm space-y-1">
            {l.ventas.map((x) => (
              <li key={x.id}>
                <Link href={`/precios/venta/${x.id}`} className="text-[var(--acento)] hover:underline">
                  {x.titulo}
                </Link>
                <span className="text-[var(--texto-tenue)]"> · actualizada el {fecha(x.actualizadoEn)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="panel scroll-x">
        <h2 className="font-semibold text-sm px-4 pt-3 pb-2">Productos ({familias.map((f) => `${f.familia}: ${f.productos}`).join(' · ')})</h2>
        <table className="tabla">
          <thead>
            <tr>
              <th>Familia</th>
              <th>Producto</th>
              <th>Medida</th>
              <th>Unidad</th>
              <th className="text-right">Precio {l.moneda}</th>
            </tr>
          </thead>
          <tbody>
            {l.items.map((i) => (
              <tr key={i.id}>
                <td className="text-sm text-[var(--texto-suave)]">{i.familia}</td>
                <td>
                  {i.descripcion}
                  {i.grupo && <div className="text-xs text-[var(--texto-tenue)]">{i.grupo}</div>}
                </td>
                <td className="num">{i.especificacion ?? '—'}</td>
                <td>{i.unidad}</td>
                <td className="text-right num">{i.precio != null ? numero(i.precio, 3) : <span className="text-[var(--texto-tenue)]">sin precio</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  )
}
