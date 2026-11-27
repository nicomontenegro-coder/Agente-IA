import { Encabezado, Volver } from '@/componentes/ui'
import { db } from '@/lib/db'
import Importador from './importador'

export const dynamic = 'force-dynamic'

export default async function PaginaImportarClientes() {
  const existentes = await db.cliente.findMany({ select: { id: true, nombre: true, rut: true } })
  return (
    <div className="space-y-5 max-w-4xl">
      <Volver href="/clientes">Clientes</Volver>
      <Encabezado titulo="Importar clientes" descripcion="Pega la tabla y revisa la propuesta antes de importar. Un cliente que ya existe (mismo RUT o nombre) se completa, no se duplica." />
      <section className="panel p-4">
        <Importador existentes={existentes} />
      </section>
    </div>
  )
}
