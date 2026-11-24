/**
 * Formateo de números y fechas en convención chilena:
 * punto para miles, coma para decimales.
 */

const DECIMALES_POR_MONEDA: Record<string, number> = {
  CLP: 0,   // los pesos no se usan con decimales
  JPY: 0,
  USD: 2,
  EUR: 2,
  CNY: 2
}

export function decimalesDe(moneda: string): number {
  return DECIMALES_POR_MONEDA[moneda] ?? 2
}

export function moneda(monto: number, codigo: string, decimales?: number): string {
  const d = decimales ?? decimalesDe(codigo)
  const n = new Intl.NumberFormat('es-CL', {
    minimumFractionDigits: d,
    maximumFractionDigits: d
  }).format(monto)
  return `${codigo} ${n}`
}

/** Sin el código de moneda, para columnas donde ya está en el encabezado. */
export function numero(monto: number, decimales = 2): string {
  return new Intl.NumberFormat('es-CL', {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales
  }).format(monto)
}

export function porcentaje(fraccion: number, decimales = 1): string {
  return `${numero(fraccion * 100, decimales)}%`
}

export function fecha(d: Date | string): string {
  const f = typeof d === 'string' ? new Date(d) : d
  return new Intl.DateTimeFormat('es-CL', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(f)
}

export function fechaCorta(d: Date | string): string {
  const f = typeof d === 'string' ? new Date(d) : d
  return new Intl.DateTimeFormat('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit'
  }).format(f)
}

/** "hace 3 días", "en 2 semanas" */
export function relativo(d: Date | string): string {
  const f = typeof d === 'string' ? new Date(d) : d
  const dias = Math.round((f.getTime() - Date.now()) / 86_400_000)
  const rtf = new Intl.RelativeTimeFormat('es-CL', { numeric: 'auto' })

  if (Math.abs(dias) < 30) return rtf.format(dias, 'day')
  if (Math.abs(dias) < 365) return rtf.format(Math.round(dias / 30), 'month')
  return rtf.format(Math.round(dias / 365), 'year')
}

/** Para un <input type="date">: "2026-09-19", en hora local. */
export function fechaInput(d: Date | string | null | undefined): string {
  if (!d) return ''
  const f = typeof d === 'string' ? new Date(d) : d
  const dos = (n: number) => String(n).padStart(2, '0')
  return `${f.getFullYear()}-${dos(f.getMonth() + 1)}-${dos(f.getDate())}`
}

/**
 * La unidad en plural cuando corresponde: "1 kilo", "2.450 kilos".
 *
 * La unidad la escribe el usuario, así que puede ser cualquier cosa: kilo,
 * caja, unidad, hora, litro, docena, pack. Se aplican las reglas del
 * castellano, que alcanzan para todas: vocal + s, consonante + es, la z pasa a
 * ces, y lo que ya viene en plural se deja quieto.
 */
export function plural(unidad: string, cantidad = 2): string {
  const u = unidad.trim()
  if (u === '' || Math.abs(cantidad) === 1) return u
  const irregulares: Record<string, string> = { mes: 'meses', pack: 'packs' }
  const fija = irregulares[u.toLowerCase()]
  if (fija) return u === u.toLowerCase() ? fija : fija[0].toUpperCase() + fija.slice(1)
  // Los símbolos de unidad no llevan plural: 5 kg, 28,2 m³, 3 t, 10 UN. Se
  // reconocen por ser de una o dos letras, por llevar algo que no es letra, o
  // por venir en mayúsculas, que es como se escriben los códigos.
  if (u.length <= 2 || /[^a-záéíóúüñ]/i.test(u) || u === u.toUpperCase()) return u
  const fin = u[u.length - 1].toLowerCase()
  // "kilos", "cajas" y "toneladas" ya vienen en plural: no se les suma otra s.
  if (fin === 's' || fin === 'x') return u
  if ('aeio'.includes(fin)) return `${u}s`
  if (fin === 'z') return `${u.slice(0, -1)}ces`
  // Vocal acentuada o consonante: "unidades", "menús".
  if ('áéíóúü'.includes(fin)) return `${u}es`
  return `${u}es`
}

/** "2.450 kilos": la cantidad con su unidad, ya concordada. */
export function conUnidad(cantidad: number, unidad: string, decimales = 0): string {
  return `${numero(cantidad, decimales)} ${plural(unidad, cantidad)}`
}
