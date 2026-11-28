import { notFound } from 'next/navigation'

import { Encabezado, Volver } from '@/componentes/ui'
import TablaInteractiva from '@/componentes/tabla-interactiva'
import { db } from '@/lib/db'
import { proponerProducto, nombresRepetidos, type Sinonimo } from '@/lib/clases'
import { crearProductosDesdeLista, desenlazarItem } from '@/app/acciones/precios'

export const dynamic = 'force-dynamic'

/** La propuesta de productos GESI para una lista: se revisa y se aprueba de una vez. */
export default async function PaginaProductosDeLista({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const l = await db.listaPrecios.findUnique({ where: { id }, include: { proveedor: true, items: { orderBy: { posicion: 'asc' }, include: { producto: true } } } })
  if (!l) notFound()
  const pendientes = l.items.filter((i) => !i.productoId)
  const nombres = new Set((await db.producto.findMany({ select: { nombre: true } })).map((p) => p.nombre))
  const sinonimos: Sinonimo[] = await db.claseSinonimo.findMany()
  const propuestas = pendientes.map((i) => ({ item: i, p: proponerProducto(i, sinonimos) }))
  const repetidos = nombresRepetidos(propuestas.map((x) => x.p))
  const reconocidos = propuestas.filter((x) => x.p && !repetidos.has(x.p.nombre))
  const enlazadosItems = l.items.filter((i) => i.productoId)
  const nuevos = new Set(reconocidos.filter((x) => !nombres.has(x.p!.nombre)).map((x) => x.p!.nombre))
  const enlazados = l.items.length - pendientes.length

  return (
    <div className="space-y-5">
      <Volver href={`/precios/${l.id}`}>Lista de {l.proveedor.nombre}</Volver>
      <Encabezado titulo="Productos GESI desde la lista" descripcion="Cada ítem del proveedor se enlaza con un producto GESI (clase, modelo y medida). Revisa la propuesta antes de aprobarla." />
      <section className="panel p-4 space-y-3 text-sm">
        <p>
          {enlazados} de {l.items.length} ítems ya enlazados · <strong>{reconocidos.length}</strong> reconocidos para enlazar ({nuevos.size} productos nuevos) ·{' '}
          {propuestas.filter((x) => x.p && repetidos.has(x.p.nombre)).length} para revisar · {propuestas.filter((x) => !x.p).length} sin clasificar
        </p>
        <p className="text-xs text-[var(--texto-tenue)]">
          Se reconocen tubos y fittings PPR con medida clara. Válvulas, herramientas y lo que no es PPR quedan sin clasificar: no se adivina. «Revisar» son dos ítems que caerían en el mismo producto: no se enlazan. Los nombres que reconoce cada tipo se editan en Ajustes.
        </p>
        {reconocidos.length > 0 && (
          <form action={crearProductosDesdeLista.bind(null, l.id)}>
            <button className="btn btn-primario">Aprobar: crear {nuevos.size} productos y enlazar {reconocidos.length} ítems</button>
          </form>
        )}
      </section>
      {propuestas.length > 0 && (
        <section className="panel">
          <h2 className="font-semibold text-sm px-4 pt-3">Propuesta</h2>
          <TablaInteractiva
            filtrarPor="modelo"
            etiquetaFiltro="Modelo"
            archivo={`Enlace productos ${l.proveedor.nombre}`}
            columnas={[
              { clave: 'item', titulo: 'Ítem del proveedor' },
              { clave: 'medida', titulo: 'Medida' },
              { clave: 'producto', titulo: 'Producto GESI' },
              { clave: 'modelo', titulo: 'Modelo' },
              { clave: 'estado', titulo: 'Estado' }
            ]}
            filas={propuestas.map(({ item: i, p }) => ({
              id: i.id,
              celdas: {
                item: { texto: i.descripcion, valor: i.descripcion, sub: [i.familia, i.grupo].filter(Boolean).join(' · ') || undefined },
                medida: { texto: i.especificacion ?? '—', valor: i.especificacion },
                producto: { texto: p ? p.nombre : '—', valor: p?.nombre ?? null, sub: p ? `Clase ${p.clase}` : undefined },
                modelo: { texto: p ? p.modelo : 'Sin clasificar', valor: p ? p.modelo : 'Sin clasificar' },
                estado: {
                  texto: !p ? 'sin clasificar' : repetidos.has(p.nombre) ? 'revisar: otro ítem cae en el mismo producto' : nombres.has(p.nombre) ? 'ya existe: se enlaza' : 'nuevo',
                  valor: !p ? 3 : repetidos.has(p.nombre) ? 2 : nombres.has(p.nombre) ? 1 : 0
                }
              }
            }))}
          />
        </section>
      )}
      {enlazadosItems.length > 0 && (
        <section className="panel p-4 space-y-2" aria-label="Enlazados">
          <h2 className="font-semibold text-sm">Ya enlazados ({enlazadosItems.length})</h2>
          <p className="text-xs text-[var(--texto-tenue)]">Si un enlace está mal, desenlázalo: el ítem vuelve a la propuesta, y si su producto queda sin uso, se borra.</p>
          <ul className="text-sm divide-y divide-[var(--borde)]">
            {enlazadosItems.map((i) => (
              <li key={i.id} className="flex flex-wrap items-center justify-between gap-2 py-1.5">
                <span>
                  {i.descripcion} {i.especificacion ?? ''} → <strong>{i.producto?.nombre}</strong>
                </span>
                <form action={desenlazarItem.bind(null, l.id, i.id)}>
                  <button className="text-xs text-[var(--texto-suave)] underline">Desenlazar</button>
                </form>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
