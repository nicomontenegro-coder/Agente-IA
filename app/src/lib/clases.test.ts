/**
 * Pruebas de las clases de producto.
 * Correr con:  npx tsx src/lib/clases.test.ts
 *
 * Casos reales: ítems de la lista de precios de Lvzhou (05-11-2026).
 */

import { proponerProducto, validarAtributos, type DefAtributo } from './clases'
import { igual, grupo, terminar } from './prueba'

const item = (familia: string, descripcion: string, grupo: string | null, especificacion: string, unidad: string) => ({ familia, descripcion, grupo, especificacion, unidad })

grupo('Reconocer el producto GESI de un ítem del proveedor')
igual('tubo 20×2.8 por metro: Tubo PPR desnudo PN16', proponerProducto(item('Tubería PPR', 'Tubo PPR', 'PPR cold & hot water pipe', '20×2.8', 'm')), {
  clase: 'Tubo', modelo: 'Tubo PPR desnudo PN16', nombre: 'Tubo PPR desnudo 20×2,8 PN16',
  atributos: { material: 'PPR', union: 'termofusión', dn: 20, espesor: 2.8, aislacion: 'desnudo' }
})
igual('tubo 20×2.3 (serie S4): sin PN en el nombre, no se inventa', proponerProducto(item('Tubería PPR', 'Tubo PPR', null, '20×2.3', 'm'))?.nombre, 'Tubo PPR desnudo 20×2,3')
igual('preaislado BWG', proponerProducto(item('Tubería PPR', 'Tubo PPR preaislado', 'BWG', '25×3.5', 'm'))?.modelo, 'Tubo PPR preaislado PN16')
igual('codo 90° de 20', proponerProducto(item('Fittings PPR', 'Codo 90°', '90° Elbow', '20', 'pieza')), {
  clase: 'Fitting', modelo: 'Codo 90° PPR', nombre: 'Codo 90° PPR 20', atributos: { material: 'PPR', union: 'termofusión', tipo: 'codo 90°', dn: 20 }
})
igual('unión recta → copla', proponerProducto(item('Fittings PPR', 'Unión recta', 'Straight connector', '25', 'pieza'))?.nombre, 'Copla PPR 25')
igual('reducción 32×20 trae diámetro 2', proponerProducto(item('Fittings PPR', 'Reducción', 'Reducing coupling', '32×20', 'pieza'))?.atributos, { material: 'PPR', union: 'termofusión', tipo: 'reducción', dn: 32, dn2: 20 })
igual('un codo con dos medidas no se reconoce: no se adivina', proponerProducto(item('Fittings PPR', 'Codo 90°', null, '32×20', 'pieza')), null)
igual('un fitting metálico no es PPR: queda sin clasificar', proponerProducto(item('Fittings metálicos', 'Codo bronce', null, '1/2"', 'pieza')), null)
igual('una herramienta queda sin clasificar', proponerProducto(item('Herramientas', 'Termofusora PPR', null, '20-63', 'pieza')), null)

grupo('Atributos según el tipo')
const defs: DefAtributo[] = [
  { clave: 'tipo', nombre: 'Tipo', tipo: 'OPCION', unidad: null, opciones: 'codo 90°,codo 45°,tee,copla,reducción,terminal,tapón', soloSi: null, obligatorio: true },
  { clave: 'dn', nombre: 'Diámetro', tipo: 'NUMERO', unidad: 'mm', opciones: null, soloSi: null, obligatorio: true },
  { clave: 'dn2', nombre: 'Diámetro 2', tipo: 'NUMERO', unidad: 'mm', opciones: null, soloSi: 'tipo=reducción', obligatorio: true },
  { clave: 'rosca', nombre: 'Rosca', tipo: 'TEXTO', unidad: null, opciones: null, soloSi: 'tipo=terminal', obligatorio: true }
]
igual('un codo de 20 está completo', validarAtributos(defs, { tipo: 'codo 90°', dn: 20 }), [])
igual('una reducción sin diámetro 2 está incompleta', validarAtributos(defs, { tipo: 'reducción', dn: 32 }), ['Falta «Diámetro 2»'])
igual('un codo con diámetro 2 tiene un dato que no aplica', validarAtributos(defs, { tipo: 'codo 90°', dn: 20, dn2: 20 }), ['«Diámetro 2» no aplica a este tipo'])
igual('un tipo que no existe se avisa', validarAtributos(defs, { tipo: 'codo raro', dn: 20 })[0], '«Tipo» debe ser uno de: codo 90°,codo 45°,tee,copla,reducción,terminal,tapón')

terminar()
