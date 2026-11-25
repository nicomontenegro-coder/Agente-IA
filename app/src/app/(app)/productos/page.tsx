import { Encabezado } from '@/componentes/ui'
import FormAccion from '@/componentes/form-accion'
import { db } from '@/lib/db'
import { guardarProducto } from '@/app/acciones/datos'

export const dynamic = 'force-dynamic'

export default async function PaginaProductos() {
  const [productos, familias] = await Promise.all([
    db.producto.findMany({ orderBy: { nombre: 'asc' }, include: { familia: true } }),
    db.familia.findMany({ orderBy: { nombre: 'asc' } })
  ])
  return (
    <div className="space-y-5">
      <Encabezado titulo="Productos" descripcion="Catálogo de productos disponibles para las compras." />
      <div className="panel scroll-x">
        <table className="tabla">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Familia</th>
              <th>Especificación</th>
              <th>Unidad</th>
              <th>Certificación local</th>
            </tr>
          </thead>
          <tbody>
            {productos.map((p) => (
              <tr key={p.id}>
                <td>
                  {p.nombre}
                  {p.codigo && <div className="text-xs text-[var(--texto-tenue)]">{p.codigo}</div>}
                </td>
                <td className="text-sm">{p.familia?.nombre ?? '—'}</td>
                <td className="text-sm">{p.especificacion ?? '—'}</td>
                <td className="text-sm">{p.unidad}</td>
                <td className="text-sm">{p.certificacionLocal ?? 'No exige'}</td>
              </tr>
            ))}
            {productos.length === 0 && (
              <tr>
                <td colSpan={5} className="text-sm text-[var(--texto-tenue)]">
                  Todavía no hay productos.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <FormAccion accion={guardarProducto.bind(null, null)} etiqueta="Agregar producto" clase="panel p-5 grid gap-3 sm:grid-cols-3 items-end" limpiar>
        <label className="text-sm space-y-1">
          <span className="font-medium">Nombre (como se le pide al proveedor)</span>
          <input name="nombre" className="campo" required />
        </label>
        <label className="text-sm space-y-1">
          <span className="font-medium">Código</span>
          <input name="codigo" className="campo" />
        </label>
        <label className="text-sm space-y-1">
          <span className="font-medium">Especificación</span>
          <input name="especificacion" className="campo" />
        </label>
        <label className="text-sm space-y-1">
          <span className="font-medium">Unidad</span>
          <input name="unidad" className="campo" defaultValue="u" />
        </label>
        <label className="text-sm space-y-1">
          <span className="font-medium">Familia</span>
          <select name="familiaId" className="campo" defaultValue="">
            <option value="">—</option>
            {familias.map((f) => (
              <option key={f.id} value={f.id}>
                {f.nombre}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm space-y-1">
          <span className="font-medium">O familia nueva</span>
          <input name="familiaNueva" className="campo" />
        </label>
        <label className="text-sm space-y-1">
          <span className="font-medium">Código HS</span>
          <input name="codigoHS" className="campo" />
        </label>
        <label className="text-sm space-y-1">
          <span className="font-medium">Certificación local exigida</span>
          <input name="certificacionLocal" className="campo" placeholder="En blanco si no exige" />
        </label>
      </FormAccion>
    </div>
  )
}
