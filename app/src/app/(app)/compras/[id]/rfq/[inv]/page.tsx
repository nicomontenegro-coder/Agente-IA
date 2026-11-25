import { notFound } from 'next/navigation'

import { Encabezado, Volver } from '@/componentes/ui'
import Copiar from '@/componentes/copiar'
import { EstadoInv } from '@/componentes/etapas'
import { compraCompleta, empresa } from '@/lib/compras-db'
import { codigo } from '@/lib/codigos'
import { textoRfq } from '@/lib/documentos'
import { fecha } from '@/lib/formato'
import { marcarEnviada } from '@/app/acciones/compras'

export const dynamic = 'force-dynamic'

export default async function PaginaRfq({ params }: { params: Promise<{ id: string; inv: string }> }) {
  const { id, inv } = await params
  const [c, e] = await Promise.all([compraCompleta(id), empresa()])
  const i = c?.invitaciones.find((x) => x.id === inv)
  if (!c || !i) notFound()

  const datos = {
    codigo: codigo('compra', c.numero),
    tema: c.titulo,
    incoterm: c.incoterm,
    lugar: c.lugar,
    destino: c.destino,
    plazoRespuesta: c.plazoRespuesta,
    lineas: c.lineas.map((l) => ({ descripcion: l.descripcion, especificacion: l.especificacion, cantidad: l.cantidad, unidad: l.unidad })),
    contacto: i.proveedor.contacto,
    firmante: e.contacto ?? 'Nico Montenegro',
    empresa: e.nombre
  }
  const en = textoRfq(datos, 'en')
  const es = textoRfq(datos, 'es')

  return (
    <div className="space-y-5 max-w-5xl">
      <Volver href={`/compras/${c.id}`}>{codigo('compra', c.numero)}</Volver>
      <Encabezado
        titulo={`RFQ para ${i.proveedor.nombre}`}
        codigo={<EstadoInv estado={i.estado} />}
        descripcion={`Se envía por ${i.proveedor.canal.toLowerCase()}${i.proveedor.email ? ` · ${i.proveedor.email}` : ''}${i.proveedor.telefono ? ` · ${i.proveedor.telefono}` : ''}`}
      />
      <section className="panel p-4 flex items-center justify-between gap-3 flex-wrap bg-[var(--acento-suave)]">
        <p className="text-sm">
          {i.enviadaEl ? (
            <>Enviada el {fecha(i.enviadaEl)}. Cuando responda, registra su cotización en la compra.</>
          ) : (
            <>Copia el texto, envíalo al proveedor y márcalo como enviado para hacer el seguimiento.</>
          )}
        </p>
        {!i.enviadaEl && (
          <form action={marcarEnviada.bind(null, c.id, i.id)}>
            <button className="btn btn-primario">Ya la envié</button>
          </form>
        )}
      </section>
      <div className="grid gap-5 lg:grid-cols-2 items-start">
        {[
          { titulo: 'Para el proveedor (inglés)', t: en },
          { titulo: 'Para revisar (español)', t: es }
        ].map(({ titulo, t }) => (
          <section key={titulo} className="panel">
            <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-[var(--borde)] flex-wrap">
              <h2 className="font-semibold text-sm">{titulo}</h2>
              <div className="flex gap-2">
                <Copiar texto={t.asunto} etiqueta="Copiar asunto" />
                <Copiar texto={t.cuerpo} etiqueta="Copiar texto" />
              </div>
            </div>
            <p className="px-4 pt-3 text-sm font-medium">{t.asunto}</p>
            <pre className="px-4 pb-4 pt-2 text-sm whitespace-pre-wrap font-sans leading-relaxed">{t.cuerpo}</pre>
          </section>
        ))}
      </div>
    </div>
  )
}
