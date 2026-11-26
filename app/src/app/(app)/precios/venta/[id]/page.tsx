import Link from 'next/link'
import { notFound } from 'next/navigation'

import { Encabezado, Volver } from '@/componentes/ui'
import FormAccion from '@/componentes/form-accion'
import { db } from '@/lib/db'
import { fecha, numero } from '@/lib/formato'
import { filasDeVenta, vigencia, familiasDe } from '@/lib/lista-venta'
import { guardarListaVenta } from '@/app/acciones/precios'

export const dynamic = 'force-dynamic'

const fmt = (x: number | null | undefined) => (x == null ? '' : String(x).replace('.', ','))

/** La lista de venta por dentro: parámetros, costos y márgenes. El cliente ve solo el documento impreso. */
export default async function PaginaListaVenta({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const v = await db.listaVenta.findUnique({
    where: { id },
    include: { familias: true, listaPrecios: { include: { proveedor: true, items: { orderBy: { posicion: 'asc' } } } } }
  })
  if (!v) notFound()
  const l = v.listaPrecios
  // En el orden del documento del proveedor: la base no garantiza ninguno, y
  // con las filas cambiadas de lugar el factor de los tubos cae en los codos.
  const orden = familiasDe(l.items).map((f) => f.familia)
  const familias = [...v.familias].sort((a, b) => orden.indexOf(a.familia) - orden.indexOf(b.familia))
  const filas = filasDeVenta(l.items, familias, v.tipoCambio)
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
          <h2 className="font-semibold text-sm px-4 pt-3 pb-1">Factor y margen por familia</h2>
          <p className="px-4 pb-2 text-xs text-[var(--texto-tenue)]">
            Factor de internación = costo puesto en bodega ÷ FOB, de un costeo real. Margen sobre el precio de venta (35 da 35%). Una familia sin factor o sin margen no se ofrece.
          </p>
          <table className="tabla">
            <thead>
              <tr>
                <th>Familia</th>
                <th className="text-right">Factor</th>
                <th>De dónde sale el factor</th>
                <th className="text-right">Margen %</th>
              </tr>
            </thead>
            <tbody>
              {familias.map((f) => (
                <tr key={f.id}>
                  <td>
                    {f.familia}
                    <input type="hidden" name="familia" value={f.familia} />
                    {!conPrecio.has(f.familia) && <div className="text-xs text-[var(--texto-tenue)]">no se ofrece</div>}
                  </td>
                  <td className="text-right">
                    <input name="factor" className="campo num w-24 ml-auto" inputMode="decimal" defaultValue={fmt(f.factor)} placeholder="1,45" aria-label={`Factor de ${f.familia}`} />
                  </td>
                  <td>
                    <input name="factorOrigen" className="campo min-w-48" defaultValue={f.factorOrigen ?? ''} placeholder="Costeo embarque octubre (Excel)" aria-label={`Origen del factor de ${f.familia}`} />
                  </td>
                  <td className="text-right">
                    <input name="margen" className="campo num w-20 ml-auto" inputMode="decimal" defaultValue={fmt(f.margenPct)} placeholder="35" aria-label={`Margen de ${f.familia}`} />
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
            <p className="text-xs text-[var(--texto-tenue)]">Uso interno: costos y márgenes no aparecen en el documento para clientes.</p>
          </div>
          {filas.length > 0 && (
            <Link href={`/imprimir/lista/${v.id}`} className="btn btn-primario">
              Documento para clientes
            </Link>
          )}
        </div>
        {faltaTc ? (
          <p className="px-4 py-3 text-sm text-[var(--texto-suave)]">Ingresa el tipo de cambio y, por familia, el factor y el margen.</p>
        ) : filas.length === 0 ? (
          <p className="px-4 py-3 text-sm text-[var(--texto-suave)]">Ingresa el factor, su origen y el margen de al menos una familia.</p>
        ) : (
          <table className="tabla">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Medida</th>
                <th>Unidad</th>
                <th className="text-right">FOB {l.moneda}</th>
                <th className="text-right">Landed {l.moneda}</th>
                <th className="text-right">Landed CLP</th>
                <th className="text-right">Precio venta CLP</th>
              </tr>
            </thead>
            <tbody>
              {filas.map((f, k) => (
                <tr key={k}>
                  <td>
                    {f.descripcion}
                    <div className="text-xs text-[var(--texto-tenue)]">{f.familia}</div>
                  </td>
                  <td className="num">{f.especificacion ?? '—'}</td>
                  <td>{f.unidad}</td>
                  <td className="text-right num">{numero(f.precio!, 3)}</td>
                  <td className="text-right num">{numero(f.landedUsd, 3)}</td>
                  <td className="text-right num">{numero(f.landedClp, 0)}</td>
                  <td className="text-right num font-semibold">{numero(f.precioClp, 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  )
}
