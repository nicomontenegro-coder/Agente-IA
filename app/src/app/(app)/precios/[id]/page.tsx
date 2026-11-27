import Link from 'next/link'
import { notFound } from 'next/navigation'

import { Encabezado, Volver, Chip } from '@/componentes/ui'
import { db } from '@/lib/db'
import { fecha, numero } from '@/lib/formato'
import { vigencia, familiasDe } from '@/lib/lista-venta'
import { pnDe } from '@/lib/normas-ppr'
import { crearListaVenta } from '@/app/acciones/precios'
import { enviarMensaje, aprobarPropuesta, descartarPropuesta } from '@/app/acciones/asistente'
import FormAccion from '@/componentes/form-accion'
import TablaInteractiva from '@/componentes/tabla-interactiva'
import { contextoLista } from '@/lib/asistente'
import { hayLectorIa } from '@/lib/leer-cotizacion'
import type { Cambio } from '@/lib/propuestas'

const NOMBRE_CAMPO: Record<string, string> = { pn: 'PN', descripcion: 'Descripción', especificacion: 'Medida', familia: 'Familia', unidad: 'Unidad' }

export const dynamic = 'force-dynamic'

export default async function PaginaLista({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const l = await db.listaPrecios.findUnique({ where: { id }, include: { proveedor: true, items: { orderBy: { posicion: 'asc' } }, ventas: { orderBy: { creadoEn: 'desc' } } } })
  if (!l) notFound()
  const v = vigencia(l.fecha, l.validezDias)
  const familias = familiasDe(l.items)
  const sinPrecio = l.items.filter((i) => i.precio == null).length
  const contexto = contextoLista(l.id)
  const [mensajes, propuestas] = await Promise.all([
    db.chatMensaje.findMany({ where: { contexto }, orderBy: { creadoEn: 'asc' } }),
    db.propuesta.findMany({ where: { contexto, estado: 'PENDIENTE' }, orderBy: { creadoEn: 'asc' } })
  ])
  const nombreItem = new Map(l.items.map((i) => [i.id, `${i.descripcion} ${i.especificacion ?? ''}`.trim()]))
  const hayPn = l.items.some((i) => pnDe(i.especificacion, i.pn))
  return (
    <div className="space-y-5">
      <Volver href="/precios">Listas de precios</Volver>
      <Encabezado
        titulo={`Lista de precios de ${l.proveedor.nombre}`}
        descripcion={[`${fecha(l.fecha)}`, `${l.incoterm ?? ''} ${l.lugar ?? ''}`.trim(), l.moneda, `${l.items.length} productos`].filter(Boolean).join(' · ')}
      />
      <section className="panel p-4 space-y-2 text-sm">
        <div className="flex flex-wrap items-center gap-3">
          {v.dias == null ? <Chip>Sin validez indicada</Chip> : v.vencida ? <Chip tono="malo">Vencida el {fecha(v.vence!)}</Chip> : <Chip tono="ok">Vigente hasta el {fecha(v.vence!)}</Chip>}
          <a href={`/documentos/${l.archivo}`} target="_blank" rel="noreferrer" className="text-[var(--acento)] underline">
            Abrir {l.archivoNombre} ↗
          </a>
        </div>
        <p>
          Productos GESI: {l.items.filter((i) => i.productoId).length} de {l.items.length} ítems enlazados ·{' '}
          <Link href={`/precios/${l.id}/productos`} className="text-[var(--acento)] underline">
            Revisar y enlazar
          </Link>
        </p>
        {v.vencida && <p className="text-[var(--alerta)]">Los precios pueden haber cambiado: confírmalos con el proveedor antes de vender sobre ellos.</p>}
        {sinPrecio > 0 && <p className="text-[var(--texto-suave)]">{sinPrecio} medidas sin precio en la lista: no se incluyen en las listas de venta.</p>}
        {l.notas && (
          <ul className="list-disc pl-5 text-[var(--texto-suave)]">
            {l.notas.split('\n').map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        )}
      </section>

      {hayLectorIa() && (
        <section className="panel p-4 space-y-3" aria-label="Asistente">
          <div>
            <h2 className="font-semibold text-sm">Asistente</h2>
            <p className="text-xs text-[var(--texto-tenue)]">Consultas sobre esta lista. Los cambios que proponga quedan pendientes hasta que los apruebes.</p>
          </div>
          {mensajes.length > 0 && (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {mensajes.map((m) => (
                <div key={m.id} className={`text-sm rounded-lg px-3 py-2 whitespace-pre-wrap ${m.rol === 'USUARIO' ? 'bg-[var(--acento-suave)] ml-8' : 'bg-[var(--panel-alt)] mr-8'}`}>
                  {m.texto}
                </div>
              ))}
            </div>
          )}
          {propuestas.map((p) => {
            const cambios = JSON.parse(p.cambios) as (Cambio & { antes: string | null })[]
            return (
              <div key={p.id} className="border border-[var(--borde)] rounded-lg p-3 space-y-2">
                <p className="text-sm font-medium">Propuesta: {p.descripcion}</p>
                <div className="scroll-x">
                  <table className="tabla">
                    <thead>
                      <tr>
                        <th>Producto</th>
                        <th>Campo</th>
                        <th>Antes</th>
                        <th>Después</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cambios.map((c, k) => (
                        <tr key={k}>
                          <td>{nombreItem.get(c.itemId) ?? c.itemId}</td>
                          <td>{NOMBRE_CAMPO[c.campo] ?? c.campo}</td>
                          <td className="text-[var(--texto-tenue)]">{c.antes ?? '—'}</td>
                          <td className="font-medium">{c.valor || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex gap-2">
                  <form action={aprobarPropuesta.bind(null, l.id, p.id)}>
                    <button className="btn btn-primario">Aprobar</button>
                  </form>
                  <form action={descartarPropuesta.bind(null, l.id, p.id)}>
                    <button className="btn btn-neutro">Descartar</button>
                  </form>
                </div>
              </div>
            )
          })}
          <FormAccion accion={enviarMensaje.bind(null, l.id)} etiqueta="Enviar" clase="space-y-2" limpiar>
            <textarea name="texto" rows={2} className="campo" placeholder="Por ejemplo: ¿puedes indicar el PN de los tubos según su espesor?" aria-label="Consulta al asistente" required />
          </FormAccion>
        </section>
      )}

      <section className="panel p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold text-sm">Listas de venta</h2>
          <form action={crearListaVenta.bind(null, l.id)}>
            <button className="btn btn-primario">Nueva lista de venta</button>
          </form>
        </div>
        {l.ventas.length === 0 ? (
          <p className="text-sm text-[var(--texto-suave)]">Sin listas de venta. Crea una para fijar factor y margen por familia.</p>
        ) : (
          <ul className="text-sm space-y-1">
            {l.ventas.map((x) => (
              <li key={x.id}>
                <Link href={`/precios/venta/${x.id}`} className="text-[var(--acento)] hover:underline">
                  {x.titulo}
                </Link>
                <span className="text-[var(--texto-tenue)]"> · actualizada el {fecha(x.actualizadoEn)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="panel">
        <h2 className="font-semibold text-sm px-4 pt-3">Productos ({familias.map((f) => `${f.familia}: ${f.productos}`).join(' · ')})</h2>
        <TablaInteractiva
          filtrarPor="familia"
          etiquetaFiltro="Familia"
          archivo={`Lista ${l.proveedor.nombre} ${l.fecha.toISOString().slice(0, 10)}`}
          columnas={[
            { clave: 'familia', titulo: 'Familia' },
            { clave: 'producto', titulo: 'Producto' },
            { clave: 'medida', titulo: 'Medida' },
            ...(hayPn ? [{ clave: 'pn', titulo: 'PN' }] : []),
            { clave: 'unidad', titulo: 'Unidad' },
            { clave: 'precio', titulo: `Precio ${l.moneda}`, derecha: true }
          ]}
          filas={l.items.map((i) => ({
            id: i.id,
            celdas: {
              familia: { texto: i.familia, valor: i.familia },
              producto: { texto: i.descripcion, valor: i.descripcion, sub: i.grupo ?? undefined },
              medida: { texto: i.especificacion ?? '—', valor: i.especificacion },
              pn: { texto: pnDe(i.especificacion, i.pn) ?? '—', valor: pnDe(i.especificacion, i.pn) },
              unidad: { texto: i.unidad, valor: i.unidad },
              precio: { texto: i.precio != null ? numero(i.precio, 3) : 'sin precio', valor: i.precio }
            }
          }))}
        />
      </section>
    </div>
  )
}
