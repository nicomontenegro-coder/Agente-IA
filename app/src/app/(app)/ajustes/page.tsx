import { Encabezado } from '@/componentes/ui'
import FormAccion from '@/componentes/form-accion'
import { empresa, ultimoNumero } from '@/lib/compras-db'
import { guardarEmpresa, guardarNumeracion } from '@/app/acciones/datos'
import { agregarCanal } from '@/app/acciones/clientes'
import { agregarSinonimo, quitarSinonimo } from '@/app/acciones/precios'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export default async function PaginaAjustes() {
  const e = await empresa()
  const proximaOc = (await ultimoNumero('orden')) + 1
  const sinonimos = await db.claseSinonimo.findMany({ orderBy: { prioridad: 'asc' }, include: { clase: true } })
  const canales = await db.canalVenta.findMany({ orderBy: [{ posicion: 'asc' }, { nombre: 'asc' }], include: { _count: { select: { clientes: true } } } })
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
      <FormAccion accion={guardarNumeracion} etiqueta="Guardar numeración" clase="panel p-5 space-y-3">
        <label className="text-sm space-y-1 block max-w-xs">
          <span className="font-medium">Número de la próxima OC</span>
          <input name="proximoOrden" className="campo num" inputMode="numeric" defaultValue={proximaOc} />
          <span className="block text-xs text-[var(--texto-tenue)]">Solo puede aumentar, para no repetir números.</span>
        </label>
      </FormAccion>
      <section className="panel p-5 space-y-3">
        <h2 className="font-semibold text-sm">Tipos de fitting: cómo los escriben los proveedores</h2>
        <p className="text-xs text-[var(--texto-tenue)]">
          Al enlazar una lista, cada ítem toma el primer tipo cuyas palabras aparecen en su nombre (de menor a mayor prioridad). Las palabras se separan con «|». Sin tipo = no es un fitting (válvulas, llaves, herramientas).
        </p>
        <div className="scroll-x">
          <table className="tabla">
            <thead>
              <tr>
                <th className="text-right">Prioridad</th>
                <th>Tipo</th>
                <th>Palabras del proveedor</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {sinonimos.map((x) => (
                <tr key={x.id}>
                  <td className="text-right num">{x.prioridad}</td>
                  <td>{x.valor || <span className="text-[var(--texto-tenue)]">no es fitting</span>}</td>
                  <td className="text-xs font-mono">{x.patron.replace(/\\b/g, '')}</td>
                  <td>
                    <form action={quitarSinonimo.bind(null, x.id)}>
                      <button className="text-xs text-[var(--texto-suave)] underline">Quitar</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <FormAccion accion={agregarSinonimo} etiqueta="Agregar" clase="flex flex-wrap items-end gap-3" limpiar>
          <label className="text-sm space-y-1">
            <span className="font-medium">Tipo</span>
            <input name="valor" className="campo" placeholder="codo 90° (vacío = no es fitting)" />
          </label>
          <label className="text-sm space-y-1 grow">
            <span className="font-medium">Palabras del proveedor</span>
            <input name="patron" className="campo" placeholder="elbow 90|codo recto" />
          </label>
          <label className="text-sm space-y-1">
            <span className="font-medium">Prioridad</span>
            <input name="prioridad" className="campo num w-20" inputMode="numeric" placeholder="25" />
          </label>
        </FormAccion>
      </section>
      <section className="panel p-5 space-y-3">
        <h2 className="font-semibold text-sm">Canales de venta</h2>
        <p className="text-xs text-[var(--texto-tenue)]">El canal de cada cliente decide con qué descuento se le cotiza. Cada lista de venta fija el descuento de cada canal.</p>
        <ul className="text-sm space-y-1">
          {canales.map((c) => (
            <li key={c.id}>
              {c.nombre} <span className="text-[var(--texto-tenue)]">· {c._count.clientes} clientes</span>
            </li>
          ))}
        </ul>
        <FormAccion accion={agregarCanal} etiqueta="Agregar canal" clase="flex flex-wrap items-end gap-3" limpiar>
          <label className="text-sm space-y-1">
            <span className="font-medium">Nuevo canal</span>
            <input name="nombre" className="campo" placeholder="Salmoneras" />
          </label>
        </FormAccion>
      </section>
    </div>
  )
}
