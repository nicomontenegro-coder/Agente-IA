/**
 * Pruebas de las etapas de una compra. Correr con:  npx tsx src/lib/compra.test.ts
 * Caso: la tubería preaislada de Lvzhou para Magallanes.
 */

import { etapaCompra, validarCambio, tipoDeCambio, type HechosCompra } from './compra'
import { igual, grupo, terminar } from './prueba'

const nada: HechosCompra = {
  invitacionesEnviadas: 0,
  cotizacionesRecibidas: 0,
  ocEmitida: false,
  primerPago: false,
  embarcada: false,
  segundoPago: false,
  cerrada: false
}

grupo('La etapa que vale: lo registrado manda')
igual('una compra recién creada está en Necesidad', etapaCompra('NECESIDAD', nada), { etapa: 'NECESIDAD', origen: null })
igual(
  'al enviar la primera RFQ pasa sola a Cotizando',
  etapaCompra('BUSCANDO', { ...nada, invitacionesEnviadas: 1 }),
  { etapa: 'COTIZANDO', origen: 'Se envió la primera RFQ' }
)
igual(
  'con la primera cotización registrada pasa a Evaluando',
  etapaCompra('BUSCANDO', { ...nada, invitacionesEnviadas: 3, cotizacionesRecibidas: 1 }),
  { etapa: 'EVALUANDO', origen: 'Llegó la primera cotización' }
)
igual(
  'si se decidió negociar, una cotización nueva no la devuelve a Evaluando',
  etapaCompra('NEGOCIANDO', { ...nada, invitacionesEnviadas: 3, cotizacionesRecibidas: 2 }),
  { etapa: 'NEGOCIANDO', origen: null }
)
igual(
  'emitir la OC la deja en OC emitida',
  etapaCompra('NEGOCIANDO', { ...nada, invitacionesEnviadas: 3, cotizacionesRecibidas: 2, ocEmitida: true }),
  { etapa: 'OC_EMITIDA', origen: 'Se emitió la orden de compra' }
)
igual(
  'la carta de crédito abierta cuenta como primer pago',
  etapaCompra('OC_EMITIDA', { ...nada, ocEmitida: true, primerPago: true }),
  { etapa: 'PRIMER_PAGO', origen: 'Se registró el primer pago o la carta de crédito' }
)
igual(
  'con el BL registrado queda Embarcada aunque nadie marcara la producción',
  etapaCompra('PRIMER_PAGO', { ...nada, ocEmitida: true, primerPago: true, embarcada: true }),
  { etapa: 'EMBARCADA', origen: 'Se registró el embarque' }
)
igual(
  'una compra cancelada no revive porque llegue una cotización tardía',
  etapaCompra('CANCELADA', { ...nada, invitacionesEnviadas: 2, cotizacionesRecibidas: 1 }),
  { etapa: 'CANCELADA', origen: null }
)

grupo('Cambios a mano')
igual('pasar de Evaluando a Muestras es avance', tipoDeCambio('EVALUANDO', 'MUESTRAS'), 'AVANCE')
igual('volver de Negociando a Evaluando es corrección', tipoDeCambio('NEGOCIANDO', 'EVALUANDO'), 'CORRECCION')
igual('avanzar no pide nota', validarCambio('EVALUANDO', 'NEGOCIANDO', ''), null)
igual(
  'cancelar sin motivo no se acepta',
  validarCambio('EVALUANDO', 'CANCELADA', ' '),
  'Para cancelar la compra escribe el motivo'
)
igual(
  'corregir hacia atrás sin nota no se acepta',
  validarCambio('NEGOCIANDO', 'EVALUANDO', null),
  'Volver atrás es una corrección: escribe por qué'
)
igual('una etapa inventada no se acepta', validarCambio('NECESIDAD', 'APURADA', null), 'Etapa desconocida')

terminar()
