/**
 * Lee un número como se escribe en Chile: coma decimal y punto de miles.
 * «0,79» es 0,79; «2.000» es dos mil; «1.580,50» es mil quinientos ochenta
 * con cincuenta. Null si no es un número: nunca se adivina.
 */
export function leerNumero(v: string | null | undefined): number | null {
  const s = (v ?? '').trim().replace(/\s/g, '')
  if (s === '') return null
  let limpio = s
  if (s.includes(',')) limpio = s.replace(/\./g, '').replace(',', '.')
  else if (/^-?\d{1,3}(\.\d{3})+$/.test(s)) limpio = s.replace(/\./g, '')
  const n = Number(limpio)
  return Number.isFinite(n) ? n : null
}
