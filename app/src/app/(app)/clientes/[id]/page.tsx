import { notFound } from 'next/navigation'

import { Encabezado, Volver } from '@/componentes/ui'
import FormAccion from '@/componentes/form-accion'
import { db } from '@/lib/db'
import { fecha, fechaInput } from '@/lib/formato'
import { ETAPAS_CLIENTE, ETIQUETA_ETAPA, AYUDA_ETAPA, CANALES_GESTION } from '@/lib/embudo'
import { guardarCliente, registrarGestion } from '@/app/acciones/clientes'

export const dynamic = 'force-dynamic'

const MEDIO: Record<string, string> = Object.fromEntries(CANALES_GESTION.map((c) => [c.valor, c.etiqueta]))

/** La ficha de un cliente; con id «nuevo», el formulario vacío. */
export default async function PaginaCliente({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [c, canales] = await Promise.all([
    id === 'nuevo' ? null : db.cliente.findUnique({ where: { id }, include: { canal: true, gestiones: { orderBy: { fecha: 'desc' } } } }),
    db.canalVenta.findMany({ orderBy: [{ posicion: 'asc' }, { nombre: 'asc' }] })
  ])
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
      <Encabezado titulo={c?.nombre ?? 'Nuevo cliente'} descripcion={c ? [c.canal?.nombre, c.ciudad, c.rut].filter(Boolean).join(' · ') : 'El canal de venta decide con qué precio se le cotiza.'} />
      <FormAccion accion={guardarCliente.bind(null, c?.id ?? null)} etiqueta="Guardar cliente" clase="space-y-4">
        <section className="panel p-5 grid gap-3 sm:grid-cols-2">
          {campo('nombre', 'Nombre o razón social', c?.nombre, { ancho: true })}
          {campo('rut', 'RUT', c?.rut, { placeholder: '76.123.456-0' })}
          <label className="text-sm space-y-1">
            <span className="font-medium">Canal de venta</span>
            <select name="canalId" className="campo" defaultValue={c?.canalId ?? ''}>
              <option value="">Sin definir</option>
              {canales.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.nombre}
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
          {campo('motivo', 'Motivo del cambio (obligatorio al perder o volver atrás)', null)}
          {campo('proximaAccion', 'Próxima acción', c?.proximaAccion, { placeholder: 'Visitar con la lista de preventa' })}
          {campo('proximaFecha', 'Fecha', c?.proximaFecha ? fechaInput(c.proximaFecha) : null, { tipo: 'date' })}
        </section>
      </FormAccion>

      {c && (
        <section className="panel p-4 space-y-3" aria-label="Gestiones">
          <h2 className="font-semibold text-sm">Gestiones</h2>
          <FormAccion accion={registrarGestion.bind(null, c.id)} etiqueta="Registrar gestión" clase="grid gap-3 sm:grid-cols-4 items-end" limpiar>
            <label className="text-sm space-y-1">
              <span className="font-medium">Medio</span>
              <select name="medio" className="campo" defaultValue="VISITA">
                {CANALES_GESTION.map((m) => (
                  <option key={m.valor} value={m.valor}>
                    {m.etiqueta}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm space-y-1">
              <span className="font-medium">Fecha</span>
              <input name="fecha" type="date" className="campo" defaultValue={fechaInput(new Date())} />
            </label>
            <label className="text-sm space-y-1 sm:col-span-2">
              <span className="font-medium">Qué pasó</span>
              <input name="texto" className="campo" placeholder="Le dejé la lista de preventa; pide precio por 200 tiras" />
            </label>
          </FormAccion>
          {c.gestiones.length === 0 ? (
            <p className="text-sm text-[var(--texto-suave)]">Sin gestiones registradas.</p>
          ) : (
            <ul className="space-y-2">
              {c.gestiones.map((g) => (
                <li key={g.id} className="text-sm border-t border-[var(--borde)] pt-2">
                  <span className="text-[var(--texto-tenue)]">
                    {fecha(g.fecha)} · {MEDIO[g.medio] ?? g.medio}
                  </span>
                  <div>{g.texto}</div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  )
}
