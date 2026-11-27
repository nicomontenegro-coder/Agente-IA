import { Encabezado, Volver } from '@/componentes/ui'
import { db } from '@/lib/db'
import Importador from './importador'

export const dynamic = 'force-dynamic'

export default async function PaginaImportarClientes() {
  const [existentes, canales] = await Promise.all([db.cliente.findMany({ select: { id: true, nombre: true, rut: true } }), db.canalVenta.findMany({ select: { id: true, nombre: true } })])
  return (
    <div className="space-y-5 max-w-4xl">
      <Volver href="/clientes">Clientes</Volver>
      <Encabezado titulo="Importar clientes" descripcion="Pega la tabla y revisa la propuesta antes de importar. Un cliente que ya existe (mismo RUT) se completa, no se duplica. La columna «Tipo» o «Canal» se busca entre los canales de venta." />
      <section className="panel p-4">
        <Importador existentes={existentes} canales={canales} />
      </section>
    </div>
  )
}
