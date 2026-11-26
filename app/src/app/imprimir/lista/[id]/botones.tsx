'use client'

import Link from 'next/link'

export default function Botones({ id }: { id: string }) {
  return (
    <div className="botones" style={{ paddingTop: 16 }}>
      <Link href={`/precios/venta/${id}`} className="btn btn-neutro">
        Volver a la lista
      </Link>
      <button type="button" className="btn btn-primario" onClick={() => window.print()}>
        Imprimir o guardar PDF
      </button>
    </div>
  )
}
