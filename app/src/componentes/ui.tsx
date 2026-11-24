import Link from 'next/link'
import type { ReactNode } from 'react'

/** Encabezado de página con acción opcional a la derecha. */
export function Encabezado({
  titulo,
  descripcion,
  accion,
  codigo
}: {
  titulo: string
  descripcion?: string
  accion?: ReactNode
  /** Código de referencia (GESI-P7), junto al título. */
  codigo?: ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-4 flex-wrap">
      <div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <h1 className="text-xl font-bold tracking-tight">{titulo}</h1>
          {codigo}
        </div>
        {descripcion && (
          <p className="text-sm text-[var(--texto-suave)] mt-0.5">{descripcion}</p>
        )}
      </div>
      {accion}
    </div>
  )
}

/** Estado vacío con una salida clara, en vez de una tabla en blanco. */
export function Vacio({
  titulo,
  detalle,
  accion
}: {
  titulo: string
  detalle?: string
  accion?: ReactNode
}) {
  return (
    <div className="panel px-6 py-12 text-center">
      <p className="font-medium">{titulo}</p>
      {detalle && (
        <p className="text-sm text-[var(--texto-suave)] mt-1.5 max-w-md mx-auto">
          {detalle}
        </p>
      )}
      {accion && <div className="mt-4 flex justify-center">{accion}</div>}
    </div>
  )
}

const COLORES_CHIP = {
  neutro: 'bg-[var(--panel-alt)] text-[var(--texto-suave)]',
  ok: 'bg-[var(--ok-suave)] text-[var(--ok)]',
  alerta: 'bg-[var(--alerta-suave)] text-[var(--alerta)]',
  malo: 'bg-[var(--malo-suave)] text-[var(--malo)]',
  acento: 'bg-[var(--acento-suave)] text-[var(--acento)]'
} as const

export function Chip({
  children,
  tono = 'neutro'
}: {
  children: ReactNode
  tono?: keyof typeof COLORES_CHIP
}) {
  return <span className={`chip ${COLORES_CHIP[tono]}`}>{children}</span>
}

const TONO_VEREDICTO = {
  APROBADO: 'ok',
  RECHAZADO: 'malo',
  EN_PRUEBA: 'alerta',
  PENDIENTE: 'neutro'
} as const

const TEXTO_VEREDICTO = {
  APROBADO: 'Aprobado',
  RECHAZADO: 'Rechazado',
  EN_PRUEBA: 'En prueba',
  PENDIENTE: 'Pendiente'
} as const

export function Veredicto({ valor }: { valor: string }) {
  const k = (valor in TONO_VEREDICTO ? valor : 'PENDIENTE') as keyof typeof TONO_VEREDICTO
  return <Chip tono={TONO_VEREDICTO[k]}>{TEXTO_VEREDICTO[k]}</Chip>
}

/** Calificación de 1 a 5 en estrellas. */
export function Estrellas({ valor }: { valor: number | null }) {
  if (valor == null) return <span className="text-[var(--texto-tenue)]">—</span>
  return (
    <span
      className="text-[var(--alerta)] tracking-tight"
      title={`${valor} de 5`}
      aria-label={`${valor} de 5`}
    >
      {'★'.repeat(valor)}
      <span className="text-[var(--texto-tenue)]">{'★'.repeat(5 - valor)}</span>
    </span>
  )
}

export function Volver({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="text-sm text-[var(--texto-suave)] hover:text-[var(--acento)] inline-flex items-center gap-1"
    >
      ← {children}
    </Link>
  )
}

/** Fila etiqueta/valor para fichas de detalle. */
export function Dato({ etiqueta, children }: { etiqueta: string; children: ReactNode }) {
  return (
    <div className="py-2 border-b border-[var(--borde)] last:border-0">
      <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--texto-tenue)]">
        {etiqueta}
      </dt>
      <dd className="text-sm mt-0.5">{children || '—'}</dd>
    </div>
  )
}

/** Mensaje de error de un formulario de servidor. */
export function ErrorForm({ mensaje }: { mensaje?: string }) {
  if (!mensaje) return null
  return (
    <p
      role="alert"
      className="text-sm text-[var(--malo)] bg-[var(--malo-suave)] rounded-lg px-3 py-2"
    >
      {mensaje}
    </p>
  )
}
