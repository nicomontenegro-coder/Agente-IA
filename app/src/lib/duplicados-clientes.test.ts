/**
 * Pruebas de clientes duplicados.
 * Correr con:  npx tsx src/lib/duplicados-clientes.test.ts
 * Datos ficticios.
 */

import { posiblesDuplicados, combinarClientes, nucleo, unirSucursales, type DatosCliente } from './duplicados-clientes'
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
const vacio: DatosCliente = { nombre: null, rut: null, canalId: null, contacto: null, telefono: null, email: null, notas: null, etapa: null, proximaAccion: null }
const destino = { ...vacio, nombre: 'Ferretería Austral Ltda.', contacto: 'Juan Soto', telefono: '+56 9 1111 1111', notas: 'Pide crédito', etapa: 'VISITADO' }
const origen = { ...vacio, nombre: 'Austral', rut: '76.123.456-0', contacto: 'Ana Ruiz', email: 'compras@austral.example', notas: 'Le interesa PN20', etapa: 'CONTACTADO' }
const f = combinarClientes(destino, origen)
igual('lo que falta se completa con la otra ficha: RUT y correo', [f.resultado.rut, f.resultado.email], ['76.123.456-0', 'compras@austral.example'])
igual('lo que ya tiene la ficha que queda no se pisa sin preguntar', [f.resultado.nombre, f.resultado.contacto, f.resultado.etapa], ['Ferretería Austral Ltda.', 'Juan Soto', 'VISITADO'])
igual('los datos distintos quedan como conflicto para elegir', f.conflictos, ['nombre', 'contacto', 'etapa'])
igual('las notas no compiten: se juntan', f.resultado.notas, 'Pide crédito\nLe interesa PN20')

grupo('Sucursales al fusionar')
const pa = { id: 'pa', ciudad: 'Punta Arenas', direccion: 'Bulnes 100', contacto: null, telefono: null }
const pn = { id: 'pn', ciudad: 'Puerto Natales', direccion: null, contacto: 'Ana', telefono: null }
const pa2 = { id: 'pa2', ciudad: 'PUNTA ARENAS', direccion: null, contacto: 'Juan', telefono: '+56 9 2222 2222' }
const pa3 = { id: 'pa3', ciudad: 'Punta Arenas', direccion: 'Zenteno 500', contacto: null, telefono: null }
igual('dos ciudades distintas: las dos quedan, no hay que elegir', unirSucursales([pa], [pn]), { mover: ['pn'], completar: [] })
igual('la misma sucursal en las dos fichas: se completa la que queda', unirSucursales([pa], [pa2]), { mover: [], completar: [{ queda: 'pa', sale: 'pa2', datos: { contacto: 'Juan', telefono: '+56 9 2222 2222' } }] })
igual('dos locales en la misma ciudad, con direcciones distintas: son dos sucursales', unirSucursales([pa], [pa3]), { mover: ['pa3'], completar: [] })

terminar()
