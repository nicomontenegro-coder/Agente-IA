/**
 * Las etapas de una Compra: el proceso P2P que Nico confirmó el 23-11-2026
 * (diseno/p2p.md, en la raíz del repositorio).
 *
 * Igual que el embudo de Importa: las etapas solo avanzan; volver atrás es una
 * corrección con nota, y cancelar exige motivo. Las etapas que se pueden
 * despejar de lo registrado (RFQ enviadas, cotizaciones, OC, pagos,
 * embarque, cierre) no se piden: se calculan, para no escribir dos veces el
 * mismo dato.
 *
 * Funciones puras: sin base de datos. Las usan la pantalla y, más adelante, el agente.
 */

export const ETAPAS_COMPRA = [
  'NECESIDAD',
  'BUSCANDO',
  'COTIZANDO',
  'EVALUANDO',
  'MUESTRAS',
  'NEGOCIANDO',
  'OC_EMITIDA',
  'PRIMER_PAGO',
  'EN_PRODUCCION',
  'INSPECCIONADA',
  'EMBARCADA',
  'SEGUNDO_PAGO',
  'EN_IMPORTACION',
  'RECIBIDA',
  'CERRADA',
  'CANCELADA'
] as const

export type EtapaCompra = (typeof ETAPAS_COMPRA)[number]

export const ETIQUETA_ETAPA: Record<EtapaCompra, string> = {
  NECESIDAD: 'Necesidad',
  BUSCANDO: 'Buscando proveedores',
  COTIZANDO: 'Cotizando',
  EVALUANDO: 'Evaluando',
  MUESTRAS: 'Muestras',
  NEGOCIANDO: 'Negociando',
  OC_EMITIDA: 'OC emitida',
  PRIMER_PAGO: 'Primer pago',
  EN_PRODUCCION: 'En producción',
  INSPECCIONADA: 'Carga inspeccionada',
  EMBARCADA: 'Embarcada',
  SEGUNDO_PAGO: 'Segundo pago',
  EN_IMPORTACION: 'En importación',
  RECIBIDA: 'Recibida',
  CERRADA: 'Cerrada',
  CANCELADA: 'Cancelada'
}

/** Qué hay que hacer en cada etapa: se muestra como "qué sigue". */
export const SIGUE_ETAPA: Record<EtapaCompra, string> = {
  NECESIDAD: 'Definir qué productos y cuánto, y buscar proveedores',
  BUSCANDO: 'Invitar proveedores de la familia y enviarles la RFQ',
  COTIZANDO: 'Esperar las cotizaciones; seguir a quien no responde',
  EVALUANDO: 'Revisar filtros y comparar las cotizaciones',
  MUESTRAS: 'Recibir y ensayar las muestras',
  NEGOCIANDO: 'Cerrar precio y condiciones, y emitir la OC',
  OC_EMITIDA: 'Recibir la proforma y abrir la carta de crédito o pagar el anticipo',
  PRIMER_PAGO: 'Seguir la producción',
  EN_PRODUCCION: 'Coordinar la inspección de la carga',
  INSPECCIONADA: 'Coordinar el embarque y recibir los documentos',
  EMBARCADA: 'Liberar el segundo pago contra inspección y documentos',
  SEGUNDO_PAGO: 'Seguir la importación',
  EN_IMPORTACION: 'Recibir en bodega',
  RECIBIDA: 'Hacer el calce de 3 vías (OC, recibido y factura) y cerrar',
  CERRADA: 'Nada: la compra terminó',
  CANCELADA: 'Nada: la compra se canceló'
}

/** El camino normal, sin Cancelada. */
const CAMINO: EtapaCompra[] = ETAPAS_COMPRA.filter((e) => e !== 'CANCELADA')
const indice = (e: string) => CAMINO.indexOf(e as EtapaCompra)

export const esEtapa = (e: string): e is EtapaCompra => (ETAPAS_COMPRA as readonly string[]).includes(e)

/** Lo que está registrado en la base y deja ver en qué va la compra. */
export interface HechosCompra {
  invitacionesEnviadas: number
  cotizacionesRecibidas: number
  ocEmitida: boolean
  primerPago: boolean
  embarcada: boolean
  segundoPago: boolean
  cerrada: boolean
}

/** Las etapas que se despejan solas, de la más avanzada a la menos. */
const DESPEJADAS: { etapa: EtapaCompra; si: (h: HechosCompra) => boolean; origen: string }[] = [
  { etapa: 'CERRADA', si: (h) => h.cerrada, origen: 'Se hizo el calce de 3 vías' },
  { etapa: 'SEGUNDO_PAGO', si: (h) => h.segundoPago, origen: 'Se registró el segundo pago' },
  { etapa: 'EMBARCADA', si: (h) => h.embarcada, origen: 'Se registró el embarque' },
  { etapa: 'PRIMER_PAGO', si: (h) => h.primerPago, origen: 'Se registró el primer pago o la carta de crédito' },
  { etapa: 'OC_EMITIDA', si: (h) => h.ocEmitida, origen: 'Se emitió la orden de compra' },
  { etapa: 'EVALUANDO', si: (h) => h.cotizacionesRecibidas > 0, origen: 'Llegó la primera cotización' },
  { etapa: 'COTIZANDO', si: (h) => h.invitacionesEnviadas > 0, origen: 'Se envió la primera RFQ' }
]

export interface EtapaConOrigen {
  etapa: EtapaCompra
  /** Por qué no es la etapa guardada a mano; null si es la guardada. */
  origen: string | null
}

/**
 * La etapa que vale: la guardada, salvo que lo registrado diga más. Nunca
 * baja una etapa, y una compra cancelada no revive sola.
 */
export function etapaCompra(guardada: string, h: HechosCompra): EtapaConOrigen {
  const base: EtapaCompra = esEtapa(guardada) ? guardada : 'NECESIDAD'
  if (base === 'CANCELADA') return { etapa: base, origen: null }
  const despejada = DESPEJADAS.find((d) => d.si(h))
  if (despejada && indice(despejada.etapa) > indice(base)) return { etapa: despejada.etapa, origen: despejada.origen }
  return { etapa: base, origen: null }
}

export type TipoCambio = 'AVANCE' | 'CORRECCION' | 'CANCELACION' | 'NINGUNO'

export function tipoDeCambio(de: string, a: string): TipoCambio {
  if (de === a) return 'NINGUNO'
  if (a === 'CANCELADA') return 'CANCELACION'
  if (de === 'CANCELADA') return 'CORRECCION'
  return indice(a) > indice(de) ? 'AVANCE' : 'CORRECCION'
}

/** El error para mostrar tal cual, o null si el cambio procede. */
export function validarCambio(de: string, a: string, nota: string | null | undefined): string | null {
  if (!esEtapa(a)) return 'Etapa desconocida'
  const conNota = (nota ?? '').trim() !== ''
  const tipo = tipoDeCambio(de, a)
  if (tipo === 'CANCELACION' && !conNota) return 'Para cancelar la compra escribe el motivo'
  if (tipo === 'CORRECCION' && !conNota) return 'Volver atrás es una corrección: escribe por qué'
  return null
}

export const etapasDelCamino = CAMINO
