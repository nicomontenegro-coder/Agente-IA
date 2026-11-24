'use client'

import { useState } from 'react'

/** Copia un texto con un clic: la RFQ se pega en WhatsApp, Alibaba o un correo. */
export default function Copiar({ texto, etiqueta = 'Copiar' }: { texto: string; etiqueta?: string }) {
  const [listo, setListo] = useState(false)
  return (
    <button
      type="button"
      className="btn btn-neutro !py-1 !text-xs"
      onClick={async () => {
        await navigator.clipboard.writeText(texto)
        setListo(true)
        setTimeout(() => setListo(false), 2000)
      }}
    >
      {listo ? 'Copiado' : etiqueta}
    </button>
  )
}
