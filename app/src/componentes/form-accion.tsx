'use client'

import type { ReactNode } from 'react'

import { ErrorForm } from './ui'
import { useFormulario, BotonEnviar } from './formulario'

interface Estado {
  error?: string
  ok?: string
}

/**
 * Un formulario que envía a una Server Action y muestra su error o su
 * confirmación. Los campos llegan como hijos, escritos en la página.
 */
export default function FormAccion({
  accion,
  children,
  etiqueta = 'Guardar',
  clase = 'space-y-3',
  limpiar = false
}: {
  accion: (estado: Estado, datos: FormData) => Promise<Estado>
  children: ReactNode
  etiqueta?: string
  clase?: string
  limpiar?: boolean
}) {
  const { estado, pendiente, form } = useFormulario<Estado>(accion, { limpiarSiOk: limpiar })
  return (
    <form {...form} className={clase}>
      {children}
      <ErrorForm mensaje={estado.error} />
      {estado.ok && (
        <p role="status" className="text-sm text-[var(--ok)]">
          {estado.ok}
        </p>
      )}
      <BotonEnviar pendiente={pendiente} etiqueta={etiqueta} />
    </form>
  )
}
