/**
 * Invitaciones (la RFQ a cada proveedor) y evaluación de proveedores según
 * las reglas de GESI (diseno/p2p.md, "Reglas de negocio"):
 *
 * - Sin certificados pertinentes a lo que ofrece → eliminado.
 * - Primeros embarques con carta de crédito: si no la acepta → eliminado.
 * - Cada tipo de certificado (calidad, cumplimiento, gestión) suma puntaje.
 *
 * Funciones puras.
 */

// ───────────────────────── Invitaciones ─────────────────────────

export type EstadoInvitacion = 'POR_ENVIAR' | 'ENVIADA' | 'RESPONDIDA' | 'SIN_RESPUESTA' | 'DECLINO'

export const ETIQUETA_INVITACION: Record<EstadoInvitacion, string> = {
  POR_ENVIAR: 'Por enviar',
  ENVIADA: 'Enviada',
  RESPONDIDA: 'Respondida',
  SIN_RESPUESTA: 'Sin respuesta',
  DECLINO: 'Declinó'
}

const soloDia = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()

/**
 * Respondida y Sin respuesta no se marcan: se despejan de que haya
 * cotización y de la fecha límite. Una cotización que llega tarde gana sobre
 * el plazo vencido: lo que importa es que respondió.
 */
export function estadoInvitacion(
  inv: { enviadaEl: Date | null; declino: boolean; tieneCotizacion: boolean },
  plazo: Date | null,
  hoy = new Date()
): EstadoInvitacion {
  if (inv.tieneCotizacion) return 'RESPONDIDA'
  if (inv.declino) return 'DECLINO'
  if (!inv.enviadaEl) return 'POR_ENVIAR'
  if (plazo && soloDia(hoy) > soloDia(plazo)) return 'SIN_RESPUESTA'
  return 'ENVIADA'
}

// ───────────────────────── Certificados ─────────────────────────

export const TIPOS_CERTIFICADO = [
  { valor: 'CALIDAD', etiqueta: 'Calidad', ayuda: 'Sistema de calidad, por ejemplo ISO 9001' },
  { valor: 'CUMPLIMIENTO', etiqueta: 'Cumplimiento', ayuda: 'El producto cumple una norma, por ejemplo ISO 15874 o CE' },
  { valor: 'GESTION', etiqueta: 'Gestión', ayuda: 'Gestión ambiental o de seguridad, por ejemplo ISO 14001 o 45001' }
] as const

export type TipoCertificado = (typeof TIPOS_CERTIFICADO)[number]['valor']

export interface Certificado {
  tipo: string
  vigenteHasta: Date | null
}

const vigente = (c: Certificado, hoy: Date) => !c.vigenteHasta || soloDia(c.vigenteHasta) >= soloDia(hoy)

/** Un punto por cada tipo distinto con al menos un certificado vigente: 0 a 3. */
export function puntajeCertificados(certs: Certificado[], hoy = new Date()): number {
  return new Set(certs.filter((c) => vigente(c, hoy)).map((c) => c.tipo)).size
}

// ───────────────────────── Filtros eliminatorios ─────────────────────────

export interface Evaluacion {
  eliminado: boolean
  /** Por qué queda eliminado. */
  motivos: string[]
  /** Lo que falta saber para decidir: no elimina, pero hay que averiguarlo. */
  pendientes: string[]
  puntaje: number
}

/**
 * `aceptaCartaCredito`: lo que dijo el proveedor (null = no lo ha dicho).
 * `primerEmbarque`: si con este proveedor todavía no hay embarques, la carta
 * de crédito es obligatoria.
 */
export function evaluarProveedor(
  p: { certificados: Certificado[]; aceptaCartaCredito: boolean | null },
  primerEmbarque: boolean,
  hoy = new Date()
): Evaluacion {
  const motivos: string[] = []
  const pendientes: string[] = []
  const vigentes = p.certificados.filter((c) => vigente(c, hoy))
  if (p.certificados.length === 0) pendientes.push('Falta que envíe sus certificados')
  else if (vigentes.length === 0) motivos.push('Sus certificados están vencidos')
  if (primerEmbarque) {
    if (p.aceptaCartaCredito === false) motivos.push('No acepta carta de crédito en el primer embarque')
    if (p.aceptaCartaCredito == null) pendientes.push('Falta confirmar si acepta carta de crédito')
  }
  return { eliminado: motivos.length > 0, motivos, pendientes, puntaje: puntajeCertificados(p.certificados, hoy) }
}

// ───────────────────────── Comparar cotizaciones ─────────────────────────

export interface LineaCotizada {
  compraLineaId: string
  cantidad: number
  precioUnitario: number | null
}

/** Total de una cotización. Null si a alguna línea pedida le falta precio. */
export function totalCotizacion(lineas: LineaCotizada[]): number | null {
  if (lineas.some((l) => l.precioUnitario == null)) return null
  return lineas.reduce((a, l) => a + l.cantidad * (l.precioUnitario ?? 0), 0)
}

/**
 * Dos precios solo se comparan si tienen la misma moneda, el mismo incoterm y
 * el mismo lugar. Si no, se avisa: compararlos sería comparar peras con
 * manzanas (Lección 1). La comparación justa es por landed cost.
 */
export function avisoComparacion(cotizaciones: { moneda: string; incoterm: string; lugar: string | null }[]): string | null {
  const claves = new Set(cotizaciones.map((c) => `${c.moneda}|${c.incoterm}|${(c.lugar ?? '').trim().toLowerCase()}`))
  if (claves.size <= 1) return null
  return 'Las cotizaciones vienen en distinta moneda, incoterm o lugar: los totales no se comparan directo. Compáralas por landed cost.'
}
