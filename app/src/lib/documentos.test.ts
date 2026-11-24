/**
 * Pruebas de los textos de RFQ y de la orden de compra. Correr con:  npx tsx src/lib/documentos.test.ts
 */

import { textoRfq, totalesOrden, condicionesOrden, formaPagoSugerida, PIDE_RFQ, type DatosRfq } from './documentos'
import { igual, grupo, terminar } from './prueba'

const rfq: DatosRfq = {
  codigo: 'GESI-CP3',
  tema: 'Pre-insulated PPR pipe',
  incoterm: 'FOB',
  lugar: 'Ningbo',
  destino: 'Punta Arenas, Chile',
  plazoRespuesta: new Date('2026-12-05T12:00:00'),
  lineas: [
    { descripcion: 'Pre-insulated PPR pipe', especificacion: 'PPR 20×3.4, ISO 15874', cantidad: 2000, unidad: 'm' },
    { descripcion: 'Elbow 90°', especificacion: null, cantidad: 500, unidad: 'pcs' }
  ],
  contacto: 'Jun',
  firmante: 'Nico Montenegro',
  empresa: 'GESI SpA'
}

grupo('RFQ en inglés')
const en = textoRfq(rfq, 'en')
igual('el asunto lleva el código para encontrar la respuesta', en.asunto, 'Request for quotation: Pre-insulated PPR pipe [GESI-CP3]')
igual('saluda al contacto por su nombre', en.cuerpo.startsWith('Dear Jun,'), true)
igual('lista cada producto con su cantidad', en.cuerpo.includes('1. Pre-insulated PPR pipe — 2,000 m'), true)
igual('pide aceptar carta de crédito', en.cuerpo.includes('letter of credit'), true)
igual('pide los 10 puntos del formato GESI', PIDE_RFQ.en.every((r) => en.cuerpo.includes(r)), true)

grupo('RFQ en español, para revisar')
const es = textoRfq(rfq, 'es')
igual('el asunto en español lleva el mismo código', es.asunto, 'Solicitud de cotización: Pre-insulated PPR pipe [GESI-CP3]')
igual('cantidades con formato chileno', es.cuerpo.includes('1. Pre-insulated PPR pipe — 2.000 m'), true)
igual('dice el incoterm con su lugar', es.cuerpo.includes('Incoterm: FOB Ningbo'), true)
igual('pide los mismos 10 puntos que en inglés', PIDE_RFQ.es.length === PIDE_RFQ.en.length && PIDE_RFQ.es.every((r) => es.cuerpo.includes(r)), true)

grupo('Totales de la orden')
igual('2.000 m a 0,79 + 500 codos a 0,35, sin descuento', totalesOrden([{ cantidad: 2000, precioUnitario: 0.79 }, { cantidad: 500, precioUnitario: 0.35 }], null), { subtotal: 1755, descuento: 0, total: 1755 })
igual('3 % de descuento sobre 60.000', totalesOrden([{ cantidad: 1, precioUnitario: 60000 }], 3), { subtotal: 60000, descuento: 1800, total: 58200 })
igual('un descuento negativo no sube el precio', totalesOrden([{ cantidad: 1, precioUnitario: 100 }], -5).total, 100)

grupo('Condiciones de la orden')
igual('el primer embarque con un proveedor va con carta de crédito', formaPagoSugerida(0), 'CARTA_CREDITO')
igual('desde el segundo, T/T', formaPagoSugerida(2), 'TT')
const lc = condicionesOrden({ formaPago: 'CARTA_CREDITO', anticipoPct: null, garantiaMeses: 12, codigo: 'GESI-OC7' }, 'en')
igual('con carta de crédito, el pago va contra inspección y documentos', lc[0].lineas[1], 'Payment against the approved inspection certificate and the shipping documents.')
igual('los documentos piden citar el número de la orden', lc[2].lineas[2], 'Please quote GESI-OC7 on every document.')
const tt = condicionesOrden({ formaPago: 'TT', anticipoPct: 30, garantiaMeses: null, codigo: 'GESI-OC8' }, 'es')
igual('T/T 30/70 en español', tt[0].lineas[0], 'T/T: 30 % de anticipo y 70 % de saldo.')
igual('sin garantía definida no se inventa una línea de garantía', tt[3].lineas.some((l) => l.startsWith('Garantía')), false)
igual('en inglés y español salen las mismas 5 secciones', condicionesOrden({ formaPago: 'TT', anticipoPct: 30, garantiaMeses: 12, codigo: null }, 'en').length, tt.length)

terminar()
