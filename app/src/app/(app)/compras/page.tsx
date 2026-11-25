import Link from 'next/link'

import { Encabezado, Vacio } from '@/componentes/ui'
import { EtapaCompra } from '@/componentes/etapas'
import { comprasConEtapa } from '@/lib/compras-db'
import { codigo } from '@/lib/codigos'
import { SIGUE_ETAPA } from '@/lib/compra'
import { fecha } from '@/lib/formato'

export const dynamic = 'force-dynamic'

export default async function PaginaCompras() {
  const compras = await comprasConEtapa()
  return (
    <div className="space-y-5">
      <Encabezado
        titulo="Compras"
        descripcion="Procesos de compra, desde la necesidad hasta el cierre."
        accion={
          <Link href="/compras/nueva" className="btn btn-primario">
            Nueva compra
          </Link>
        }
      />
      {compras.length === 0 ? (
        <Vacio titulo="Todavía no hay compras" detalle="Crea una con los productos que necesitas: desde ahí invitas proveedores y envías las RFQ." />
      ) : (
        <div className="panel scroll-x">
          <table className="tabla">
            <thead>
              <tr>
                <th>Código</th>
                <th>Compra</th>
                <th>Etapa</th>
                <th>Qué sigue</th>
                <th className="text-right">Respondieron</th>
                <th>Último cambio</th>
              </tr>
            </thead>
            <tbody>
              {compras.map((c) => (
                <tr key={c.id}>
                  <td className="num">
                    <Link href={`/compras/${c.id}`} className="font-medium hover:text-[var(--acento)]">
                      {codigo('compra', c.numero)}
                    </Link>
                  </td>
                  <td>
                    <Link href={`/compras/${c.id}`} className="hover:text-[var(--acento)]">
                      {c.titulo}
                    </Link>
                    <div className="text-xs text-[var(--texto-tenue)]">{c.lineas} productos</div>
                  </td>
                  <td>
                    <EtapaCompra etapa={c.etapa} />
                  </td>
                  <td className="text-sm">{SIGUE_ETAPA[c.etapa]}</td>
                  <td className="text-right num">
                    {c.respondidas} de {c.invitadas}
                  </td>
                  <td className="text-sm">{fecha(c.actualizadoEn)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
