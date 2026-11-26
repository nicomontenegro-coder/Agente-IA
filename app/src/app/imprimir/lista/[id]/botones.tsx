'use client'

import Link from 'next/link'

export default function Botones({ id, canales, actual }: { id: string; canales: { id: string; nombre: string }[]; actual: string | null }) {
  return (
    <div className="botones" style={{ paddingTop: 16, flexWrap: 'wrap' }}>
      <Link href={`/precios/venta/${id}`} className="btn btn-neutro">
        Volver a la lista
      </Link>
      {canales.length > 0 && (
        <>
          <Link href={`/imprimir/lista/${id}`} className={`btn ${actual ? 'btn-neutro' : 'btn-primario'}`}>
            Precio lista
          </Link>
          {canales.map((c) => (
            <Link key={c.id} href={`/imprimir/lista/${id}?canal=${c.id}`} className={`btn ${actual === c.id ? 'btn-primario' : 'btn-neutro'}`}>
              {c.nombre}
            </Link>
          ))}
        </>
      )}
      <button type="button" className="btn btn-primario" onClick={() => window.print()}>
        Imprimir o guardar PDF
      </button>
    </div>
  )
}
