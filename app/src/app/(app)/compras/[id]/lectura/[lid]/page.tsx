import { notFound, redirect } from 'next/navigation'

import { Encabezado, Volver } from '@/componentes/ui'
import FormAccion from '@/componentes/form-accion'
import { db } from '@/lib/db'
import { codigo } from '@/lib/codigos'
import type { LecturaCotizacion } from '@/lib/leer-cotizacion'
import { sugerirProveedores } from '@/lib/buscar-proveedor'
import { asignarLectura, crearProveedorDeLectura } from '@/app/acciones/compras'

export const dynamic = 'force-dynamic'

/** De quién es la cotización que se acaba de subir. */
export default async function PaginaLectura({ params }: { params: Promise<{ id: string; lid: string }> }) {
  const { id, lid } = await params
  const compra = await db.compra.findUnique({ where: { id }, include: { invitaciones: true } })
  const lp = await db.lecturaPendiente.findUnique({ where: { id: lid } })
  if (!compra || !lp || lp.compraId !== id) notFound()
  // Ya tiene proveedor: lo que sigue es revisar la cotización.
  if (lp.invitacionId) redirect(`/compras/${id}/cotizacion/${lp.invitacionId}?lectura=${lid}`)

  const leido: LecturaCotizacion | null = lp.lectura ? JSON.parse(lp.lectura) : null
  const proveedores = await db.proveedor.findMany({ orderBy: { nombre: 'asc' }, select: { id: true, nombre: true, email: true } })
  const sugeridos = leido ? sugerirProveedores({ nombre: leido.proveedor, email: leido.email }, proveedores) : []
  const invitados = new Set(compra.invitaciones.map((i) => i.proveedorId))

  return (
    <div className="space-y-5 max-w-3xl">
      <Volver href={`/compras/${id}`}>{codigo('compra', compra.numero)}</Volver>
      <Encabezado titulo="¿De quién es esta cotización?" descripcion="La IA leyó el membrete. Elige al proveedor que ya tienes, o créalo con esos datos." />

      <section className="panel p-4 space-y-1 text-sm">
        <a href={`/documentos/${lp.archivo}`} target="_blank" rel="noreferrer" className="text-[var(--acento)] underline">
          Abrir {lp.archivoNombre} ↗
        </a>
        {lp.error && <p className="text-[var(--malo)]">No se pudo leer: {lp.error}. Elige el proveedor y copia los datos a mano.</p>}
        {!lp.lectura && !lp.error && <p className="text-[var(--texto-tenue)]">El lector con IA no está activo: elige el proveedor a mano.</p>}
        {leido && (
          <>
            <p className="font-semibold text-base">{leido.proveedor ?? 'El documento no dice el nombre del proveedor'}</p>
            <p className="text-[var(--texto-tenue)]">{[leido.proveedorPais, leido.contacto, leido.email, leido.telefono].filter(Boolean).join(' · ')}</p>
          </>
        )}
      </section>

      {sugeridos.length > 0 && (
        <section className="panel p-4 space-y-3">
          <h2 className="font-semibold text-sm">{sugeridos.length === 1 ? 'Parece ser este' : 'Pueden ser estos'}</h2>
          {sugeridos.map((s) => (
            <FormAccion key={s.id} accion={asignarLectura.bind(null, id, lid)} etiqueta="Es este" clase="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--borde)] pt-3 first-of-type:border-0 first-of-type:pt-0">
              <input type="hidden" name="proveedorId" value={s.id} />
              <div className="text-sm">
                <span className="font-medium">{s.nombre}</span>
                <span className="text-[var(--texto-tenue)]"> · {s.motivo}{invitados.has(s.id) ? ' · invitado a esta compra' : ''}</span>
              </div>
            </FormAccion>
          ))}
        </section>
      )}

      {proveedores.length > 0 && (
        <section className="panel p-4">
          <FormAccion accion={asignarLectura.bind(null, id, lid)} etiqueta="Usar este" clase="flex flex-wrap items-end gap-3">
            <label className="text-sm space-y-1 grow">
              <span className="font-medium">{sugeridos.length ? 'Es otro de los que ya tengo' : 'Es uno de los que ya tengo'}</span>
              <select name="proveedorId" className="campo" defaultValue="">
                <option value="">Elegir…</option>
                {proveedores.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre}
                    {invitados.has(p.id) ? ' (invitado)' : ''}
                  </option>
                ))}
              </select>
            </label>
          </FormAccion>
        </section>
      )}

      <section className="panel p-4 space-y-3">
        <h2 className="font-semibold text-sm">Es un proveedor nuevo</h2>
        <FormAccion accion={crearProveedorDeLectura.bind(null, id, lid)} etiqueta="Crear y seguir" clase="grid gap-3 sm:grid-cols-2">
          <label className="text-sm space-y-1 sm:col-span-2">
            <span className="font-medium">Nombre</span>
            <input name="nombre" className="campo" defaultValue={leido?.proveedor ?? ''} required />
          </label>
          <label className="text-sm space-y-1">
            <span className="font-medium">País</span>
            <input name="pais" className="campo" defaultValue={leido?.proveedorPais ?? ''} />
          </label>
          <label className="text-sm space-y-1">
            <span className="font-medium">Contacto</span>
            <input name="contacto" className="campo" defaultValue={leido?.contacto ?? ''} />
          </label>
          <label className="text-sm space-y-1">
            <span className="font-medium">Correo</span>
            <input name="email" type="email" className="campo" defaultValue={leido?.email ?? ''} />
          </label>
          <label className="text-sm space-y-1">
            <span className="font-medium">Teléfono o WeChat</span>
            <input name="telefono" className="campo" defaultValue={leido?.telefono ?? ''} />
          </label>
        </FormAccion>
        <p className="text-xs text-[var(--texto-tenue)]">Certificados, familias y carta de crédito se completan después en su ficha.</p>
      </section>
    </div>
  )
}
