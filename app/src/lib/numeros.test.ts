/** Pruebas de la lectura de números. Correr con:  npx tsx src/lib/numeros.test.ts */
import { leerNumero } from './numeros'
import { igual, grupo, terminar } from './prueba'

grupo('Números escritos en Chile')
igual('coma decimal', leerNumero('0,79'), 0.79)
igual('punto de miles sin coma es dos mil, no dos', leerNumero('2.000'), 2000)
igual('miles y decimales', leerNumero('1.580,50'), 1580.5)
igual('punto decimal sin miles se respeta', leerNumero('0.79'), 0.79)
igual('con espacios', leerNumero(' 2 000 '), 2000)
igual('vacío es null, no cero', leerNumero(''), null)
igual('texto no es número', leerNumero('pendiente'), null)
terminar()
