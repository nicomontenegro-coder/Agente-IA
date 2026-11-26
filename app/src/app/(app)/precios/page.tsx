import Link from 'next/link'

import { Encabezado, Chip } from '@/componentes/ui'
import FormAccion from '@/componentes/form-accion'
import { db } from '@/lib/db'
import { fecha } from '@/lib/formato'
import { vigencia } from '@/lib/lista-venta'
import { hayLectorIa } from '@/lib/leer-cotizacion'
import { subirLista } from '@/app/acciones/precios'

export const dynamic = 'force-dynamic'

export default async function PaginaPrecios() {
  const [listas, proveedores] = await Promise.all([
    db.listaPrecios.findMany({ orderBy: { fecha: 'desc' }, include: { proveedor: true, _count: { select: { items: true, ventas: true } } } }),
    db.proveedor.findMany({ orderBy: { nombre: 'asc' }, select: { id: true, nombre: true } })
  ])
  return (
    <div className="space-y-5">
      <Encabezado titulo="Listas de precios" descripcion="Listas de precios de proveedores y listas de venta calculadas desde ellas." />
      <section className="panel p-4 space-y-2">
        <h2 className="font-semibold text-sm">Cargar lista de precios</h2>
        {hayLectorIa() ? (
          <FormAccion accion={subirLista} etiqueta="Leer lista" clase="flex flex-wrap items-end gap-3">
            <label className="text-sm space-y-1">
              <span className="font-medium">Proveedor</span>
              <select name="proveedorId" className="campo" defaultValue="" required>
                <option value="">Seleccionar…</option>
                {proveedores.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm space-y-1">
              <span className="font-medium">PDF de la lista</span>
              <input name="pdf" type="file" accept="application/pdf" className="campo" required />
            </label>
          </FormAccion>
        ) : (
          <p className="text-sm text-[var(--texto-suave)]">Lectura automática no disponible en este servidor.</p>
        )}
        <p className="text-xs text-[var(--texto-tenue)]">Se leen todos los productos con su precio y unidad. Un catálogo de varias páginas puede tardar algunos minutos.</p>
      </section>
      {listas.length > 0 && (
        <section className="panel scroll-x">
          <table className="tabla">
            <thead>
              <tr>
                <th>Proveedor</th>
                <th>Fecha</th>
                <th>Vigencia</th>
                <th className="text-right">Productos</th>
                <th className="text-right">Listas de venta</th>
              </tr>
            </thead>
            <tbody>
              {listas.map((l) => {
                const v = vigencia(l.fecha, l.validezDias)
                return (
                  <tr key={l.id}>
                    <td>
                      <Link href={`/precios/${l.id}`} className="font-medium hover:text-[var(--acento)]">
                        {l.proveedor.nombre}
                      </Link>
                    </td>
                    <td className="num">{fecha(l.fecha)}</td>
                    <td>{v.dias == null ? <Chip>Sin validez</Chip> : v.vencida ? <Chip tono="malo">Vencida</Chip> : <Chip tono="ok">{v.dias} días</Chip>}</td>
                    <td className="text-right num">{l._count.items}</td>
                    <td className="text-right num">{l._count.ventas}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </section>
      )}
    </div>
  )
}
