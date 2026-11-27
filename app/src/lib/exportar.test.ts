/**
 * Pruebas de la exportación a Excel.
 * Correr con:  npx tsx src/lib/exportar.test.ts
 */

import { aCsv, nombreArchivo } from './exportar'
import { igual, grupo, terminar } from './prueba'

grupo('Tabla a Excel')
igual(
  'separado por punto y coma, con coma decimal para que Excel lo sume',
  aCsv(['Producto', 'Medida', 'Precio USD'], [['Tubo PPR', '20×2.8', 0.311]]),
  'Producto;Medida;Precio USD\r\nTubo PPR;20×2.8;0,311'
)
igual('una celda vacía queda vacía', aCsv(['A', 'B'], [[null, 'x']]), 'A;B\r\n;x')
igual('un texto con punto y coma va entre comillas', aCsv(['Nota'], [['Pago: 30%; saldo contra BL']]), 'Nota\r\n"Pago: 30%; saldo contra BL"')
igual('las comillas internas se doblan', aCsv(['Nota'], [['Tubo "PN16"']]), 'Nota\r\n"Tubo ""PN16"""')
igual('un número entero no lleva decimales inventados', aCsv(['Precio'], [[4553]]), 'Precio\r\n4553')

grupo('Nombre del archivo')
igual('sin tildes ni espacios, con la fecha', nombreArchivo('Lista de Lvzhou · Fittings PPR', new Date('2026-11-28T12:00:00')), 'lista-de-lvzhou-fittings-ppr-2026-11-28.csv')

terminar()
