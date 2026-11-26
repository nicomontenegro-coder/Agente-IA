/**
 * Pruebas de las preguntas que la lectura le hace a la persona.
 * Correr con:  npx tsx src/lib/preguntas.test.ts
 *
 * Casos reales: cotización de Ridge (plazo 30-45 días) y lista de precios de
 * Lvzhou (PPR PN16 a US$0,311 por metro, pedido en unidades).
 */

import { aplicarRespuesta, convertirUnidad, type Respondible } from './preguntas'
import { igual, grupo, terminar } from './prueba'

const ridge: Respondible = {
  leadTimeDias: 45,
  validezDias: 10,
  gastosHastaFob: 1400,
  total: 49752.16,
  subtotal: 48352.16,
  aceptaCartaCredito: null,
  preciosPorLinea: [],
  preguntas: [
    { campo: 'leadTimeDias', pregunta: 'El documento dice 30-45 días. ¿Qué plazo uso para comparar?', opciones: [{ etiqueta: '30 días', valor: '30' }, { etiqueta: '45 días', valor: '45' }] }
  ],
  dudas: [],
  respuestas: []
}

grupo('Responder una pregunta llena el campo')
const r1 = aplicarRespuesta(ridge, 0, '30')
igual('el plazo queda en 30', r1.ok && r1.lectura.leadTimeDias, 30)
igual('la pregunta desaparece', r1.ok && r1.lectura.preguntas.length, 0)
igual('queda anotado qué se decidió', r1.ok && r1.lectura.respuestas, ['El documento dice 30-45 días. ¿Qué plazo uso para comparar? → 30 días'])
igual('una respuesta que no es número no se acepta', aplicarRespuesta(ridge, 0, 'pronto'), { ok: false, error: 'Ingresa un número' })
igual('una pregunta que no existe no se acepta', aplicarRespuesta(ridge, 3, '30'), { ok: false, error: 'La pregunta ya fue respondida' })
const cc: Respondible = { ...ridge, preguntas: [{ campo: 'aceptaCartaCredito', pregunta: '¿Acepta carta de crédito?', opciones: [] }] }
const r2 = aplicarRespuesta(cc, 0, 'NO')
igual('la carta de crédito se responde con sí o no', r2.ok && r2.lectura.aceptaCartaCredito, false)

grupo('Convertir la unidad del precio')
const lvzhou: Respondible = {
  ...ridge,
  preguntas: [],
  preciosPorLinea: [{ lineaId: 'ppr', precioUnitario: 0.311, montoTotal: null, unidad: 'meter', cita: 'PPR cold & hot water pipe 20×2.8 US$0.311' }]
}
const r3 = convertirUnidad(lvzhou, 'ppr', 4, 'u')
igual('0,311 por metro con barras de 4 m da 1,244 por unidad', r3.ok && r3.lectura.preciosPorLinea[0].precioUnitario, 1.244)
igual('el precio queda en la unidad pedida', r3.ok && r3.lectura.preciosPorLinea[0].unidad, 'u')
igual('y dice de dónde salió', r3.ok && r3.lectura.respuestas, ['Precio convertido: 0,311 por meter × 4 meter por u = 1,244 por u'])
igual('un factor cero no se acepta', convertirUnidad(lvzhou, 'ppr', 0, 'u'), { ok: false, error: 'Ingresa cuántos meter tiene cada u' })

terminar()
