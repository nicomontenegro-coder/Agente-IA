/**
 * Pruebas del embudo de clientes. Correr con:  npx tsx src/lib/embudo.test.ts
 *
 * Casos: la tubería preaislada para salmoneras y ferreterías de Magallanes.
 */

import {
  tipoDeCambio,
  validarCambio,
  etapaEfectiva,
  clasificarPendiente,
  resumenEmbudo,
  type OfertaDelCliente
} from './embudo'

let pasadas = 0
let fallidas = 0

function igual(nombre: string, actual: unknown, esperado: unknown) {
  if (JSON.stringify(actual) === JSON.stringify(esperado)) {
    pasadas++
    console.log(`  ✓ ${nombre}: ${JSON.stringify(actual)}`)
  } else {
    fallidas++
    console.log(`  ✗ ${nombre}: esperaba ${JSON.stringify(esperado)}, obtuve ${JSON.stringify(actual)}`)
  }
}

const dia = (s: string) => new Date(`${s}T12:00:00`)
const hoy = dia('2026-11-23')
const oferta = (numero: number, estado: string, fecha = '2026-11-20'): OfertaDelCliente => ({
  numero,
  estado,
  fecha: dia(fecha),
  validezDias: 15
})

console.log('\nCambios de etapa')
igual('de identificado a visitado es avance (se pueden saltar etapas)', tipoDeCambio('IDENTIFICADO', 'VISITADO'), 'AVANCE')
igual('de cotizado a contactado es corrección', tipoDeCambio('COTIZADO', 'CONTACTADO'), 'CORRECCION')
igual('marcar perdido es pérdida', tipoDeCambio('NEGOCIACION', 'PERDIDO'), 'PERDIDA')
igual('reabrir un perdido es corrección', tipoDeCambio('PERDIDO', 'CONTACTADO'), 'CORRECCION')
igual('misma etapa no es cambio', tipoDeCambio('VISITADO', 'VISITADO'), 'NINGUNO')

console.log('\nValidación')
igual('avanzar no pide nota', validarCambio('CONTACTADO', 'REUNION', null), null)
igual('perder sin motivo no se acepta', validarCambio('COTIZADO', 'PERDIDO', ''), 'Para marcarlo perdido escribe el motivo: sirve para la próxima')
igual('perder con motivo se acepta', validarCambio('COTIZADO', 'PERDIDO', 'Compró tubería de PVC con cinta calefactora'), null)
igual('retroceder sin nota no se acepta', validarCambio('NEGOCIACION', 'VISITADO', '  '), 'Volver atrás es una corrección: escribe por qué')
igual('etapa inventada no se acepta', validarCambio('CONTACTADO', 'FELIZ', null), 'Etapa desconocida')

console.log('\nEtapa que vale: lo que dicen las ofertas manda')
igual(
  'prospecto sin ofertas queda en su etapa',
  etapaEfectiva('VISITADO', []),
  { etapa: 'VISITADO', origen: null }
)
igual(
  'una oferta en borrador no lo hace cotizado: todavía no la ve',
  etapaEfectiva('VISITADO', [oferta(12, 'BORRADOR')]),
  { etapa: 'VISITADO', origen: null }
)
igual(
  'oferta enviada a la salmonera la deja cotizada',
  etapaEfectiva('VISITADO', [oferta(12, 'ENVIADA')]),
  { etapa: 'COTIZADO', origen: 'Por la oferta GESI-OF12, enviada' }
)
igual(
  'si ya estaba en negociación, una oferta enviada no la baja',
  etapaEfectiva('NEGOCIACION', [oferta(12, 'ENVIADA')]),
  { etapa: 'NEGOCIACION', origen: null }
)
igual(
  'oferta aceptada la deja ganada, aunque estuviera en contactado',
  etapaEfectiva('CONTACTADO', [oferta(12, 'ENVIADA'), oferta(14, 'ACEPTADA')]),
  { etapa: 'GANADO', origen: 'Por la oferta GESI-OF14, aceptada' }
)
igual(
  'una aceptación posterior gana sobre un perdido anterior',
  etapaEfectiva('PERDIDO', [oferta(15, 'ACEPTADA')]),
  { etapa: 'GANADO', origen: 'Por la oferta GESI-OF15, aceptada' }
)
igual(
  'una oferta rechazada igual lo deja cotizado: no lo da por perdido',
  etapaEfectiva('VISITADO', [oferta(13, 'RECHAZADA')]),
  { etapa: 'COTIZADO', origen: 'Por la oferta GESI-OF13, enviada' }
)
igual(
  'una oferta vencida igual cuenta como cotizado: el cliente la recibió',
  etapaEfectiva('CONTACTADO', [oferta(9, 'ENVIADA', '2026-09-01')]),
  { etapa: 'COTIZADO', origen: 'Por la oferta GESI-OF9, enviada' }
)

console.log('\nPróximo paso')
const activo = { etapa: 'VISITADO' }
igual('fecha pasada es atrasado', clasificarPendiente({ ...activo, proximaFecha: dia('2026-11-20') }, hoy), 'ATRASADO')
igual('fecha de hoy es hoy', clasificarPendiente({ ...activo, proximaFecha: dia('2026-11-23') }, hoy), 'HOY')
igual('dentro de 7 días es esta semana', clasificarPendiente({ ...activo, proximaFecha: dia('2026-11-30') }, hoy), 'SEMANA')
igual('más allá de 7 días es más adelante', clasificarPendiente({ ...activo, proximaFecha: dia('2026-12-15') }, hoy), 'DESPUES')
igual('un prospecto activo sin fecha queda sin próximo paso', clasificarPendiente({ ...activo, proximaFecha: null }, hoy), 'SIN_PASO')
igual('un ganado sin fecha no es pendiente', clasificarPendiente({ etapa: 'GANADO', proximaFecha: null }, hoy), null)
igual('un perdido con fecha vieja no es pendiente', clasificarPendiente({ etapa: 'PERDIDO', proximaFecha: dia('2026-10-01') }, hoy), null)

console.log('\nResumen del embudo')
igual(
  'cuenta por etapa, en el orden del embudo',
  resumenEmbudo(['VISITADO', 'COTIZADO', 'VISITADO', 'IDENTIFICADO', 'PERDIDO']).map((e) => [e.etapa, e.cantidad]),
  [
    ['IDENTIFICADO', 1],
    ['CONTACTADO', 0],
    ['REUNION', 0],
    ['VISITADO', 2],
    ['COTIZADO', 1],
    ['NEGOCIACION', 0],
    ['GANADO', 0],
    ['PERDIDO', 1]
  ]
)

console.log(`\n${pasadas} pasadas, ${fallidas} fallidas`)
if (fallidas > 0) process.exit(1)
