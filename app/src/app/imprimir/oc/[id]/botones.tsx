'use client'

import Link from 'next/link'

export default function Botones({ id, compraId, idioma }: { id: string; compraId: string; idioma: 'en' | 'es' }) {
  return (
    <div className="botones" style={{ paddingTop: 16 }}>
      <Link href={`/compras/${compraId}`} className="btn btn-neutro">
        Volver a la compra
      </Link>
      <Link href={`/imprimir/oc/${id}${idioma === 'en' ? '?idioma=es' : ''}`} className="btn btn-neutro">
        {idioma === 'en' ? 'Ver en español' : 'Ver en inglés'}
      </Link>
      <button type="button" className="btn btn-primario" onClick={() => window.print()}>
        Imprimir o guardar PDF
      </button>
    </div>
  )
}
