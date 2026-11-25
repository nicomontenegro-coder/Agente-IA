'use client'

import { useState } from 'react'

import FormAccion from '@/componentes/form-accion'
import { crearCompra } from '@/app/acciones/compras'
import { INCOTERM_LABEL } from '@/lib/incoterms'

interface ProductoOpcion {
  id: string
  nombre: string
  especificacion: string | null
  unidad: string
}

interface Fila {
  clave: number
  productoId: string
  descripcion: string
  especificacion: string
  cantidad: string
  unidad: string
}

const vacia = (clave: number): Fila => ({ clave, productoId: '', descripcion: '', especificacion: '', cantidad: '', unidad: 'u' })

export default function FormCompra({ productos }: { productos: ProductoOpcion[] }) {
  const [filas, setFilas] = useState<Fila[]>([vacia(1)])
  const cambiar = (clave: number, cambio: Partial<Fila>) => setFilas((fs) => fs.map((f) => (f.clave === clave ? { ...f, ...cambio } : f)))
  // Elegir un producto del catálogo completa la línea; se puede corregir después.
  const elegir = (clave: number, id: string) => {
    const p = productos.find((x) => x.id === id)
    cambiar(clave, p ? { productoId: id, descripcion: p.nombre, especificacion: p.especificacion ?? '', unidad: p.unidad } : { productoId: '' })
  }

  return (
    <FormAccion accion={crearCompra} etiqueta="Crear compra" clase="space-y-5">
      <section className="panel p-5 space-y-3">
        <label className="text-sm space-y-1 block">
          <span className="font-medium">De qué se trata</span>
          <input name="titulo" className="campo" required placeholder="Pre-insulated PPR pipe for Magallanes" />
          <span className="block text-xs text-[var(--texto-tenue)]">Se usa como asunto de la RFQ (recomendado en inglés).</span>
        </label>
        <div className="grid gap-3 sm:grid-cols-4">
          <label className="text-sm space-y-1">
            <span className="font-medium">Incoterm que pides</span>
            <select name="incoterm" className="campo" defaultValue="FOB">
              {Object.entries(INCOTERM_LABEL).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm space-y-1">
            <span className="font-medium">Lugar</span>
            <input name="lugar" className="campo" placeholder="Ningbo" />
          </label>
          <label className="text-sm space-y-1">
            <span className="font-medium">Destino final</span>
            <input name="destino" className="campo" placeholder="Punta Arenas, Chile" />
          </label>
          <label className="text-sm space-y-1">
            <span className="font-medium">Responder antes del</span>
            <input name="plazoRespuesta" type="date" className="campo" />
          </label>
        </div>
      </section>

      <section className="panel p-5 space-y-3">
        <div>
          <h2 className="font-semibold text-sm">Productos</h2>
          <p className="text-xs text-[var(--texto-tenue)] mt-0.5">
            Si el producto no está en el catálogo, deja el primer campo como está y escribe la descripción al lado.
          </p>
        </div>
        {filas.map((f, i) => (
          <div key={f.clave} className="grid gap-2 sm:grid-cols-[1.2fr_1.4fr_1.4fr_0.7fr_0.6fr_auto] items-end border-b border-[var(--borde)] pb-3">
            <label className="text-sm space-y-1">
              <span className="font-medium">Del catálogo (opcional)</span>
              <select name="productoId" className="campo" value={f.productoId} onChange={(e) => elegir(f.clave, e.target.value)}>
                <option value="">— no está en el catálogo —</option>
                {productos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm space-y-1">
              <span className="font-medium">Descripción {i + 1}</span>
              <input name="descripcion" className="campo" value={f.descripcion} onChange={(e) => cambiar(f.clave, { descripcion: e.target.value })} />
            </label>
            <label className="text-sm space-y-1">
              <span className="font-medium">Especificación</span>
              <input name="especificacion" className="campo" value={f.especificacion} onChange={(e) => cambiar(f.clave, { especificacion: e.target.value })} placeholder="PPR 20×3.4, ISO 15874" />
            </label>
            <label className="text-sm space-y-1">
              <span className="font-medium">Cantidad</span>
              <input name="cantidad" className="campo num" inputMode="decimal" value={f.cantidad} onChange={(e) => cambiar(f.clave, { cantidad: e.target.value })} />
            </label>
            <label className="text-sm space-y-1">
              <span className="font-medium">Unidad</span>
              <input name="unidad" className="campo" value={f.unidad} onChange={(e) => cambiar(f.clave, { unidad: e.target.value })} />
            </label>
            <button
              type="button"
              className="btn btn-neutro"
              onClick={() => setFilas((fs) => (fs.length > 1 ? fs.filter((x) => x.clave !== f.clave) : fs))}
              aria-label={`Quitar la línea ${i + 1}`}
            >
              Quitar
            </button>
          </div>
        ))}
        <button type="button" className="btn btn-neutro" onClick={() => setFilas((fs) => [...fs, vacia(Math.max(...fs.map((x) => x.clave)) + 1)])}>
          Agregar producto
        </button>
      </section>
    </FormAccion>
  )
}
