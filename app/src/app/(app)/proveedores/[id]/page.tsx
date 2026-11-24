import { notFound } from 'next/navigation'

import { Encabezado, Volver } from '@/componentes/ui'
import FormAccion from '@/componentes/form-accion'
import { db } from '@/lib/db'
import { TIPOS_CERTIFICADO, puntajeCertificados, evaluarProveedor } from '@/lib/proveedores'
import { fecha } from '@/lib/formato'
import { guardarProveedor, agregarCertificado, quitarCertificado } from '@/app/acciones/datos'
import CamposProveedor from '../campos'

export const dynamic = 'force-dynamic'

const TIPO = Object.fromEntries(TIPOS_CERTIFICADO.map((t) => [t.valor, t.etiqueta])) as Record<string, string>

export default async function PaginaProveedor({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [p, familias] = await Promise.all([
    db.proveedor.findUnique({ where: { id }, include: { certificados: { orderBy: { creadoEn: 'asc' } }, familias: true } }),
    db.familia.findMany({ orderBy: { nombre: 'asc' } })
  ])
  if (!p) notFound()
  const ev = evaluarProveedor({ certificados: p.certificados, aceptaCartaCredito: p.aceptaCartaCredito }, true)

  return (
    <div className="space-y-5 max-w-3xl">
      <Volver href="/proveedores">Proveedores</Volver>
      <Encabezado titulo={p.nombre} descripcion={`${puntajeCertificados(p.certificados)} de 3 tipos de certificado`} />
      <section className="panel p-4 text-sm">
        {ev.eliminado ? (
          <p className="text-[var(--malo)] font-medium">En un primer embarque queda eliminado: {ev.motivos.join('; ')}.</p>
        ) : ev.pendientes.length ? (
          <p className="text-[var(--alerta)]">Para evaluarlo falta: {ev.pendientes.join('; ')}.</p>
        ) : (
          <p className="text-[var(--ok)]">Pasa los filtros de GESI para un primer embarque.</p>
        )}
      </section>
      <section className="panel">
        <h2 className="font-semibold text-sm px-4 pt-3 pb-2 border-b border-[var(--borde)]">Certificados</h2>
        {p.certificados.length === 0 ? (
          <p className="text-sm text-[var(--texto-tenue)] px-4 py-4">Ninguno registrado.</p>
        ) : (
          <ul>
            {p.certificados.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-3 px-4 py-2 border-b border-[var(--borde)] text-sm">
                <span>
                  <strong>{c.nombre}</strong> · {TIPO[c.tipo] ?? c.tipo}
                  {c.vigenteHasta ? ` · vigente hasta ${fecha(c.vigenteHasta)}` : ''}
                </span>
                <form action={quitarCertificado.bind(null, p.id, c.id)}>
                  <button className="text-xs text-[var(--malo)] hover:underline">Quitar</button>
                </form>
              </li>
            ))}
          </ul>
        )}
        <FormAccion accion={agregarCertificado.bind(null, p.id)} etiqueta="Agregar certificado" clase="px-4 py-3 grid gap-2 sm:grid-cols-3 items-end" limpiar>
          <label className="text-sm space-y-1">
            <span className="font-medium">Tipo</span>
            <select name="tipo" className="campo">
              {TIPOS_CERTIFICADO.map((t) => (
                <option key={t.valor} value={t.valor}>
                  {t.etiqueta} — {t.ayuda}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm space-y-1">
            <span className="font-medium">Certificado</span>
            <input name="nombre" className="campo" placeholder="ISO 9001" />
          </label>
          <label className="text-sm space-y-1">
            <span className="font-medium">Vigente hasta</span>
            <input name="vigenteHasta" type="date" className="campo" />
          </label>
        </FormAccion>
      </section>
      <FormAccion accion={guardarProveedor.bind(null, p.id)} etiqueta="Guardar datos" clase="panel p-5 space-y-4">
        <CamposProveedor p={{ ...p, familias: p.familias.map((f) => f.familiaId) }} familias={familias} />
      </FormAccion>
    </div>
  )
}
