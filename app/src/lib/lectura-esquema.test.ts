/**
 * Pruebas del esquema que se le envía a la IA.
 * Correr con:  npx tsx src/lib/lectura-esquema.test.ts
 */

import { z } from 'zod'

import { EsquemaLectura, desdeIA, camposQueAdmitenVacio } from './lectura-esquema'
import { igual, grupo, terminar } from './prueba'

grupo('Lo que acepta la API')
const n = camposQueAdmitenVacio(z.toJSONSchema(EsquemaLectura))
igual(`el esquema no pasa de 16 campos que admiten vacío (tiene ${n}): con 23 la API rechazaba el PDF de Ridge`, n <= 16, true)
igual('el contador sí cuenta: un campo nullable vale uno', camposQueAdmitenVacio(z.toJSONSchema(z.object({ a: z.number().nullable(), b: z.string() }))), 1)

grupo('Lo que la IA no encontró queda vacío, no inventado')
const vacio = {
  proveedor: 'Quanzhou Ridge Steel Structure Co., Ltd.', proveedorPais: 'China', contacto: '', email: ' ', telefono: '', referencia: '', fecha: '', moneda: 'USD',
  incoterm: 'FOB', lugar: 'Xiamen', subtotal: null, gastosHastaFob: null, total: 49752.16, validezDias: null, leadTimeDias: null, condicionesPago: '',
  aceptaCartaCredito: null, moq: '', noIncluye: '', desglose: [{ descripcion: 'H steel', unidad: '', cantidad: 26.45, precioUnitario: 830, monto: 21953.5 }],
  preciosPorLinea: [], dudas: []
}
const l = desdeIA(vacio)
igual('un texto vacío pasa a null', [l.contacto, l.email, l.referencia, l.moq], [null, null, null, null])
igual('lo que sí vino se conserva', [l.proveedor, l.incoterm, l.total], ['Quanzhou Ridge Steel Structure Co., Ltd.', 'FOB', 49752.16])
igual('la unidad vacía de un ítem pasa a null', l.desglose[0].unidad, null)

terminar()
