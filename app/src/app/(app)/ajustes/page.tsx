import { Encabezado } from '@/componentes/ui'
import FormAccion from '@/componentes/form-accion'
import { empresa } from '@/lib/compras-db'
import { guardarEmpresa } from '@/app/acciones/datos'

export const dynamic = 'force-dynamic'

export default async function PaginaAjustes() {
  const e = await empresa()
  const campo = (name: string, etiqueta: string, valor: string | number | null, ayuda?: string) => (
    <label className="text-sm space-y-1">
      <span className="font-medium">{etiqueta}</span>
      <input name={name} className="campo" defaultValue={valor ?? ''} />
      {ayuda && <span className="block text-xs text-[var(--texto-tenue)]">{ayuda}</span>}
    </label>
  )
  return (
    <div className="space-y-5 max-w-3xl">
      <Encabezado titulo="Ajustes" descripcion="Datos de la empresa que aparecen en las RFQ y órdenes de compra." />
      <FormAccion accion={guardarEmpresa} clase="panel p-5 space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          {campo('nombre', 'Razón social', e.nombre)}
          {campo('rut', 'RUT', e.rut)}
          {campo('direccion', 'Dirección', e.direccion)}
          {campo('contacto', 'Quién firma', e.contacto)}
          {campo('email', 'Correo', e.email)}
          {campo('telefono', 'Teléfono o WhatsApp', e.telefono)}
          {campo('garantiaMeses', 'Garantía que se pide (meses)', e.garantiaMeses)}
          {campo('anticipoPct', 'Anticipo por defecto en T/T (%)', e.anticipoPct, 'Se escribe 30, no 0,3')}
        </div>
      </FormAccion>
    </div>
  )
}
