'use client'

import { useMemo, useState } from 'react'

import FormAccion from '@/componentes/form-accion'
import { leerTabla, prepararClientes, type ClienteExistente, type Canal } from '@/lib/importar-clientes'
import { importarClientes } from '@/app/acciones/clientes'

const ESTADO: Record<string, string> = { nuevo: 'Nuevo', actualiza: 'Ya existe: se completa', repetido: 'Repetido: se omite', 'sin nombre': 'Sin nombre: se omite' }

/** Pegar la tabla y ver al tiro qué se va a importar. El servidor lo vuelve a validar al guardar. */
export default function Importador({ existentes, canales }: { existentes: ClienteExistente[]; canales: Canal[] }) {
  const [tabla, setTabla] = useState('')
  const vista = useMemo(() => prepararClientes(leerTabla(tabla), existentes, canales), [tabla, existentes, canales])
  const importables = vista.filter((v) => v.estado === 'nuevo' || v.estado === 'actualiza').length
  return (
    <FormAccion accion={importarClientes} etiqueta={importables ? `Importar ${importables} ${importables === 1 ? 'cliente' : 'clientes'}` : 'Importar'} clase="space-y-4">
      <label className="text-sm space-y-1 block">
        <span className="font-medium">Tabla de clientes</span>
        <textarea
          name="tabla"
          rows={8}
          className="campo font-mono text-xs"
          value={tabla}
          onChange={(e) => setTabla(e.target.value)}
          placeholder={'| Nombre | RUT | Tipo | Ciudad | Dirección | Contacto | Teléfono | Email | Notas |\n|---|---|---|---|---|---|---|---|---|\n| Ferretería … | 76.123.456-0 | Ferretería | Punta Arenas | … |'}
        />
        <span className="block text-xs text-[var(--texto-tenue)]">Con barras (como la entrega Gemini), tabulaciones (copiada de una planilla), punto y coma o comas. Las columnas se leen por su nombre.</span>
      </label>
      {vista.length > 0 && (
        <div className="panel scroll-x">
          <table className="tabla">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>RUT</th>
                <th>Canal</th>
                <th>Ciudad</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {vista.map((v, k) => (
                <tr key={k}>
                  <td>
                    {v.datos.nombre ?? '—'}
                    {v.avisos.map((a) => (
                      <div key={a} className="text-xs text-[var(--alerta)]">
                        {a}
                      </div>
                    ))}
                  </td>
                  <td className="num">{v.datos.rut ?? '—'}</td>
                  <td>{v.canal ?? '—'}</td>
                  <td>{v.datos.ciudad ?? '—'}</td>
                  <td className={v.estado === 'nuevo' || v.estado === 'actualiza' ? '' : 'text-[var(--texto-tenue)]'}>{ESTADO[v.estado]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </FormAccion>
  )
}
