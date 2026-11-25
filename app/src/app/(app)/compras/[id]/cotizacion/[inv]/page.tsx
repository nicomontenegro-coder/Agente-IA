import { notFound } from 'next/navigation'

import { Encabezado, Volver } from '@/componentes/ui'
import FormAccion from '@/componentes/form-accion'
import { compraCompleta } from '@/lib/compras-db'
import { db } from '@/lib/db'
import { codigo } from '@/lib/codigos'
import { INCOTERM_LABEL } from '@/lib/incoterms'
import { fechaInput, conUnidad, numero } from '@/lib/formato'
import { hayLectorIa, type LecturaCotizacion } from '@/lib/leer-cotizacion'
import { revisarDesglose, cuadraConPedido, type LineaDesglose } from '@/lib/lectura'
import { totalCotizacion } from '@/lib/proveedores'
import { registrarCotizacion, subirPdf } from '@/app/acciones/compras'

export const dynamic = 'force-dynamic'

/** Los números en el formato que se escribe: coma decimal, sin punto de miles. */
const fmt = (x: number | null | undefined) => (x == null ? '' : String(x).replace('.', ','))

export default async function PaginaCotizacion({
  params,
  searchParams
}: {
  params: Promise<{ id: string; inv: string }>
  searchParams: Promise<{ lectura?: string }>
}) {
  const { id, inv } = await params
  const { lectura: lecturaId } = await searchParams
  const c = await compraCompleta(id)
  const i = c?.invitaciones.find((x) => x.id === inv)
  if (!c || !i) notFound()
  const cot = i.cotizacion
  const pendiente = lecturaId ? await db.lecturaPendiente.findUnique({ where: { id: lecturaId } }) : null
  const lp = pendiente?.invitacionId === i.id ? pendiente : null
  const leido: LecturaCotizacion | null = lp?.lectura ? JSON.parse(lp.lectura) : null
  const lector = hayLectorIa()

  // Lo que se muestra en el formulario: lo leído manda sobre lo guardado.
  const precioLeido = (lineaId: string) => leido?.preciosPorLinea.find((p) => p.lineaId === lineaId)
  const precio = (lineaId: string) => (leido ? precioLeido(lineaId)?.precioUnitario : cot?.lineas.find((l) => l.compraLineaId === lineaId)?.precioUnitario)
  const desglose: LineaDesglose[] = leido?.desglose ?? cot?.desglose ?? []
  const documento = leido
    ? { subtotal: leido.subtotal, gastos: leido.gastosHastaFob, total: leido.total }
    : { subtotal: cot?.subtotalDocumento ?? null, gastos: cot?.gastosDocumento ?? null, total: cot?.totalDocumento ?? null }
  const lc = leido ? leido.aceptaCartaCredito ?? i.proveedor.aceptaCartaCredito : cot?.aceptaCartaCredito ?? i.proveedor.aceptaCartaCredito
  const incoterm = leido?.incoterm && leido.incoterm in INCOTERM_LABEL ? leido.incoterm : cot?.incoterm ?? c.incoterm
  const notas = leido ? [leido.condicionesPago && `Pago: ${leido.condicionesPago}`, leido.noIncluye && `No incluye: ${leido.noIncluye}`].filter(Boolean).join('. ') : cot?.notas ?? ''

  // La app rehace las cuentas de lo leído: la IA puede leer mal un número.
  const moneda = leido?.moneda ?? cot?.moneda ?? 'USD'
  const revision = revisarDesglose(desglose, documento)
  const totalLineas = totalCotizacion(c.lineas.map((l) => ({ compraLineaId: l.id, cantidad: l.cantidad, precioUnitario: precio(l.id) ?? null })))
  const problemas = [...revision.problemas, cuadraConPedido(totalLineas, documento.total, moneda)].filter((x): x is string => !!x)
  const archivo = lp?.archivo ?? cot?.archivo
  const archivoNombre = lp?.archivoNombre ?? cot?.archivoNombre

  return (
    <div className="space-y-5 max-w-4xl">
      <Volver href={`/compras/${c.id}`}>{codigo('compra', c.numero)}</Volver>
      <Encabezado
        titulo={`Cotización de ${i.proveedor.nombre}`}
        descripcion={lector ? 'Sube el PDF y la IA llena el formulario. Tú lo revisas contra el documento y guardas.' : 'Copia lo que dice su documento. Un dato que no viene, déjalo en blanco: no lo supongas.'}
      />

      <section className="panel p-4 space-y-3">
        <h2 className="font-semibold text-sm">Documento del proveedor</h2>
        {archivo && (
          <p className="text-sm">
            <a href={`/documentos/${archivo}`} target="_blank" rel="noreferrer" className="text-[var(--acento)] underline">
              Abrir {archivoNombre ?? 'el PDF'} ↗
            </a>
            {lp && !cot?.archivo && <span className="text-[var(--texto-tenue)]"> · queda adjunto al guardar</span>}
          </p>
        )}
        <FormAccion accion={subirPdf.bind(null, c.id, i.id)} etiqueta={lector ? 'Leer el PDF' : 'Adjuntar PDF'} clase="flex flex-wrap items-end gap-3">
          <label className="text-sm space-y-1">
            <span className="font-medium">{archivo ? 'Cambiar por otro PDF' : 'PDF de la cotización'}</span>
            <input name="pdf" type="file" accept="application/pdf" className="campo" required />
          </label>
        </FormAccion>
        {lector ? (
          <p className="text-xs text-[var(--texto-tenue)]">La lectura toma entre medio y un minuto. No guarda nada: propone.</p>
        ) : (
          <p className="text-xs text-[var(--texto-tenue)]">El lector con IA no está activo en este servidor: el PDF se adjunta y los datos se copian a mano.</p>
        )}
      </section>

      {lp && (
        <section className="panel p-4 space-y-2" aria-label="Revisión de la lectura">
          <h2 className="font-semibold text-sm">{leido ? 'Lo que leyó la IA: revísalo antes de guardar' : 'PDF adjunto'}</h2>
          {lp.error && <p className="text-sm text-[var(--malo)]">No se pudo leer: {lp.error}</p>}
          {leido && desglose.length > 0 && problemas.length === 0 && (
            <p className="text-sm text-[var(--ok)]">
              Las cuentas cuadran: {desglose.length} ítems suman {moneda} {numero(revision.suma ?? 0, 2)}
              {documento.gastos ? `, más ${numero(documento.gastos, 2)} de gastos hasta puerto` : ''} = {moneda} {numero(documento.total ?? 0, 2)}, igual que el documento.
            </p>
          )}
          {problemas.length > 0 && (
            <ul className="text-sm text-[var(--alerta)] list-disc pl-5">
              {problemas.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          )}
          {leido && leido.dudas.length > 0 && (
            <>
              <p className="text-sm font-medium">La IA no está segura de:</p>
              <ul className="text-sm list-disc pl-5">
                {leido.dudas.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
            </>
          )}
        </section>
      )}

      <FormAccion accion={registrarCotizacion.bind(null, c.id, i.id)} etiqueta="Guardar cotización" clase="space-y-5">
        {lp && <input type="hidden" name="lecturaId" value={lp.id} />}
        <section className="panel p-5 grid gap-3 sm:grid-cols-3">
          <label className="text-sm space-y-1">
            <span className="font-medium">Recibida el</span>
            <input name="recibidaEl" type="date" className="campo" defaultValue={leido?.fecha ?? fechaInput(cot?.recibidaEl ?? new Date())} />
          </label>
          <label className="text-sm space-y-1">
            <span className="font-medium">N° o referencia del proveedor</span>
            <input name="referencia" className="campo" defaultValue={(leido ? leido.referencia : cot?.referencia) ?? ''} />
          </label>
          <label className="text-sm space-y-1">
            <span className="font-medium">Moneda</span>
            <input name="moneda" className="campo" defaultValue={moneda} />
          </label>
          <label className="text-sm space-y-1">
            <span className="font-medium">Incoterm que cotizó</span>
            <select name="incoterm" className="campo" defaultValue={incoterm}>
              {Object.entries(INCOTERM_LABEL).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm space-y-1">
            <span className="font-medium">Lugar</span>
            <input name="lugar" className="campo" defaultValue={(leido ? leido.lugar : cot?.lugar) ?? c.lugar ?? ''} />
          </label>
          <label className="text-sm space-y-1">
            <span className="font-medium">¿Acepta carta de crédito?</span>
            <select name="aceptaCartaCredito" className="campo" defaultValue={lc === true ? 'SI' : lc === false ? 'NO' : ''}>
              <option value="">No lo dice</option>
              <option value="SI">Sí</option>
              <option value="NO">No</option>
            </select>
          </label>
          <label className="text-sm space-y-1">
            <span className="font-medium">Plazo de producción (días)</span>
            <input name="leadTimeDias" className="campo num" inputMode="numeric" defaultValue={(leido ? leido.leadTimeDias : cot?.leadTimeDias) ?? ''} />
          </label>
          <label className="text-sm space-y-1">
            <span className="font-medium">Validez (días)</span>
            <input name="validezDias" className="campo num" inputMode="numeric" defaultValue={(leido ? leido.validezDias : cot?.validezDias) ?? ''} />
          </label>
          <label className="text-sm space-y-1">
            <span className="font-medium">MOQ</span>
            <input name="moq" className="campo" defaultValue={(leido ? leido.moq : cot?.moq) ?? ''} placeholder="1 contenedor de 40'" />
          </label>
        </section>

        <section className="panel scroll-x">
          <h2 className="font-semibold text-sm px-4 pt-3 pb-2">Precio por producto pedido</h2>
          <table className="tabla">
            <thead>
              <tr>
                <th>Producto</th>
                <th className="text-right">Cantidad pedida</th>
                <th className="text-right">Precio unitario</th>
              </tr>
            </thead>
            <tbody>
              {c.lineas.map((l) => (
                <tr key={l.id}>
                  <td>
                    {l.descripcion}
                    {l.especificacion && <div className="text-xs text-[var(--texto-tenue)]">{l.especificacion}</div>}
                    {precioLeido(l.id) && <div className="text-xs text-[var(--texto-tenue)]">Del PDF: «{precioLeido(l.id)!.cita}»</div>}
                  </td>
                  <td className="text-right num">{conUnidad(l.cantidad, l.unidad, l.cantidad % 1 ? 2 : 0)}</td>
                  <td className="text-right">
                    <input name={`precio-${l.id}`} className="campo num w-32 ml-auto" inputMode="decimal" defaultValue={fmt(precio(l.id))} aria-label={`Precio de ${l.descripcion}`} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="panel p-5 grid gap-3 sm:grid-cols-3">
          <p className="sm:col-span-3 text-xs text-[var(--texto-tenue)]">Los totales tal como los escribe el documento: la app los usa para comprobar que las cuentas cuadren.</p>
          <label className="text-sm space-y-1">
            <span className="font-medium">Subtotal de los ítems</span>
            <input name="subtotalDocumento" className="campo num" inputMode="decimal" defaultValue={fmt(documento.subtotal)} placeholder="EXW" />
          </label>
          <label className="text-sm space-y-1">
            <span className="font-medium">Gastos hasta puerto</span>
            <input name="gastosDocumento" className="campo num" inputMode="decimal" defaultValue={fmt(documento.gastos)} placeholder="FOB cost" />
          </label>
          <label className="text-sm space-y-1">
            <span className="font-medium">Total del documento</span>
            <input name="totalDocumento" className="campo num" inputMode="decimal" defaultValue={fmt(documento.total)} />
          </label>
        </section>

        <details className="panel" open={desglose.length > 0}>
          <summary className="font-semibold text-sm px-4 py-3 cursor-pointer">
            Desglose del proveedor {desglose.length > 0 && <span className="font-normal text-[var(--texto-tenue)]">· {desglose.length} ítems</span>}
          </summary>
          <p className="px-4 pb-2 text-xs text-[var(--texto-tenue)]">Cómo arma su precio (su cubicación). No reemplaza lo pedido: sirve para comparar toneladas, metros y qué incluye cada uno.</p>
          <div className="scroll-x">
            <table className="tabla">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Ítem</th>
                  <th>Unidad</th>
                  <th className="text-right">Cantidad</th>
                  <th className="text-right">Precio</th>
                  <th className="text-right">Monto</th>
                </tr>
              </thead>
              <tbody>
                {/* Tres filas en blanco para agregar a mano lo que falte. */}
                {[...desglose, ...Array.from({ length: 3 }, () => null)].map((d, k) => (
                  <tr key={k}>
                    <td className="num text-[var(--texto-tenue)]">{k + 1}</td>
                    <td>
                      <input name="d-descripcion" className="campo min-w-56" defaultValue={d?.descripcion ?? ''} aria-label={`Ítem ${k + 1}`} />
                    </td>
                    <td>
                      <input name="d-unidad" className="campo w-16" defaultValue={d?.unidad ?? ''} aria-label={`Unidad del ítem ${k + 1}`} />
                    </td>
                    <td>
                      <input name="d-cantidad" className="campo num w-24" inputMode="decimal" defaultValue={fmt(d?.cantidad)} aria-label={`Cantidad del ítem ${k + 1}`} />
                    </td>
                    <td>
                      <input name="d-precio" className="campo num w-24" inputMode="decimal" defaultValue={fmt(d?.precioUnitario)} aria-label={`Precio del ítem ${k + 1}`} />
                    </td>
                    <td>
                      <input name="d-monto" className="campo num w-28" inputMode="decimal" defaultValue={fmt(d?.monto)} aria-label={`Monto del ítem ${k + 1}`} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>

        <label className="text-sm space-y-1 block">
          <span className="font-medium">Notas</span>
          <textarea name="notas" rows={2} className="campo" defaultValue={notas} placeholder="Condiciones de pago, qué no incluye…" />
        </label>
        <label className="text-sm flex items-center gap-2">
          <input type="checkbox" name="aceptoDiferencias" />
          Guardar igual si las cuentas no cuadran (el error es del documento del proveedor)
        </label>
      </FormAccion>
    </div>
  )
}
