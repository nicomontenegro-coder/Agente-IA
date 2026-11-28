/**
 * Pruebas de las clases de producto.
 * Correr con:  npx tsx src/lib/clases.test.ts
 *
 * Casos reales: ítems de la lista de precios de Lvzhou (05-11-2026).
 */

import { proponerProducto, validarAtributos, nombresRepetidos, type DefAtributo } from './clases'
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
igual('una copla con dos diámetros no existe: no se adivina', proponerProducto(item('Fittings PPR', 'Unión recta', null, '32×20', 'pieza')), null)
igual('un fitting metálico no es PPR: queda sin clasificar', proponerProducto(item('Fittings metálicos', 'Codo bronce', null, '1/2"', 'pieza')), null)
igual('una herramienta queda sin clasificar', proponerProducto(item('Herramientas', 'Termofusora PPR', null, '20-63', 'pieza')), null)

grupo('Los errores de la primera propuesta con la lista real de Lvzhou')
const nombre = (descripcion: string, grupo: string, medida: string, familia = 'Fittings PPR') => proponerProducto(item(familia, descripcion, grupo, medida, 'pieza'))?.nombre ?? null
igual('tee reductora es una tee con diámetro 2, no una reducción', nombre('Tee reductora', 'Tee reducer', '25×20'), 'Tee reductora PPR 25×20')
igual('codo reductor es un codo con diámetro 2', nombre('Codo reductor', 'Elbow reducer', '32×25'), 'Codo 90° reductor PPR 32×25')
igual('copla reductora sí es una reducción', nombre('Copla reductora', 'Coupling reducer', '40×32'), 'Reducción PPR 40×32')
igual('unión americana es su propio tipo, no una copla', nombre('Unión americana plástica', 'Plastic union', '25'), 'Unión americana PPR 25')
igual('unión recta sigue siendo copla', nombre('Unión recta', 'Straight connector', '25'), 'Copla PPR 25')
igual('tapa (cap) y tapón (plug) son distintos', [nombre('Tapa', 'Cap', '20'), nombre('Tapón', 'Plug', '20')], ['Tapa PPR 20', 'Tapón PPR 20'])
igual('cruz, codo largo, curva S y puente se reconocen', [nombre('Cruz', 'Cross', '20'), nombre('Codo largo', 'Long elbow', '25'), nombre('Curva S', 'S Bend', '32'), nombre('Puente curvo', 'Bridge bending', '20')], ['Cruz PPR 20', 'Codo largo PPR 25', 'Curva S PPR 32', 'Puente PPR 20'])
igual('las pulgadas son rosca, no diámetro: tee hembra 32×1 es rosca de 1"', proponerProducto(item('Fittings metálicos', 'Tee hembra (PPR+inox)', 'Tee female adaptor', '32×1', 'pieza'))?.atributos, { material: 'PPR', union: 'termofusión', tipo: 'tee', dn: 32, rosca: 'hembra 1"', inserto: 'acero inoxidable' })
igual('adaptador hembra con inserto de bronce: terminal con rosca 1/2"', nombre('Adaptador hembra recto (PPR+bronce)', 'Straight female adaptor', '20×1/2', 'Fittings metálicos'), 'Terminal PPR hembra inserto bronce 20×1/2"')
igual('codo macho con inserto inox', nombre('Codo macho (PPR+inox)', 'Elbow male adaptor', '25×3/4', 'Fittings metálicos'), 'Codo 90° PPR macho inserto inox 25×3/4"')
igual('unión americana macho con inserto de bronce', nombre('Unión americana macho (PPR+bronce)', 'Male union adaptor', '20', 'Fittings metálicos'), 'Unión americana PPR macho inserto bronce 20')
igual('codo y tee hembra con soporte', [nombre('Codo hembra doble con soporte (PPR+bronce)', 'Joint female elbow', '20', 'Fittings metálicos'), nombre('Tee hembra doble con soporte (PPR+inox)', 'Joint female tee', '25', 'Fittings metálicos')], ['Codo con soporte PPR hembra inserto bronce 20', 'Tee con soporte PPR hembra inserto inox 25'])
igual('las válvulas no son fittings: quedan sin clasificar', [nombre('Válvula de bola doble unión (PPR+bronce)', 'Double coupling ball valve', '20', 'Válvulas'), nombre('Llave de paso doble (PPR+inox)', 'Double stop valve', '25', 'Válvulas')], [null, null])
igual('«tee de bajada» (downstream cock) es una llave: sin clasificar', nombre('Tee de bajada', 'Downstream cock', '25'), null)
igual('la abrazadera no es un fitting', nombre('Abrazadera U', 'U clamp', '20'), null)
igual('el tubo preaislado se reconoce como tubo', proponerProducto(item('Tubería PPR', 'Tubo PPR aislado', 'PPR Insulate pipe', '20x2.8', 'm'))?.nombre, 'Tubo PPR preaislado 20×2,8 PN16')
igual('el PE-RT no es PPR', proponerProducto(item('Tubería PE-RT', 'Tubo PE-RT calefacción por piso', 'PERT Underfloor', '16x2.0', 'm')), null)

grupo('Dos ítems del proveedor en el mismo producto')
const dos = [proponerProducto(item('Fittings PPR', 'Tee de bajada', 'Tee', '25', 'pieza')), proponerProducto(item('Fittings PPR', 'Tee igual', 'Equal tee', '25', 'pieza'))]
igual('se marcan para revisar', [...nombresRepetidos(dos)], ['Tee PPR 25'])

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
