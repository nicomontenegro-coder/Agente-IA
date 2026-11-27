import { Encabezado } from '@/componentes/ui'
import FormAccion from '@/componentes/form-accion'
import TablaInteractiva from '@/componentes/tabla-interactiva'
import { numero } from '@/lib/formato'
import { pnDe } from '@/lib/normas-ppr'
import { db } from '@/lib/db'
import { guardarProducto } from '@/app/acciones/datos'

export const dynamic = 'force-dynamic'

export default async function PaginaProductos() {
  const [productos, familias] = await Promise.all([
    db.producto.findMany({ orderBy: { nombre: 'asc' }, include: { familia: true, clase: { include: { atributos: { orderBy: { posicion: 'asc' } } } }, ofertas: { include: { lista: { include: { proveedor: true } } } } } }),
    db.familia.findMany({ orderBy: { nombre: 'asc' } })
  ])
  return (
    <div className="space-y-5">
      <Encabezado titulo="Productos" descripcion="Catálogo de productos disponibles para las compras." />
      <div className="panel">
        <TablaInteractiva
          filtrarPor="modelo"
          etiquetaFiltro="Modelo"
          archivo="Productos GESI"
          columnas={[
            { clave: 'producto', titulo: 'Producto' },
            { clave: 'atributos', titulo: 'Atributos' },
            { clave: 'ofertas', titulo: 'Lo ofrecen' }
          ]}
          filas={productos.map((p) => {
            const valores = p.atributos ? (JSON.parse(p.atributos) as Record<string, string | number>) : {}
            const texto = (p.clase?.atributos ?? [])
              .filter((a) => valores[a.clave] != null && a.clave !== 'material' && a.clave !== 'union')
              .map((a) => `${a.nombre}: ${typeof valores[a.clave] === 'number' ? numero(valores[a.clave] as number, (valores[a.clave] as number) % 1 ? 1 : 0) : valores[a.clave]}${a.unidad ? ` ${a.unidad}` : ''}`)
            const pn = p.clase?.nombre === 'Tubo' && valores.dn && valores.espesor ? pnDe(`${valores.dn}×${valores.espesor}`) : null
            const ofertas = p.ofertas.map((o) => `${o.lista.proveedor.nombre}: ${o.precio != null ? `${o.lista.moneda} ${numero(o.precio, 3)}/${o.unidad}` : 'sin precio'}`)
            return {
              id: p.id,
              celdas: {
                producto: { texto: p.nombre, valor: p.nombre, sub: [p.familia?.nombre, p.clase?.nombre, p.modelo, p.codigo].filter(Boolean).join(' › ') || undefined },
                // Solo para el filtro por modelo: no es una columna.
                modelo: { texto: p.modelo ?? '—', valor: p.modelo ?? 'Sin clasificar' },
                atributos: { texto: [...texto, ...(pn ? [pn] : [])].join(' · ') || (p.especificacion ?? '—'), valor: texto.join(' ') },
                ofertas: { texto: ofertas.join(' · ') || '—', valor: ofertas.length }
              }
            }
          })}
        />
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
