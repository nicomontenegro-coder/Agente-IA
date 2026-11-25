/**
 * A quién corresponde una cotización leída: el PDF dice «Quanzhou Ridge
 * Steel Structure Co., Ltd.» y en la ficha quizás está «Ridge Steel». Se
 * sugiere, no se decide: crear un proveedor duplicado parte su historial
 * (embarques previos, carta de crédito) y eso cambia sus filtros.
 *
 * Funciones puras.
 */

/** Lo que dice la forma legal y no distingue a una empresa de otra. */
const RELLENO = new Set(['co', 'ltd', 'limited', 'company', 'inc', 'corp', 'corporation', 'llc', 'sa', 'spa', 'srl', 'gmbh', 'group', 'the', 'and', 'of', 'de'])

/** Correos gratuitos: el dominio no identifica a la empresa. */
const CORREO_GRATIS = new Set(['gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com', '163.com', '126.com', 'qq.com', 'foxmail.com', 'sina.com', 'aliyun.com', 'icloud.com', 'live.com'])

export function nucleoDelNombre(nombre: string): string[] {
  return nombre
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\b([a-z])\.(?=[a-z]\.)/g, '$1')
    .replace(/[^a-z0-9]+/g, ' ')
    .split(' ')
    .filter((p) => p.length > 1 && !RELLENO.has(p))
}

const dominio = (email: string | null | undefined) => {
  const d = email?.split('@')[1]?.trim().toLowerCase()
  return d && !CORREO_GRATIS.has(d) ? d : null
}

export interface Candidato {
  id: string
  nombre: string
  email: string | null
}

export interface Sugerencia {
  id: string
  nombre: string
  motivo: string
}

export function sugerirProveedores(leido: { nombre: string | null; email: string | null }, guardados: Candidato[]): Sugerencia[] {
  const dom = dominio(leido.email)
  const nucleo = leido.nombre ? nucleoDelNombre(leido.nombre) : []
  const resultado: (Sugerencia & { puntos: number })[] = []
  for (const p of guardados) {
    if (dom && dominio(p.email) === dom) {
      resultado.push({ id: p.id, nombre: p.nombre, motivo: `mismo dominio de correo (${dom})`, puntos: 2 })
      continue
    }
    const suyo = nucleoDelNombre(p.nombre)
    if (!suyo.length || !nucleo.length) continue
    // Todas las palabras del nombre guardado aparecen en el leído: «Ridge
    // Steel» dentro de «Quanzhou Ridge Steel Structure». Una sola en común
    // («pipes») no basta: es el rubro, no la empresa.
    const comunes = suyo.filter((x) => nucleo.includes(x))
    if (comunes.length === suyo.length && (comunes.length >= 2 || suyo.length === 1)) {
      resultado.push({ id: p.id, nombre: p.nombre, motivo: 'el nombre coincide', puntos: 1 })
    }
  }
  return resultado.sort((a, b) => b.puntos - a.puntos).map(({ id, nombre, motivo }) => ({ id, nombre, motivo }))
}
