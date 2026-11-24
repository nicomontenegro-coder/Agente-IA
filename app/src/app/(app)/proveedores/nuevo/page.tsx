import { Encabezado, Volver } from '@/componentes/ui'
import FormAccion from '@/componentes/form-accion'
import { db } from '@/lib/db'
import { guardarProveedor } from '@/app/acciones/datos'
import CamposProveedor from '../campos'

export const dynamic = 'force-dynamic'

export default async function PaginaNuevoProveedor() {
  const familias = await db.familia.findMany({ orderBy: { nombre: 'asc' } })
  return (
    <div className="space-y-5 max-w-3xl">
      <Volver href="/proveedores">Proveedores</Volver>
      <Encabezado titulo="Nuevo proveedor" />
      <FormAccion accion={guardarProveedor.bind(null, null)} etiqueta="Guardar proveedor" clase="panel p-5 space-y-4">
        <CamposProveedor familias={familias} />
      </FormAccion>
    </div>
  )
}
