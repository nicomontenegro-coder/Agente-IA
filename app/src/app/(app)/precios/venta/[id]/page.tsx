import Link from 'next/link'
import { notFound } from 'next/navigation'

import { Encabezado, Volver } from '@/componentes/ui'
import FormAccion from '@/componentes/form-accion'
import TablaInteractiva from '@/componentes/tabla-interactiva'
import { db } from '@/lib/db'
import { fecha, numero } from '@/lib/formato'
import { filasDeVenta, vigencia, familiasDe, pisoDeVenta, precioCanal, margenConDescuento } from '@/lib/lista-venta'
import { guardarListaVenta } from '@/app/acciones/precios'

export const dynamic = 'force-dynamic'

const fmt = (x: number | null | undefined) => (x == null ? '' : String(x).replace('.', ','))

/** La lista de venta por dentro: parámetros, costos y márgenes. El cliente ve solo el documento impreso. */
export default async function PaginaListaVenta({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const v = await db.listaVenta.findUnique({
    where: { id },
    include: { familias: true, canales: { orderBy: { posicion: 'asc' }, include: { canal: true } }, listaPrecios: { include: { proveedor: true, items: { orderBy: { posicion: 'asc' } } } } }
  })
  if (!v) notFound()
  const l = v.listaPrecios
  const todosLosCanales = await db.canalVenta.findMany({ orderBy: [{ posicion: 'asc' }, { nombre: 'asc' }] })
  // En el orden del documento del proveedor: la base no garantiza ninguno, y
  // con las filas cambiadas de lugar el factor de los tubos cae en los codos.
  const orden = familiasDe(l.items).map((f) => f.familia)
  const familias = [...v.familias].sort((a, b) => orden.indexOf(a.familia) - orden.indexOf(b.familia))
  const filas = filasDeVenta(l.items, { factor: v.factor, tipoCambio: v.tipoCambio }, familias)
  const vig = vigencia(l.fecha, l.validezDias)
  const conPrecio = new Set(filas.map((f) => f.familia))
  const faltaTc = v.tipoCambio == null

  return (
    <div className="space-y-5">
      <Volver href={`/precios/${l.id}`}>Lista de {l.proveedor.nombre}</Volver>
      <Encabezado titulo={v.titulo} descripcion={`Desde la lista de ${l.proveedor.nombre} del ${fecha(l.fecha)} · ${l.incoterm ?? ''} ${l.lugar ?? ''} · ${l.moneda}`} />
      {vig.vencida && <p className="text-sm text-[var(--alerta)]">La lista del proveedor venció el {fecha(vig.vence!)}: confirma sus precios antes de ofrecer.</p>}

      <FormAccion accion={guardarListaVenta.bind(null, v.id)} etiqueta="Guardar" clase="space-y-4">
        <section className="panel p-5 grid gap-3 sm:grid-cols-2">
          <label className="text-sm space-y-1 sm:col-span-2">
            <span className="font-medium">Título</span>
            <input name="titulo" className="campo" defaultValue={v.titulo} placeholder="Preventa tubería PPR — llegada marzo 2027" />
          </label>
          <label className="text-sm space-y-1">
            <span className="font-medium">Tipo de cambio (CLP por USD)</span>
            <input name="tipoCambio" className="campo num" inputMode="decimal" defaultValue={fmt(v.tipoCambio)} placeholder="950" />
          </label>
          <label className="text-sm space-y-1">
            <span className="font-medium">Factor de internación</span>
            <input name="factor" className="campo num" inputMode="decimal" defaultValue={fmt(v.factor)} placeholder="1,45" />
            <span className="block text-xs text-[var(--texto-tenue)]">Costo puesto en bodega ÷ FOB, de un costeo real.</span>
          </label>
          <label className="text-sm space-y-1">
            <span className="font-medium">De dónde sale el factor</span>
            <input name="factorOrigen" className="campo" defaultValue={v.factorOrigen ?? ''} placeholder="Costeo embarque octubre (Excel)" />
          </label>
          <label className="text-sm space-y-1">
            <span className="font-medium">Margen mínimo %</span>
            <input name="margenMinimo" className="campo num" inputMode="decimal" defaultValue={fmt(v.margenMinimoPct)} placeholder="35" />
            <span className="block text-xs text-[var(--texto-tenue)]">El piso al negociar: fija el precio mínimo y el descuento máximo de cada producto.</span>
          </label>
          <label className="text-sm space-y-1">
            <span className="font-medium">Validez de la lista de venta (días)</span>
            <input name="validezDias" className="campo num" inputMode="numeric" defaultValue={v.validezDias ?? ''} />
          </label>
          <label className="text-sm space-y-1">
            <span className="font-medium">Entrega</span>
            <input name="entrega" className="campo" defaultValue={v.entrega ?? ''} placeholder="Llegada estimada a bodega en Santiago: marzo 2027" />
          </label>
          <label className="text-sm space-y-1">
            <span className="font-medium">Condiciones</span>
            <input name="condiciones" className="campo" defaultValue={v.condiciones ?? ''} placeholder="Reserva con 30% de anticipo, saldo contra entrega" />
          </label>
        </section>

        <section className="panel scroll-x">
          <h2 className="font-semibold text-sm px-4 pt-3 pb-1">Margen y unidad de venta por familia</h2>
          <p className="px-4 pb-2 text-xs text-[var(--texto-tenue)]">
            Margen sobre el precio de venta (35 da 35%). Si la familia no se vende en la unidad del proveedor, indica la unidad de venta y cuánto trae: tira de 4 m = 4 m. Sin margen, la familia no se ofrece.
          </p>
          <table className="tabla">
            <thead>
              <tr>
                <th>Familia</th>
                <th className="text-right">Margen %</th>
                <th>Se vende por</th>
                <th className="text-right">Trae</th>
              </tr>
            </thead>
            <tbody>
              {familias.map((f) => {
                const unidad = l.items.find((i) => i.familia === f.familia)?.unidad ?? ''
                return (
                  <tr key={f.id}>
                    <td>
                      {f.familia}
                      <input type="hidden" name="familia" value={f.familia} />
                      <div className="text-xs text-[var(--texto-tenue)]">{conPrecio.has(f.familia) ? `proveedor cotiza por ${unidad}` : 'no se ofrece'}</div>
                    </td>
                    <td className="text-right">
                      <input name="margen" className="campo num w-20 ml-auto" inputMode="decimal" defaultValue={fmt(f.margenPct)} placeholder="35" aria-label={`Margen de ${f.familia}`} />
                    </td>
                    <td>
                      <input name="unidadVenta" className="campo w-36" defaultValue={f.unidadVenta ?? ''} placeholder={unidad} aria-label={`Unidad de venta de ${f.familia}`} />
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <input name="contenido" className="campo num w-20" inputMode="decimal" defaultValue={fmt(f.contenido)} aria-label={`Cuánto trae cada unidad de venta de ${f.familia}`} />
                        <span className="text-sm text-[var(--texto-suave)]">{unidad}</span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </section>
        <section className="panel scroll-x">
          <h2 className="font-semibold text-sm px-4 pt-3 pb-1">Canales de venta</h2>
          <p className="px-4 pb-2 text-xs text-[var(--texto-tenue)]">Descuento sobre el precio de lista para cada canal. No puede dejar el margen bajo el mínimo en ninguna familia. Los canales se agregan en Ajustes.</p>
          <table className="tabla">
            <thead>
              <tr>
                <th>Canal</th>
                <th className="text-right">Descuento %</th>
              </tr>
            </thead>
            <tbody>
              {[...v.canales, null, null].map((c, k) => (
                <tr key={c?.id ?? `nuevo-${k}`}>
                  <td>
                    <select name="canalId" className="campo" defaultValue={c?.canalId ?? ''} aria-label={`Canal ${k + 1}`}>
                      <option value="">—</option>
                      {todosLosCanales.map((x) => (
                        <option key={x.id} value={x.id}>
                          {x.nombre}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="text-right">
                    <input name="canalDescuento" className="campo num w-24 ml-auto" inputMode="decimal" defaultValue={fmt(c?.descuentoPct)} placeholder={k === 0 ? '30' : '15'} aria-label={`Descuento del canal ${k + 1}`} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </FormAccion>

      <section className="panel scroll-x">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-[var(--borde)]">
          <div>
            <h2 className="font-semibold text-sm">Precios calculados · {filas.length} de {l.items.length} productos</h2>
            <p className="text-xs text-[var(--texto-tenue)]">Uso interno: costos, márgenes, precio mínimo y descuento máximo no aparecen en el documento para clientes.</p>
          </div>
          {filas.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <Link href={`/imprimir/lista/${v.id}`} className="btn btn-primario">
                Documento para clientes
              </Link>
              {v.canales.map((c) => (
                <Link key={c.id} href={`/imprimir/lista/${v.id}?canal=${c.id}`} className="btn btn-neutro">
                  {c.canal.nombre}
                </Link>
              ))}
            </div>
          )}
        </div>
        {faltaTc || v.factor == null ? (
          <p className="px-4 py-3 text-sm text-[var(--texto-suave)]">Ingresa el tipo de cambio, el factor de internación y su origen.</p>
        ) : filas.length === 0 ? (
          <p className="px-4 py-3 text-sm text-[var(--texto-suave)]">Ingresa el margen de al menos una familia.</p>
        ) : (
          <>
          <TablaInteractiva
            filtrarPor="seccion"
            etiquetaFiltro="Sección"
            archivo={`Lista de venta ${v.titulo}`}
            columnas={[
              { clave: 'producto', titulo: 'Producto' },
              { clave: 'medida', titulo: 'Medida' },
              { clave: 'vende', titulo: 'Vende por' },
              { clave: 'fob', titulo: `FOB ${l.moneda}`, derecha: true },
              { clave: 'landed', titulo: 'Landed CLP', derecha: true },
              { clave: 'lista', titulo: 'Precio lista', derecha: true, destacada: true },
              ...v.canales.map((c) => ({ clave: `canal-${c.id}`, titulo: `${c.canal.nombre} −${numero(c.descuentoPct, c.descuentoPct % 1 ? 1 : 0)}%`, derecha: true })),
              ...(v.margenMinimoPct != null
                ? [
                    { clave: 'minimo', titulo: 'Precio mínimo', derecha: true },
                    { clave: 'desc', titulo: 'Desc. máx.', derecha: true }
                  ]
                : [])
            ]}
            filas={filas.map((f, k) => {
              const piso = v.margenMinimoPct != null ? pisoDeVenta(f.landedClp, f.precioClp, v.margenMinimoPct) : null
              return {
                id: String(k),
                seccion: f.seccion,
                celdas: {
                  producto: { texto: f.descripcion, valor: f.descripcion },
                  medida: { texto: f.especificacion ?? '—', valor: f.especificacion },
                  vende: { texto: f.unidadVenta, valor: f.unidadVenta },
                  fob: { texto: numero(f.fobVenta, 3), valor: f.fobVenta },
                  landed: { texto: numero(f.landedClp, 0), valor: f.landedClp },
                  lista: { texto: numero(f.precioClp, 0), valor: f.precioClp },
                  ...Object.fromEntries(v.canales.map((c) => [`canal-${c.id}`, { texto: numero(precioCanal(f.precioClp, c.descuentoPct), 0), valor: precioCanal(f.precioClp, c.descuentoPct) }])),
                  ...(piso
                    ? {
                        minimo: { texto: numero(piso.precioMinimo, 0), valor: piso.precioMinimo },
                        desc: { texto: `${numero(piso.descuentoMaxPct, 1)}%`, valor: piso.descuentoMaxPct }
                      }
                    : {})
                }
              }
            })}
          />
          {v.canales.length > 0 && (
            <p className="px-4 py-2 text-xs text-[var(--texto-tenue)]">
              Margen que deja cada canal:{' '}
              {familias
                .filter((f) => f.margenPct != null)
                .map((f) => `${f.familia} ${v.canales.map((c) => `${c.canal.nombre} ${margenConDescuento(f.margenPct!, c.descuentoPct).toLocaleString('es-CL')}%`).join(', ')}`)
                .join(' · ')}
            </p>
          )}
          </>
        )}
      </section>
    </div>
  )
}
