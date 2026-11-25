import Link from 'next/link'
import { notFound } from 'next/navigation'

import { Encabezado, Volver, Chip } from '@/componentes/ui'
import FormAccion from '@/componentes/form-accion'
import { Camino, EstadoInv } from '@/componentes/etapas'
import { compraCompleta } from '@/lib/compras-db'
import { db } from '@/lib/db'
import { codigo } from '@/lib/codigos'
import { ETIQUETA_ETAPA, ETAPAS_COMPRA, SIGUE_ETAPA } from '@/lib/compra'
import { totalesOrden } from '@/lib/documentos'
import { numero, fecha, conUnidad } from '@/lib/formato'
import { invitarProveedor, marcarDeclino, registrarPago, cambiarEtapa, guardarMedida } from '@/app/acciones/compras'

export const dynamic = 'force-dynamic'

const TIPO_PAGO: Record<string, string> = { CARTA_CREDITO: 'Carta de crédito abierta', ANTICIPO: 'Anticipo', SALDO: 'Saldo' }

export default async function PaginaCompra({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const c = await compraCompleta(id)
  if (!c) notFound()

  // Para invitar: primero los proveedores que trabajan las familias de estos productos.
  const familias = new Set(c.lineas.map((l) => l.producto?.familiaId).filter((x): x is string => !!x))
  const proveedores = await db.proveedor.findMany({ orderBy: { nombre: 'asc' }, include: { familias: { include: { familia: true } } } })
  const invitados = new Set(c.invitaciones.map((i) => i.proveedorId))
  const disponibles = proveedores
    .filter((p) => !invitados.has(p.id))
    .map((p) => ({ ...p, afin: p.familias.some((f) => familias.has(f.familiaId)) }))
    .sort((a, b) => Number(b.afin) - Number(a.afin))
  const respondidas = c.invitaciones.filter((i) => i.cotizacion)

  return (
    <div className="space-y-5">
      <Volver href="/compras">Compras</Volver>
      <Encabezado
        titulo={c.titulo}
        codigo={<Chip tono="acento">{codigo('compra', c.numero)}</Chip>}
        descripcion={[`${c.incoterm}${c.lugar ? ` ${c.lugar}` : ''}`, c.destino && `destino ${c.destino}`, c.plazoRespuesta && `responder antes del ${fecha(c.plazoRespuesta)}`].filter(Boolean).join(' · ')}
      />

      <section className="panel p-4 space-y-3">
        <Camino etapa={c.etapaVale} />
        {c.origenEtapa && <p className="text-xs text-[var(--texto-suave)]">{c.origenEtapa}: la etapa se marcó sola.</p>}
        <p className="text-sm border-t border-[var(--borde)] pt-3">
          <span className="text-[var(--texto-suave)]">Qué sigue: </span>
          <strong>{SIGUE_ETAPA[c.etapaVale]}</strong>
        </p>
        <details className="text-sm">
          <summary className="cursor-pointer text-[var(--acento)]">Cambiar la etapa a mano</summary>
          <FormAccion accion={cambiarEtapa.bind(null, c.id)} etiqueta="Cambiar etapa" clase="mt-3 grid gap-3 sm:grid-cols-[14rem_1fr] items-end">
            <label className="space-y-1">
              <span className="font-medium">Etapa</span>
              <select name="etapa" className="campo" defaultValue={c.etapaVale}>
                {ETAPAS_COMPRA.map((e) => (
                  <option key={e} value={e}>
                    {ETIQUETA_ETAPA[e]}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1">
              <span className="font-medium">Nota</span>
              <input name="nota" className="campo" placeholder="Obligatoria para cancelar o volver atrás" />
            </label>
          </FormAccion>
        </details>
      </section>

      <section className="panel scroll-x">
        <h2 className="font-semibold text-sm px-4 pt-3 pb-2">Productos que se piden</h2>
        <table className="tabla">
          <thead>
            <tr>
              <th>#</th>
              <th>Descripción</th>
              <th>Especificación</th>
              <th className="text-right">Cantidad</th>
            </tr>
          </thead>
          <tbody>
            {c.lineas.map((l, i) => (
              <tr key={l.id}>
                <td className="num">{i + 1}</td>
                <td>{l.descripcion}</td>
                <td className="text-sm">{l.especificacion ?? '—'}</td>
                <td className="text-right num">{conUnidad(l.cantidad, l.unidad, l.cantidad % 1 ? 2 : 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="panel">
        <div className="px-4 py-3 border-b border-[var(--borde)]">
          <h2 className="font-semibold text-sm">Proveedores invitados</h2>
          <p className="text-xs text-[var(--texto-tenue)] mt-0.5">Una RFQ por proveedor. Respondida y Sin respuesta se marcan solas.</p>
        </div>
        {c.invitaciones.length === 0 ? (
          <p className="text-sm text-[var(--texto-tenue)] px-4 py-5">Todavía no invitas a nadie. Agrega proveedores abajo.</p>
        ) : (
          <div className="scroll-x">
            <table className="tabla">
              <thead>
                <tr>
                  <th>Proveedor</th>
                  <th>RFQ</th>
                  <th>Certificados</th>
                  <th>Filtros</th>
                  <th className="text-right">Total cotizado</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {c.invitaciones.map((i) => (
                  <tr key={i.id}>
                    <td>
                      <Link href={`/proveedores/${i.proveedorId}`} className="font-medium hover:text-[var(--acento)]">
                        {i.proveedor.nombre}
                      </Link>
                      <div className="text-xs text-[var(--texto-tenue)]">{[i.proveedor.pais, i.proveedor.canal.toLowerCase()].filter(Boolean).join(' · ')}</div>
                    </td>
                    <td>
                      <EstadoInv estado={i.estado} />
                    </td>
                    <td className="text-sm num">{i.evaluacion.puntaje} de 3 tipos</td>
                    <td className="text-sm">
                      {i.evaluacion.eliminado ? (
                        <span className="text-[var(--malo)] font-medium">Eliminado: {i.evaluacion.motivos.join('; ')}</span>
                      ) : i.evaluacion.pendientes.length ? (
                        <span className="text-[var(--alerta)]">{i.evaluacion.pendientes.join('; ')}</span>
                      ) : (
                        <span className="text-[var(--ok)]">Pasa</span>
                      )}
                    </td>
                    <td className="text-right num">
                      {i.cotizacion ? (i.total != null ? `${i.cotizacion.moneda} ${numero(i.total)}` : 'faltan precios') : '—'}
                    </td>
                    <td>
                      <div className="flex gap-2 justify-end flex-wrap">
                        <Link href={`/compras/${c.id}/rfq/${i.id}`} className="btn btn-neutro !py-1 !text-xs">
                          {i.enviadaEl ? 'Ver RFQ' : 'Enviar RFQ'}
                        </Link>
                        <Link href={`/compras/${c.id}/cotizacion/${i.id}`} className="btn btn-neutro !py-1 !text-xs">
                          {i.cotizacion ? 'Editar cotización' : 'Registrar cotización'}
                        </Link>
                        {!i.cotizacion && !i.declino && i.enviadaEl && (
                          <form action={marcarDeclino.bind(null, c.id, i.id)}>
                            <button className="btn btn-neutro !py-1 !text-xs">Declinó</button>
                          </form>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="px-4 py-3 border-t border-[var(--borde)]">
          {disponibles.length === 0 ? (
            <p className="text-sm text-[var(--texto-tenue)]">
              No quedan proveedores por invitar.{' '}
              <Link href="/proveedores/nuevo" className="text-[var(--acento)] hover:underline">
                Agrega uno
              </Link>
              .
            </p>
          ) : (
            <FormAccion accion={invitarProveedor.bind(null, c.id)} etiqueta="Invitar" clase="flex gap-2 items-end flex-wrap" limpiar>
              <label className="text-sm space-y-1 flex-1 min-w-60">
                <span className="font-medium">Invitar a un proveedor</span>
                <select name="proveedorId" className="campo" defaultValue="">
                  <option value="" disabled>
                    Elegir…
                  </option>
                  {disponibles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre}
                      {p.afin ? ' · trabaja esta familia' : ''}
                    </option>
                  ))}
                </select>
              </label>
            </FormAccion>
          )}
        </div>
      </section>

      {respondidas.length > 0 && (
        <section className="panel scroll-x">
          <div className="px-4 py-3 border-b border-[var(--borde)]">
            <h2 className="font-semibold text-sm">Comparativa de cotizaciones</h2>
            {c.avisoComparacion && <p className="text-sm text-[var(--alerta)] mt-1">{c.avisoComparacion}</p>}
          </div>
          <table className="tabla">
            <thead>
              <tr>
                <th>Producto</th>
                {respondidas.map((i) => (
                  <th key={i.id} className="text-right">
                    {i.proveedor.nombre}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {c.lineas.map((l) => {
                const precios = respondidas.map((i) => i.lineasCotizadas.find((x) => x.compraLineaId === l.id)?.precioUnitario ?? null)
                const minimo = Math.min(...precios.filter((p): p is number => p != null))
                return (
                  <tr key={l.id}>
                    <td>
                      {l.descripcion}
                      <div className="text-xs text-[var(--texto-tenue)]">precio por {l.unidad}</div>
                    </td>
                    {precios.map((p, k) => (
                      <td key={k} className={`text-right num ${p === minimo && respondidas.length > 1 ? 'font-semibold text-[var(--ok)]' : ''}`}>
                        {p != null ? numero(p, 2) : 'falta'}
                      </td>
                    ))}
                  </tr>
                )
              })}
              <tr>
                <td className="font-semibold">Total</td>
                {respondidas.map((i) => (
                  <td key={i.id} className="text-right num font-semibold">
                    {i.total != null ? `${i.cotizacion!.moneda} ${numero(i.total)}` : '—'}
                  </td>
                ))}
              </tr>
              {c.medidaRef != null && (
                <tr>
                  <td className="text-sm">
                    Por {c.unidadRef}
                    <div className="text-xs text-[var(--texto-tenue)]">total ÷ {numero(c.medidaRef, c.medidaRef % 1 ? 2 : 0)} {c.unidadRef}</div>
                  </td>
                  {respondidas.map((i) => (
                    <td key={i.id} className="text-right num">
                      {i.porMedida != null ? numero(i.porMedida, 2) : '—'}
                    </td>
                  ))}
                </tr>
              )}
              {respondidas.some((i) => i.toneladas != null) && (
                <>
                  <tr>
                    <td className="text-sm">
                      Acero
                      <div className="text-xs text-[var(--texto-tenue)]">toneladas de su desglose</div>
                    </td>
                    {respondidas.map((i) => (
                      <td key={i.id} className="text-right num">
                        {i.toneladas != null ? `${numero(i.toneladas, 2)} t` : '—'}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="text-sm">
                      Por tonelada
                      <div className="text-xs text-[var(--texto-tenue)]">total ÷ toneladas: incluye planchas, pernos y gastos</div>
                    </td>
                    {respondidas.map((i) => (
                      <td key={i.id} className="text-right num">
                        {i.porTonelada != null ? numero(i.porTonelada, 0) : '—'}
                      </td>
                    ))}
                  </tr>
                </>
              )}
              <tr>
                <td className="text-sm">Documento</td>
                {respondidas.map((i) => (
                  <td key={i.id} className="text-right text-sm">
                    {i.cotizacion!.archivo ? (
                      <a href={`/documentos/${i.cotizacion!.archivo}`} target="_blank" rel="noreferrer" className="text-[var(--acento)] underline">
                        PDF ↗
                      </a>
                    ) : (
                      <span className="text-[var(--texto-tenue)]">sin PDF</span>
                    )}
                    {i.cotizacion!.desglose.length > 0 && (
                      <Link href={`/compras/${c.id}/cotizacion/${i.id}`} className="block text-xs text-[var(--texto-tenue)] underline">
                        desglose: {i.cotizacion!.desglose.length} ítems
                      </Link>
                    )}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="text-sm">Incoterm y lugar</td>
                {respondidas.map((i) => (
                  <td key={i.id} className="text-right text-sm">
                    {i.cotizacion!.incoterm} {i.cotizacion!.lugar ?? ''}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="text-sm">Plazo de producción · validez</td>
                {respondidas.map((i) => (
                  <td key={i.id} className="text-right text-sm num">
                    {i.cotizacion!.leadTimeDias != null ? `${i.cotizacion!.leadTimeDias} días` : '—'} · {i.cotizacion!.validezDias != null ? `${i.cotizacion!.validezDias} días` : '—'}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="text-sm">Filtros</td>
                {respondidas.map((i) => (
                  <td key={i.id} className={`text-right text-sm ${i.evaluacion.eliminado ? 'text-[var(--malo)]' : ''}`}>
                    {i.evaluacion.eliminado ? 'Eliminado' : i.evaluacion.pendientes.length ? 'Pendiente' : 'Pasa'}
                  </td>
                ))}
              </tr>
              <tr>
                <td></td>
                {respondidas.map((i) => (
                  <td key={i.id} className="text-right">
                    {i.evaluacion.eliminado ? (
                      <span className="text-xs text-[var(--texto-tenue)]">No se le emite OC</span>
                    ) : (
                      <Link href={`/compras/${c.id}/orden/${i.cotizacion!.id}`} className="btn btn-primario !py-1 !text-xs">
                        Emitir OC
                      </Link>
                    )}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
          <FormAccion accion={guardarMedida.bind(null, c.id)} etiqueta="Guardar medida" clase="flex flex-wrap items-end gap-3 px-4 py-3 border-t border-[var(--borde)]">
            <label className="text-sm space-y-1">
              <span className="font-medium">Medida para comparar</span>
              <input name="medidaRef" className="campo num w-28" inputMode="decimal" defaultValue={c.medidaRef != null ? String(c.medidaRef).replace('.', ',') : ''} placeholder="722" />
            </label>
            <label className="text-sm space-y-1">
              <span className="font-medium">Unidad</span>
              <input name="unidadRef" className="campo w-20" defaultValue={c.unidadRef ?? ''} placeholder="m²" />
            </label>
            <p className="text-xs text-[var(--texto-tenue)] basis-full">Cuando cada proveedor cubica distinto: los m² del galpón dan «precio por m²» y comparan ofertas que no se comparan ítem por ítem.</p>
          </FormAccion>
        </section>
      )}

      {c.ordenes.length > 0 && (
        <section className="panel">
          <h2 className="font-semibold text-sm px-4 pt-3 pb-2 border-b border-[var(--borde)]">Órdenes de compra</h2>
          {c.ordenes.map((o) => {
            const t = totalesOrden(o.lineas, o.descuentoPct)
            return (
              <div key={o.id} className="px-4 py-3 border-b border-[var(--borde)] last:border-0 space-y-2">
                <div className="flex items-center gap-3 flex-wrap">
                  <strong className="num">{codigo('orden', o.numero)}</strong>
                  <span className="text-sm">{o.cotizacion.invitacion.proveedor.nombre}</span>
                  <span className="text-sm num">
                    {o.moneda} {numero(t.total)}
                  </span>
                  <span className="text-sm text-[var(--texto-suave)]">{o.formaPago === 'CARTA_CREDITO' ? 'Carta de crédito' : `T/T ${o.anticipoPct ?? 30}/${100 - (o.anticipoPct ?? 30)}`}</span>
                  <Link href={`/imprimir/oc/${o.id}`} className="text-sm text-[var(--acento)] hover:underline">
                    Ver en inglés
                  </Link>
                  <Link href={`/imprimir/oc/${o.id}?idioma=es`} className="text-sm text-[var(--acento)] hover:underline">
                    Ver en español
                  </Link>
                </div>
                {o.pagos.length > 0 && (
                  <ul className="text-sm text-[var(--texto-suave)]">
                    {o.pagos.map((p) => (
                      <li key={p.id}>
                        {fecha(p.fecha)} · {TIPO_PAGO[p.tipo] ?? p.tipo}
                        {p.monto != null ? ` · ${o.moneda} ${numero(p.monto)}` : ''}
                        {p.nota ? ` · ${p.nota}` : ''}
                      </li>
                    ))}
                  </ul>
                )}
                <FormAccion accion={registrarPago.bind(null, c.id, o.id)} etiqueta="Registrar pago" clase="flex gap-2 items-end flex-wrap" limpiar>
                  <label className="text-sm space-y-1">
                    <span className="font-medium">Pago</span>
                    <select name="tipo" className="campo" defaultValue={o.formaPago === 'CARTA_CREDITO' ? 'CARTA_CREDITO' : 'ANTICIPO'}>
                      <option value="CARTA_CREDITO">Carta de crédito abierta</option>
                      <option value="ANTICIPO">Anticipo</option>
                      <option value="SALDO">Saldo</option>
                    </select>
                  </label>
                  <label className="text-sm space-y-1">
                    <span className="font-medium">Monto</span>
                    <input name="monto" className="campo num w-32" inputMode="decimal" />
                  </label>
                  <label className="text-sm space-y-1">
                    <span className="font-medium">Fecha</span>
                    <input name="fecha" type="date" className="campo" />
                  </label>
                </FormAccion>
              </div>
            )
          })}
        </section>
      )}
    </div>
  )
}
