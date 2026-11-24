/**
 * Pruebas del pedido de cotización (RFQ).
 * Correr con:  npx tsx src/lib/pedido-cotizacion.test.ts
 */

import { revisarPedido, asuntoCorreo, textoCorreo, incotermEn, terminos, unidadEn, type Pedido } from './pedido-cotizacion'

let pasadas = 0
let fallidas = 0
function igual(que: string, obtuve: unknown, esperaba: unknown) {
  const ok = JSON.stringify(obtuve) === JSON.stringify(esperaba)
  console.log(`  ${ok ? '✓' : '✗'} ${que}: ${JSON.stringify(obtuve)}`)
  if (!ok) console.log(`      esperaba ${JSON.stringify(esperaba)}`)
  ok ? pasadas++ : fallidas++
}
const contiene = (que: string, texto: string, buscado: string) => igual(que, texto.includes(buscado), true)

// El caso real: pedirle a Lvzhou los tubos PPR pre aislados y sus codos.
const lvzhou: Pedido = {
  codigo: 'GESI-RFQ1',
  tema: 'PPR pre-insulated pipes',
  incoterm: 'FOB',
  puertoDestino: 'San Antonio, Chile',
  plazoRespuesta: new Date(Date.UTC(2026, 11, 5)),
  certificadoOrigen: true,
  lineas: [
    {
      descripcion: 'PPR pre-insulated pipe DN20',
      especificacion: 'PN20, 4 m length, 9 mm PE foam insulation',
      cantidad: 3720,
      unidad: 'pcs'
    },
    { descripcion: 'PPR elbow 90° DN20', especificacion: null, cantidad: 6810, unidad: 'pcs' },
    { descripcion: '', especificacion: null, cantidad: null, unidad: null }
  ],
  pide: ['Unit price for each item, in USD, under the requested Incoterm.'],
  requisitos: ['Pipes must comply with ISO 15874.'],
  contacto: 'Ms. Chen',
  empresa: 'GESI SpA',
  firmante: 'Nicolás Montenegro'
}

console.log('Qué líneas sirven')
igual('las filas en blanco no cuentan', revisarPedido(lvzhou.lineas), [])
igual('un pedido sin productos no se guarda', revisarPedido([{ descripcion: '', cantidad: null }]), [
  'Agrega al menos un producto con su cantidad.'
])
igual('sin cantidad no se puede cotizar', revisarPedido([{ descripcion: 'PPR pipe DN25', cantidad: null }]), [
  '«PPR pipe DN25» no tiene cantidad: sin ella el proveedor no puede cotizar.'
])
igual('una cantidad sin producto se avisa por su número de línea', revisarPedido([{ descripcion: ' ', cantidad: 10 }]), [
  'La línea 1 tiene cantidad pero no dice qué producto es.'
])

console.log('\nEl asunto lleva el código, para encontrar la respuesta')
igual('con código', asuntoCorreo(lvzhou), 'Request for quotation: PPR pre-insulated pipes [GESI-RFQ1]')
igual('todavía sin guardar', asuntoCorreo({ ...lvzhou, codigo: null }), 'Request for quotation: PPR pre-insulated pipes')

console.log('\nEl incoterm con su nombre oficial en inglés')
igual('FOB', incotermEn('FOB'), 'FOB (Free On Board)')
igual('uno que no se conoce queda tal cual', incotermEn('XYZ'), 'XYZ')

console.log('\nLas unidades salen en inglés')
// «u» no le dice nada a una fábrica china; «pcs» sí.
igual('unidad → pcs', unidadEn({ codigo: 'UN', nombre: 'Unidad', simbolo: 'u' }), 'pcs')
igual('caja → cartons', unidadEn({ codigo: 'CAJA', nombre: 'Caja', simbolo: '' }), 'cartons')
igual('las métricas quedan iguales', unidadEn({ codigo: 'M2', nombre: 'Metro cuadrado', simbolo: 'm²' }), 'm²')
igual('una creada por el usuario queda con su símbolo', unidadEn({ codigo: 'TUBO4', nombre: 'Tubo de 4 m', simbolo: 'tubo' }), 'tubo')
igual('sin unidad, nada', unidadEn(null), null)

console.log('\nLos términos')
// El certificado de origen va porque mueve el arancel de 6% a 0%.
igual(
  'lo que se pide, en orden',
  terminos(lvzhou).map((t) => t.etiqueta),
  ['Incoterm', 'Destination', 'Please reply by', 'Certificate of origin']
)
igual('la fecha en inglés', terminos(lvzhou)[2].valor, '5 December 2026')
igual(
  'sin destino ni plazo ni certificado, solo el incoterm',
  terminos({ ...lvzhou, puertoDestino: null, plazoRespuesta: null, certificadoOrigen: false }).map((t) => t.etiqueta),
  ['Incoterm']
)

console.log('\nEl texto del correo')
const texto = textoCorreo(lvzhou)
contiene('saluda al contacto por su nombre', texto, 'Dear Ms. Chen,')
contiene('cita la referencia', texto, 'our reference GESI-RFQ1')
contiene('cada producto con su cantidad y unidad', texto, '1. PPR pre-insulated pipe DN20 — 3,720 pcs')
contiene('la especificación debajo', texto, '   PN20, 4 m length, 9 mm PE foam insulation')
contiene('el segundo producto', texto, '2. PPR elbow 90° DN20 — 6,810 pcs')
igual('la fila vacía no aparece', texto.includes('3.'), false)
contiene('los requisitos propios', texto, '- Pipes must comply with ISO 15874.')
contiene('lo que se pide incluir', texto, 'Please include in your quotation:')
contiene('firma con nombre y empresa', texto, 'Best regards,\nNicolás Montenegro\nGESI SpA')
igual('sin contacto, un saludo genérico', textoCorreo({ ...lvzhou, contacto: null }).startsWith('Dear Sir or Madam,'), true)

console.log(`\n${'─'.repeat(50)}\n${pasadas} pasadas, ${fallidas} fallidas\n${'─'.repeat(50)}`)
if (fallidas > 0) process.exit(1)
