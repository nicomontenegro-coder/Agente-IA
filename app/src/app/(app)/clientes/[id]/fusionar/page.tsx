import { notFound } from 'next/navigation'

import { Encabezado, Volver } from '@/componentes/ui'
import FormAccion from '@/componentes/form-accion'
import { db } from '@/lib/db'
import { combinarClientes, CAMPOS_FUSION, type DatosCliente } from '@/lib/duplicados-clientes'
import { ETIQUETA_ETAPA, type EtapaCliente } from '@/lib/embudo'
import { fusionarClientes } from '@/app/acciones/clientes'

export const dynamic = 'force-dynamic'

const NOMBRE_CAMPO: Record<string, string> = {
  nombre: 'Nombre', rut: 'RUT', canalId: 'Canal', ciudad: 'Ciudad', direccion: 'Dirección', contacto: 'Contacto',
  telefono: 'Teléfono', email: 'Correo', notas: 'Notas', etapa: 'Etapa', proximaAccion: 'Próxima acción'
}
const datosDe = (c: Record<string, unknown>): DatosCliente => Object.fromEntries(CAMPOS_FUSION.map((k) => [k, (c[k] as string | null) ?? null])) as DatosCliente

/** Fusionar otro cliente en esta ficha: esta queda, la otra se borra. */
export default async function PaginaFusionar({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ con?: string }> }) {
  const { id } = await params
  const { con } = await searchParams
  const [destino, todos, canales] = await Promise.all([
    db.cliente.findUnique({ where: { id }, include: { _count: { select: { gestiones: true } } } }),
    db.cliente.findMany({ where: { id: { not: id } }, orderBy: { nombre: 'asc' }, select: { id: true, nombre: true, rut: true } }),
    db.canalVenta.findMany()
  ])
  if (!destino) notFound()
  const origen = con ? await db.cliente.findUnique({ where: { id: con }, include: { _count: { select: { gestiones: true } } } }) : null
  const mostrar = (k: string, v: string | null) => {
    if (v == null || v === '') return '—'
    if (k === 'canalId') return canales.find((c) => c.id === v)?.nombre ?? v
    if (k === 'etapa') return ETIQUETA_ETAPA[v as EtapaCliente] ?? v
    return v
  }
  const comb = origen ? combinarClientes(datosDe(destino), datosDe(origen)) : null

  return (
    <div className="space-y-5 max-w-4xl">
      <Volver href={`/clientes/${destino.id}`}>{destino.nombre}</Volver>
      <Encabezado titulo="Fusionar clientes" descripcion={`La ficha «${destino.nombre}» queda; la otra se borra y sus datos y gestiones pasan a esta.`} />
      <form className="panel p-4 flex flex-wrap items-end gap-3">
        <label className="text-sm space-y-1 grow">
          <span className="font-medium">Cliente que se fusiona en esta ficha</span>
          <select name="con" className="campo" defaultValue={con ?? ''}>
            <option value="">Seleccionar…</option>
            {todos.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
                {c.rut ? ` · ${c.rut}` : ''}
              </option>
            ))}
          </select>
        </label>
        <button className="btn btn-neutro">Comparar</button>
      </form>
      {origen && comb && (
        <FormAccion accion={fusionarClientes.bind(null, destino.id, origen.id)} etiqueta={`Fusionar «${origen.nombre}» en esta ficha`} clase="space-y-3">
          <section className="panel scroll-x">
            <table className="tabla">
              <thead>
                <tr>
                  <th>Dato</th>
                  <th>Esta ficha (queda)</th>
                  <th>La otra (se borra)</th>
                  <th>Resultado</th>
                </tr>
              </thead>
              <tbody>
                {CAMPOS_FUSION.map((k) => {
                  const d = datosDe(destino)[k]
                  const o = datosDe(origen)[k]
                  const conflicto = comb.conflictos.includes(k)
                  return (
                    <tr key={k}>
                      <td className="font-medium">{NOMBRE_CAMPO[k]}</td>
                      <td>
                        {conflicto ? (
                          <label className="flex items-center gap-2">
                            <input type="radio" name={`elegir-${k}`} value="destino" defaultChecked /> {mostrar(k, d)}
                          </label>
                        ) : (
                          mostrar(k, d)
                        )}
                      </td>
                      <td>
                        {conflicto ? (
                          <label className="flex items-center gap-2">
                            <input type="radio" name={`elegir-${k}`} value="origen" /> {mostrar(k, o)}
                          </label>
                        ) : (
                          mostrar(k, o)
                        )}
                      </td>
                      <td className={conflicto ? 'text-[var(--alerta)]' : ''}>{conflicto ? 'elige uno' : <span className="whitespace-pre-line">{mostrar(k, comb.resultado[k])}</span>}</td>
                    </tr>
                  )
                })}
                <tr>
                  <td className="font-medium">Gestiones</td>
                  <td>{destino._count.gestiones}</td>
                  <td>{origen._count.gestiones}</td>
                  <td>{destino._count.gestiones + origen._count.gestiones + 1} (se suma la nota de la fusión)</td>
                </tr>
              </tbody>
            </table>
          </section>
        </FormAccion>
      )}
    </div>
  )
}
