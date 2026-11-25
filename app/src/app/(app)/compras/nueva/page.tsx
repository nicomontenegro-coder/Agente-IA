import { Encabezado, Volver } from '@/componentes/ui'
import { db } from '@/lib/db'
import FormCompra from './formulario'

export const dynamic = 'force-dynamic'

export default async function PaginaNuevaCompra() {
  const productos = await db.producto.findMany({ orderBy: { nombre: 'asc' } })
  return (
    <div className="space-y-5 max-w-4xl">
      <Volver href="/compras">Compras</Volver>
      <Encabezado titulo="Nueva compra" descripcion="Productos, cantidades y condiciones. La RFQ se genera con estos datos." />
      <FormCompra productos={productos.map((p) => ({ id: p.id, nombre: p.nombre, especificacion: p.especificacion, unidad: p.unidad }))} />
    </div>
  )
}
