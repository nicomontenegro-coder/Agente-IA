import { notFound } from 'next/navigation'

import { Encabezado, Volver } from '@/componentes/ui'
import FormAccion from '@/componentes/form-accion'
import { db } from '@/lib/db'
import { fechaInput } from '@/lib/formato'
import { ETAPAS_CLIENTE, ETIQUETA_ETAPA, AYUDA_ETAPA } from '@/lib/embudo'
import { TIPOS_CLIENTE } from '@/lib/importar-clientes'
import { guardarCliente } from '@/app/acciones/clientes'

export const dynamic = 'force-dynamic'

/** La ficha de un cliente; con id «nuevo», el formulario vacío. */
export default async function PaginaCliente({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const c = id === 'nuevo' ? null : await db.cliente.findUnique({ where: { id } })
  if (id !== 'nuevo' && !c) notFound()
  const campo = (name: string, etiqueta: string, valor: string | null | undefined, extra?: { tipo?: string; placeholder?: string; ancho?: boolean }) => (
    <label className={`text-sm space-y-1 ${extra?.ancho ? 'sm:col-span-2' : ''}`}>
      <span className="font-medium">{etiqueta}</span>
      <input name={name} type={extra?.tipo ?? 'text'} className="campo" defaultValue={valor ?? ''} placeholder={extra?.placeholder} />
    </label>
  )
  return (
    <div className="space-y-5 max-w-3xl">
      <Volver href="/clientes">Clientes</Volver>
      <Encabezado titulo={c?.nombre ?? 'Nuevo cliente'} descripcion={c ? [c.tipo, c.ciudad, c.rut].filter(Boolean).join(' · ') : 'El tipo es su canal de venta: decide con qué precio se le cotiza.'} />
      <FormAccion accion={guardarCliente.bind(null, c?.id ?? null)} etiqueta="Guardar cliente" clase="space-y-4">
        <section className="panel p-5 grid gap-3 sm:grid-cols-2">
          {campo('nombre', 'Nombre o razón social', c?.nombre, { ancho: true })}
          {campo('rut', 'RUT', c?.rut, { placeholder: '76.123.456-0' })}
          <label className="text-sm space-y-1">
            <span className="font-medium">Tipo (canal de venta)</span>
            <select name="tipo" className="campo" defaultValue={c?.tipo ?? ''}>
              <option value="">Sin definir</option>
              {TIPOS_CLIENTE.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          {campo('ciudad', 'Ciudad', c?.ciudad)}
          {campo('direccion', 'Dirección', c?.direccion)}
          {campo('contacto', 'Contacto', c?.contacto)}
          {campo('telefono', 'Teléfono o WhatsApp', c?.telefono)}
          {campo('email', 'Correo', c?.email, { tipo: 'email' })}
          {campo('notas', 'Notas', c?.notas, { ancho: true })}
        </section>
        <section className="panel p-5 grid gap-3 sm:grid-cols-2">
          <label className="text-sm space-y-1">
            <span className="font-medium">Etapa</span>
            <select name="etapa" className="campo" defaultValue={c?.etapa ?? 'IDENTIFICADO'}>
              {ETAPAS_CLIENTE.map((e) => (
                <option key={e} value={e}>
                  {ETIQUETA_ETAPA[e]} — {AYUDA_ETAPA[e]}
                </option>
              ))}
            </select>
          </label>
          {campo('notaEtapa', 'Motivo (obligatorio al perder o volver atrás)', c?.notaEtapa)}
          {campo('proximaAccion', 'Próxima acción', c?.proximaAccion, { placeholder: 'Visitar con la lista de preventa' })}
          {campo('proximaFecha', 'Fecha', c?.proximaFecha ? fechaInput(c.proximaFecha) : null, { tipo: 'date' })}
        </section>
      </FormAccion>
    </div>
  )
}
