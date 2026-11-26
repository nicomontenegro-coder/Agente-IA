/**
 * De la medida de un tubo PPR (diámetro × espesor de pared) a su serie y PN.
 *
 *   SDR = diámetro ÷ espesor        serie S = (SDR − 1) ÷ 2
 *
 * El PN no lo adivina la IA: lo calcula esto con la tabla de la norma, y
 * siempre dice qué norma usó, porque el mismo tubo puede llamarse distinto en
 * otra (los catálogos chinos suelen nombrar las series por MPa).
 *
 * POR VERIFICAR con el texto de las normas antes de usarlo frente a clientes:
 * las series vienen de ISO 15874 y los PN de DIN 8077 (PP-R).
 */

export interface Serie {
  serie: string
  sdr: number
}

/** Series de tubos PP-R (ISO 15874): SDR nominal de cada una. */
export const SERIES_PPR: Serie[] = [
  { serie: 'S5', sdr: 11 },
  { serie: 'S4', sdr: 9 },
  { serie: 'S3.2', sdr: 7.4 },
  { serie: 'S2.5', sdr: 6 },
  { serie: 'S2', sdr: 5 }
]

/** PN de cada serie según la norma. Una serie que la norma no define queda sin PN. */
export const PN_POR_NORMA: Record<string, Record<string, string>> = {
  'DIN 8077': { S5: 'PN10', 'S3.2': 'PN16', 'S2.5': 'PN20' }
}

/** Cuánto puede alejarse el SDR real del nominal: las medidas comerciales están redondeadas. */
const TOLERANCIA = 0.06

export function leerMedida(especificacion: string | null): { diametro: number; espesor: number } | null {
  const m = especificacion?.trim().match(/^(\d+(?:[.,]\d+)?)\s*[×xX*]\s*(\d+(?:[.,]\d+)?)$/)
  if (!m) return null
  const diametro = Number(m[1].replace(',', '.'))
  const espesor = Number(m[2].replace(',', '.'))
  // Una pared de más de un cuarto del diámetro no es un tubo: es una reducción (32×20).
  if (!(espesor > 0) || espesor > diametro / 4) return null
  return { diametro, espesor }
}

export function pnDeTubo(especificacion: string | null, norma = 'DIN 8077'): { sdr: number; serie: string; pn: string | null; norma: string } | null {
  const m = leerMedida(especificacion)
  if (!m) return null
  const sdr = m.diametro / m.espesor
  const serie = SERIES_PPR.find((s) => Math.abs(sdr - s.sdr) / s.sdr <= TOLERANCIA)
  if (!serie) return null
  return { sdr: Math.round(sdr * 10) / 10, serie: serie.serie, pn: PN_POR_NORMA[norma]?.[serie.serie] ?? null, norma }
}
