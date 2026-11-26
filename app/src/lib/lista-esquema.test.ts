/**
 * Pruebas del esquema de lectura de listas de precios.
 * Correr con:  npx tsx src/lib/lista-esquema.test.ts
 */

import { z } from 'zod'

import { EsquemaLista, listaDesdeIA } from './lista-esquema'
import { camposQueAdmitenVacio } from './lectura-esquema'
import { igual, grupo, terminar } from './prueba'

grupo('Lo que acepta la API')
const n = camposQueAdmitenVacio(z.toJSONSchema(EsquemaLista))
igual(`no pasa de 16 campos que admiten vacío (tiene ${n})`, n <= 16, true)

grupo('Lo vacío queda vacío')
const l = listaDesdeIA({
  proveedor: 'Lvzhou', fecha: '2026-11-05', validezDias: 10, moneda: 'USD', incoterm: 'FOB', lugar: 'Shanghai',
  items: [{ familia: 'Tubería PPR', grupo: '', descripcion: 'Tubo PPR', especificacion: '110×15.1', unidad: 'm', precio: null }],
  dudas: []
})
igual('un grupo vacío pasa a null', l.items[0].grupo, null)
igual('una medida sin precio se conserva con precio null', [l.items[0].especificacion, l.items[0].precio], ['110×15.1', null])

terminar()
