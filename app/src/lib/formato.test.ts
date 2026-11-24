import { plural, conUnidad, numero, porcentaje } from './formato'

let pasadas = 0
let fallidas = 0
function igual(nombre: string, dio: unknown, esperado: unknown) {
  const ok = dio === esperado
  if (ok) pasadas++
  else fallidas++
  console.log(`  ${ok ? '✓' : '✗'} ${nombre}: ${JSON.stringify(dio)}`)
  if (!ok) console.log(`    esperaba ${JSON.stringify(esperado)}`)
}

console.log('\nLa unidad concuerda con la cantidad')
igual('un kilo va en singular', conUnidad(1, 'kilo'), '1 kilo')
igual('dos millones y medio de kilos, no "kilo"', conUnidad(2_450_923, 'kilo'), '2.450.923 kilos')
igual('cero también va en plural', conUnidad(0, 'kilo'), '0 kilos')
igual('la caja hace cajas', plural('caja'), 'cajas')
igual('la unidad hace unidades', plural('unidad'), 'unidades')
igual('el mes hace meses', plural('mes'), 'meses')
igual('la hora hace horas', plural('hora'), 'horas')
igual('el litro hace litros', plural('litro'), 'litros')
igual('el pack hace packs, no "packes"', plural('pack'), 'packs')
igual('lo que ya viene en plural se deja quieto', plural('kilos'), 'kilos')
igual('la mayúscula se respeta', plural('Mes'), 'Meses')
igual('sin unidad no se inventa nada', plural(''), '')
igual('el menú hace menúes', plural('menú'), 'menúes')

console.log('\nLos símbolos de unidad no llevan plural')
igual('28,2 m³, no "m³es"', conUnidad(28.2, 'm³', 1), '28,2 m³')
igual('28.200 kg, no "kges"', conUnidad(28200, 'kg'), '28.200 kg')
igual('3 t, no "tes"', conUnidad(3, 't'), '3 t')
igual('10 UN, no "UNes"', conUnidad(10, 'UN'), '10 UN')
igual('pero la plancha sí hace planchas', conUnidad(478, 'plancha'), '478 planchas')

console.log('\nY sirve para contar cualquier cosa, no solo unidades')
igual('un producto, no "1 productos"', conUnidad(1, 'producto'), '1 producto')
igual('tres productos', conUnidad(3, 'producto'), '3 productos')
igual('un proveedor', conUnidad(1, 'proveedor'), '1 proveedor')
igual('dos proveedores', conUnidad(2, 'proveedor'), '2 proveedores')
igual('un código', conUnidad(1, 'código'), '1 código')
igual('diez mil códigos', conUnidad(10013, 'código'), '10.013 códigos')
igual('una cosa que comprar', conUnidad(1, 'cosa'), '1 cosa')
igual('una etapa', conUnidad(1, 'etapa'), '1 etapa')

console.log('\nNúmeros a la chilena')
igual('punto de miles', numero(1234567, 0), '1.234.567')
igual('coma decimal', numero(1234.5, 1), '1.234,5')
igual('los porcentajes se escriben como los lee la gente', porcentaje(0.1524), '15,2%')

console.log('\n' + '─'.repeat(50))
console.log(`${pasadas} pasadas, ${fallidas} fallidas`)
console.log('─'.repeat(50))
if (fallidas > 0) process.exit(1)
