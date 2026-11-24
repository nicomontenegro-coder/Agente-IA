/**
 * Un comparador mínimo para las pruebas: sin dependencias, salida legible y
 * código de salida distinto de cero si algo falla (así `npm test` se detiene).
 */

let pasadas = 0
let fallidas = 0

export function igual(nombre: string, actual: unknown, esperado: unknown, tol = 0.005) {
  const ok =
    typeof actual === 'number' && typeof esperado === 'number'
      ? Math.abs(actual - esperado) < tol
      : JSON.stringify(actual) === JSON.stringify(esperado)
  if (ok) {
    pasadas++
    console.log(`  ✓ ${nombre}`)
  } else {
    fallidas++
    console.log(`  ✗ ${nombre}: esperaba ${JSON.stringify(esperado)}, obtuve ${JSON.stringify(actual)}`)
  }
}

export function grupo(nombre: string) {
  console.log(`\n${nombre}`)
}

export function terminar() {
  console.log(`\n${pasadas} pasadas, ${fallidas} fallidas`)
  if (fallidas > 0) process.exit(1)
}
