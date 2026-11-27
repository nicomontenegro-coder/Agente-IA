import Link from 'next/link'

import { Encabezado } from '@/componentes/ui'
import TablaInteractiva from '@/componentes/tabla-interactiva'
import { db } from '@/lib/db'
import { fecha } from '@/lib/formato'
import { ETIQUETA_ETAPA, esEtapa } from '@/lib/embudo'

export const dynamic = 'force-dynamic'

export default async function PaginaClientes({ searchParams }: { searchParams: Promise<{ importados?: string; actualizados?: string }> }) {
  const { importados, actualizados } = await searchParams
  const clientes = await db.cliente.findMany({ orderBy: { nombre: 'asc' } })
  return (
    <div className="space-y-5">
      <Encabezado titulo="Clientes" descripcion="Clientes y prospectos, su canal de venta y en qué etapa están." />
      <div className="flex flex-wrap gap-2">
        <Link href="/clientes/nuevo" className="btn btn-primario">
          Nuevo cliente
        </Link>
        <Link href="/clientes/importar" className="btn btn-neutro">
          Importar desde una tabla
        </Link>
      </div>
      {importados != null && (
        <p role="status" className="text-sm text-[var(--ok)]">
          Importación lista: {importados} {importados === '1' ? 'cliente nuevo' : 'clientes nuevos'}, {actualizados ?? 0} {actualizados === '1' ? 'actualizado' : 'actualizados'}.
        </p>
      )}
      <section className="panel">
        {clientes.length === 0 ? (
          <p className="p-4 text-sm text-[var(--texto-suave)]">Sin clientes todavía. Impórtalos desde una tabla o agrégalos uno por uno.</p>
        ) : (
          <TablaInteractiva
            filtrarPor="tipo"
            etiquetaFiltro="Tipo"
            columnas={[
              { clave: 'cliente', titulo: 'Cliente' },
              { clave: 'tipo', titulo: 'Tipo' },
              { clave: 'ciudad', titulo: 'Ciudad' },
              { clave: 'etapa', titulo: 'Etapa' },
              { clave: 'proxima', titulo: 'Próxima acción' }
            ]}
            filas={clientes.map((c) => ({
              id: c.id,
              celdas: {
                cliente: { texto: c.nombre, valor: c.nombre, sub: [c.rut, c.contacto].filter(Boolean).join(' · ') || undefined },
                tipo: { texto: c.tipo ?? '—', valor: c.tipo ?? 'Sin tipo' },
                ciudad: { texto: c.ciudad ?? '—', valor: c.ciudad },
                etapa: { texto: esEtapa(c.etapa) ? ETIQUETA_ETAPA[c.etapa] : c.etapa, valor: c.etapa },
                proxima: { texto: c.proximaAccion ?? '—', valor: c.proximaFecha ? c.proximaFecha.toISOString() : null, sub: c.proximaFecha ? fecha(c.proximaFecha) : undefined }
              },
              enlace: `/clientes/${c.id}`
            }))}
          />
        )}
      </section>
    </div>
  )
}
