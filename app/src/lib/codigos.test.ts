/**
 * Pruebas de los códigos y la numeración.
 * Correr con:  npx tsx src/lib/codigos.test.ts
 */

import { codigo, validarProximoNumero } from './codigos'
import { igual, grupo, terminar } from './prueba'

grupo('Códigos GESI')
igual('la OC 1001 se escribe GESI-OC1001', codigo('orden', 1001), 'GESI-OC1001')
igual('la compra 3 se escribe GESI-CP3', codigo('compra', 3), 'GESI-CP3')

grupo('Elegir el próximo número')
igual('sin órdenes emitidas, la OC puede partir en 1001', validarProximoNumero(1001, 0), null)
igual('se puede saltar hacia adelante', validarProximoNumero(2000, 1003), null)
igual('no puede bajar: repetiría un número', validarProximoNumero(1002, 1003), 'Debe ser mayor que 1003, el último número ya usado')
igual('tampoco repetir el último', validarProximoNumero(1003, 1003), 'Debe ser mayor que 1003, el último número ya usado')
igual('cero o decimales no', [validarProximoNumero(0, 0), validarProximoNumero(10.5, 0)], ['Ingresa un número entero mayor que cero', 'Ingresa un número entero mayor que cero'])

terminar()
