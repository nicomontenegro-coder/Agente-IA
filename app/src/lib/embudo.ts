/**
 * Embudo de clientes: de quién es un posible cliente a quién ya compró.
 *
 *   Identificado → Contactado → Reunión agendada → Visitado → Cotizado
 *   → Negociación → Ganado
 *   (desde cualquiera) → Perdido, con motivo
 *
 * Sigue la misma regla que la homologación de proveedores: las etapas solo
 * avanzan (se pueden saltar), y volver atrás o reabrir un perdido es una
 * corrección que exige nota. Todo cambio queda en las gestiones del cliente.
 *
 * Cotizado y Ganado no se piden: se despejan de las ofertas. Escribir dos
 * veces que se le cotizó a alguien —en la oferta y en el embudo— es pedir el
 * mismo dato dos veces, y tarde o temprano una de las dos copias miente.
 *
 * Funciones puras: sin base de datos, para poder probarlas. Las usan la
 * pantalla y, más adelante, el agente.
 */

import { codigo } from './codigos'

export const ETAPAS_CLIENTE = [
  'IDENTIFICADO',
  'CONTACTADO',
  'REUNION',
  'VISITADO',
  'COTIZADO',
  'NEGOCIACION',
  'GANADO',
  'PERDIDO'
] as const

export type EtapaCliente = (typeof ETAPAS_CLIENTE)[number]

/** El camino normal, sin Perdido. */
const CAMINO: EtapaCliente[] = ETAPAS_CLIENTE.filter((e) => e !== 'PERDIDO')

export const ETIQUETA_ETAPA: Record<EtapaCliente, string> = {
  IDENTIFICADO: 'Identificado',
  CONTACTADO: 'Contactado',
  REUNION: 'Reunión agendada',
  VISITADO: 'Visitado',
  COTIZADO: 'Cotizado',
  NEGOCIACION: 'Negociación',
  GANADO: 'Ganado',
  PERDIDO: 'Perdido'
}

/** Una línea por etapa, para explicarla donde se elige. */
export const AYUDA_ETAPA: Record<EtapaCliente, string> = {
  IDENTIFICADO: 'Sabes que existe y que podría comprar',
  CONTACTADO: 'Ya hablaron: sabe quién eres y qué ofreces',
  REUNION: 'Hay fecha para verse',
  VISITADO: 'Ya se reunieron y sabes qué necesita',
  COTIZADO: 'Recibió una oferta (se marca solo al enviarla)',
  NEGOCIACION: 'Discuten precio, plazo o condiciones',
  GANADO: 'Compró (se marca solo al aceptar una oferta)',
  PERDIDO: 'No va a comprar ahora, con su motivo'
}

export const CANALES_GESTION = [
  { valor: 'VISITA', etiqueta: 'Visita' },
  { valor: 'LLAMADA', etiqueta: 'Llamada' },
  { valor: 'WHATSAPP', etiqueta: 'WhatsApp' },
  { valor: 'CORREO', etiqueta: 'Correo' },
  { valor: 'REUNION', etiqueta: 'Reunión en línea' },
  { valor: 'NOTA', etiqueta: 'Nota' }
] as const

export const esEtapa = (e: string): e is EtapaCliente => (ETAPAS_CLIENTE as readonly string[]).includes(e)

const indice = (e: string) => CAMINO.indexOf(e as EtapaCliente)

export type TipoCambioEtapa = 'AVANCE' | 'CORRECCION' | 'PERDIDA' | 'NINGUNO'

/** Qué clase de cambio es pasar de `de` a `a`. */
export function tipoDeCambio(de: string, a: string): TipoCambioEtapa {
  if (de === a) return 'NINGUNO'
  if (a === 'PERDIDO') return 'PERDIDA'
  if (de === 'PERDIDO') return 'CORRECCION'
  return indice(a) > indice(de) ? 'AVANCE' : 'CORRECCION'
}

/**
 * Valida un cambio de etapa. Devuelve el error para mostrar tal cual, o null
 * si procede. El motivo de una pérdida es lo que hace que el embudo enseñe
 * algo: "compró PVC con cinta calefactora" cambia cómo se ofrece al siguiente.
 */
export function validarCambio(de: string, a: string, nota: string | null | undefined): string | null {
  if (!esEtapa(a)) return 'Etapa desconocida'
  const conNota = (nota ?? '').trim() !== ''
  const tipo = tipoDeCambio(de, a)
  if (tipo === 'PERDIDA' && !conNota) return 'Para marcarlo perdido escribe el motivo: sirve para la próxima'
  if (tipo === 'CORRECCION' && !conNota) return 'Volver atrás es una corrección: escribe por qué'
  return null
}

export interface OfertaDelCliente {
  numero: number | null
  estado: string
  fecha: Date
  validezDias: number
}

export interface EtapaConOrigen {
  etapa: EtapaCliente
  /** Por qué no es la etapa guardada; null si es la guardada. */
  origen: string | null
}

/**
 * La etapa que vale: la guardada, salvo que las ofertas digan más.
 *
 * - Una oferta aceptada lo deja Ganado, aunque antes se hubiera dado por perdido.
 * - Una oferta enviada lo deja al menos en Cotizado. Vencida o no, el cliente
 *   la recibió. Un borrador no cuenta: todavía no la ha visto.
 * - Nunca baja una etapa: si ya está en Negociación, una oferta enviada no la
 *   devuelve a Cotizado.
 * - Una oferta rechazada no lo da por perdido: puede pedir otra. Eso lo
 *   decides tú, con su motivo.
 */
export function etapaEfectiva(guardada: string, ofertas: OfertaDelCliente[]): EtapaConOrigen {
  const base: EtapaCliente = esEtapa(guardada) ? guardada : 'IDENTIFICADO'
  const masReciente = (estado: string) =>
    ofertas.filter((o) => o.estado === estado).sort((a, b) => b.fecha.getTime() - a.fecha.getTime())[0]

  const aceptada = masReciente('ACEPTADA')
  if (aceptada) {
    if (base === 'GANADO') return { etapa: base, origen: null }
    return { etapa: 'GANADO', origen: `Por la oferta ${codigo('oferta', aceptada.numero) ?? 'sin código'}, aceptada` }
  }

  const enviada = masReciente('ENVIADA') ?? masReciente('RECHAZADA')
  if (enviada && base !== 'PERDIDO' && indice(base) < indice('COTIZADO')) {
    return { etapa: 'COTIZADO', origen: `Por la oferta ${codigo('oferta', enviada.numero) ?? 'sin código'}, enviada` }
  }

  return { etapa: base, origen: null }
}

export type Pendiente = 'ATRASADO' | 'HOY' | 'SEMANA' | 'DESPUES' | 'SIN_PASO'

export const ETIQUETA_PENDIENTE: Record<Pendiente, string> = {
  ATRASADO: 'Atrasado',
  HOY: 'Hoy',
  SEMANA: 'Esta semana',
  DESPUES: 'Más adelante',
  SIN_PASO: 'Sin próximo paso'
}

const ACTIVAS: EtapaCliente[] = CAMINO.filter((e) => e !== 'GANADO')

/** Medianoche local, para comparar días y no horas. */
const soloDia = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()

/**
 * En qué punto está el próximo paso con un cliente. Null si no hay nada
 * pendiente: un ganado o un perdido no se persiguen, salvo que les pongas
 * fecha (una recompra, por ejemplo).
 *
 * Un prospecto activo sin próximo paso es el que se enfría sin que nadie lo
 * decida: por eso se avisa.
 */
export function clasificarPendiente(
  c: { etapa: string; proximaFecha: Date | null },
  hoy = new Date()
): Pendiente | null {
  const activo = ACTIVAS.includes(c.etapa as EtapaCliente)
  if (!c.proximaFecha) return activo ? 'SIN_PASO' : null
  if (!activo && c.etapa === 'PERDIDO') return null
  const dias = Math.round((soloDia(c.proximaFecha) - soloDia(hoy)) / 86_400_000)
  if (dias < 0) return 'ATRASADO'
  if (dias === 0) return 'HOY'
  if (dias <= 7) return 'SEMANA'
  return 'DESPUES'
}

/** Cuántos clientes hay en cada etapa, en el orden del embudo. */
export function resumenEmbudo(etapas: string[]): { etapa: EtapaCliente; cantidad: number }[] {
  return ETAPAS_CLIENTE.map((etapa) => ({ etapa, cantidad: etapas.filter((e) => e === etapa).length }))
}
