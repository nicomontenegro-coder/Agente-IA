/**
 * Pruebas de clientes duplicados.
 * Correr con:  npx tsx src/lib/duplicados-clientes.test.ts
 * Datos ficticios.
 */

import { posiblesDuplicados, combinarClientes, nucleo, type DatosCliente } from './duplicados-clientes'
import { igual, grupo, terminar } from './prueba'

const guardados = [
  { id: 'a', nombre: 'Ferretería Austral Ltda.', rut: null },
  { id: 'b', nombre: 'Ferretería Sur', rut: '76.123.456-0' },
  { id: 'c', nombre: 'Instalaciones Patagonia SpA', rut: null }
]
const ids = (r: { id: string }[]) => r.map((x) => x.id)

grupo('Avisar un posible duplicado')
igual('el nombre sin forma legal ni rubro: «Ferretería Austral Ltda.» → austral', nucleo('Ferretería Austral Ltda.'), ['austral'])
igual('«Austral» sin RUT puede ser «Ferretería Austral Ltda.»', ids(posiblesDuplicados({ nombre: 'Austral', rut: null }, guardados)), ['a'])
igual('«FERRETERÍA AUSTRAL» también', ids(posiblesDuplicados({ nombre: 'FERRETERÍA AUSTRAL', rut: null }, guardados)), ['a'])
igual('compartir el rubro no basta: «Ferretería Norte» no es «Ferretería Sur»', ids(posiblesDuplicados({ nombre: 'Ferretería Norte', rut: null }, guardados)), [])
igual('«Patagonia» puede ser «Instalaciones Patagonia SpA»', ids(posiblesDuplicados({ nombre: 'Patagonia', rut: null }, guardados)), ['c'])
igual('con RUT distintos son empresas distintas, aunque se llamen igual', ids(posiblesDuplicados({ nombre: 'Ferretería Sur', rut: '12.345.678-5' }, guardados)), [])
igual('un cliente no es duplicado de sí mismo', ids(posiblesDuplicados({ id: 'a', nombre: 'Ferretería Austral Ltda.', rut: null }, guardados)), [])

grupo('Fusionar dos fichas')
const vacio: DatosCliente = { nombre: null, rut: null, canalId: null, ciudad: null, direccion: null, contacto: null, telefono: null, email: null, notas: null, etapa: null, proximaAccion: null }
const destino = { ...vacio, nombre: 'Ferretería Austral Ltda.', ciudad: 'Punta Arenas', telefono: '+56 9 1111 1111', notas: 'Pide crédito', etapa: 'VISITADO' }
const origen = { ...vacio, nombre: 'Austral', rut: '76.123.456-0', ciudad: 'Puerto Natales', email: 'compras@austral.example', notas: 'Le interesa PN20', etapa: 'CONTACTADO' }
const f = combinarClientes(destino, origen)
igual('lo que falta se completa con la otra ficha: RUT y correo', [f.resultado.rut, f.resultado.email], ['76.123.456-0', 'compras@austral.example'])
igual('lo que ya tiene la ficha que queda no se pisa sin preguntar', [f.resultado.nombre, f.resultado.ciudad, f.resultado.etapa], ['Ferretería Austral Ltda.', 'Punta Arenas', 'VISITADO'])
igual('los datos distintos quedan como conflicto para elegir', f.conflictos, ['nombre', 'ciudad', 'etapa'])
igual('las notas no compiten: se juntan', f.resultado.notas, 'Pide crédito\nLe interesa PN20')

terminar()
