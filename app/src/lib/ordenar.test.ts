/**
 * Pruebas de ordenar y filtrar tablas.
 * Correr con:  npx tsx src/lib/ordenar.test.ts
 */

import { ordenar, coincide } from './ordenar'
import { igual, grupo, terminar } from './prueba'

const tubos = [
  { m: '110×15.1', p: null },
  { m: '20×2.8', p: 0.311 },
  { m: '25×3.5', p: 0.496 },
  { m: '20×2.3', p: 0.262 }
]

grupo('Ordenar')
igual('por precio de menor a mayor, el sin precio al final', ordenar(tubos, (t) => t.p, false).map((t) => t.p), [0.262, 0.311, 0.496, null])
igual('de mayor a menor, el sin precio sigue al final', ordenar(tubos, (t) => t.p, true).map((t) => t.p), [0.496, 0.311, 0.262, null])
igual('las medidas se ordenan como números: 20 antes que 110', ordenar(tubos, (t) => t.m, false).map((t) => t.m), ['20×2.3', '20×2.8', '25×3.5', '110×15.1'])
igual('alfabético sin importar tildes', ordenar([{ d: 'Unión' }, { d: 'codo' }, { d: 'Tee' }], (x) => x.d, false).map((x) => x.d), ['codo', 'Tee', 'Unión'])

grupo('Buscar')
igual('«codo 20» encuentra el codo de 20', coincide(['Codo 90°', '20', 'Fittings PPR'], 'codo 20'), true)
igual('sin tildes ni mayúsculas: «union» encuentra «Unión»', coincide(['Unión recta'], 'UNION'), true)
igual('todas las palabras tienen que estar', coincide(['Codo 90°', '25'], 'codo 20'), false)
igual('un buscador vacío deja pasar todo', coincide(['x'], '  '), true)

terminar()
