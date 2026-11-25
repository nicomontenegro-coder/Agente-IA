import Link from 'next/link'

import { Encabezado, Vacio } from '@/componentes/ui'
import { db } from '@/lib/db'
import { puntajeCertificados } from '@/lib/proveedores'

export const dynamic = 'force-dynamic'

export default async function PaginaProveedores() {
  const proveedores = await db.proveedor.findMany({ orderBy: { nombre: 'asc' }, include: { familias: { include: { familia: true } }, certificados: true, _count: { select: { invitaciones: true } } } })
  return (
    <div className="space-y-5">
      <Encabezado
        titulo="Proveedores"
        descripcion="Proveedores, sus productos, certificados y condiciones de pago."
        accion={
          <Link href="/proveedores/nuevo" className="btn btn-primario">
            Nuevo proveedor
          </Link>
        }
      />
      {proveedores.length === 0 ? (
        <Vacio titulo="Todavía no hay proveedores" />
      ) : (
        <div className="panel scroll-x">
          <table className="tabla">
            <thead>
              <tr>
                <th>Proveedor</th>
                <th>Familias</th>
                <th>Certificados</th>
                <th>Carta de crédito</th>
                <th className="text-right">Invitaciones</th>
              </tr>
            </thead>
            <tbody>
              {proveedores.map((p) => (
                <tr key={p.id}>
                  <td>
                    <Link href={`/proveedores/${p.id}`} className="font-medium hover:text-[var(--acento)]">
                      {p.nombre}
                    </Link>
                    <div className="text-xs text-[var(--texto-tenue)]">{p.pais ?? ''}</div>
                  </td>
                  <td className="text-sm">{p.familias.map((f) => f.familia.nombre).join(', ') || '—'}</td>
                  <td className="text-sm num">{puntajeCertificados(p.certificados)} de 3 tipos</td>
                  <td className="text-sm">{p.aceptaCartaCredito == null ? 'Sin confirmar' : p.aceptaCartaCredito ? 'Acepta' : 'No acepta'}</td>
                  <td className="text-right num">{p._count.invitaciones}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
