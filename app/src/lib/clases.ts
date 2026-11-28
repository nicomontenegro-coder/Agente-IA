/**
 * Clases de producto y sus atributos (estructura UNSPSC a escala GESI).
 *
 * Una clase (Tubo, Fitting) tiene una lista fija de atributos; los que solo
 * aplican a algunos tipos («diámetro 2» solo en reducciones y tees) se
 * exigen con una regla, no con otra clase. La definición de las clases vive
 * en la base (es dato, se corrige sin programar); aquí están las funciones
 * que la aplican.
 *
 * Funciones puras.
 */

import { leerMedida, pnDe } from './normas-ppr'

export interface DefAtributo {
  clave: string
  nombre: string
  /** NUMERO, OPCION o TEXTO. */
  tipo: string
  unidad: string | null
  /** Para OPCION: los valores posibles, separados por coma. */
  opciones: string | null
  /** «tipo=reducción,tee»: el atributo solo aplica (y se exige) si el tipo es uno de esos. */
  soloSi: string | null
  obligatorio: boolean
}

export type Atributos = Record<string, string | number | null>

/** Si un atributo aplica a un producto, según su regla «soloSi». */
export function aplica(def: DefAtributo, valores: Atributos): boolean {
  if (!def.soloSi) return true
  const [clave, lista] = def.soloSi.split('=')
  const valor = String(valores[clave.trim()] ?? '').toLowerCase()
  return lista.split(',').some((v) => v.trim().toLowerCase() === valor)
}

/** Lo que falta o sobra en los atributos de un producto, según su clase. */
export function validarAtributos(defs: DefAtributo[], valores: Atributos): string[] {
  const problemas: string[] = []
  for (const d of defs) {
    const v = valores[d.clave]
    const vacio = v == null || v === ''
    if (!aplica(d, valores)) {
      if (!vacio) problemas.push(`«${d.nombre}» no aplica a este tipo`)
      continue
    }
    if (vacio) {
      if (d.obligatorio) problemas.push(`Falta «${d.nombre}»`)
      continue
    }
    if (d.tipo === 'NUMERO' && !(typeof v === 'number' && v > 0)) problemas.push(`«${d.nombre}» debe ser un número mayor que cero`)
    if (d.tipo === 'OPCION' && d.opciones && !d.opciones.split(',').map((o) => o.trim()).includes(String(v))) {
      problemas.push(`«${d.nombre}» debe ser uno de: ${d.opciones}`)
    }
  }
  return problemas
}

/**
 * Cómo escriben los proveedores cada tipo de fitting. Es dato: esta lista es
 * solo la semilla de la base, y desde ahí se corrige en Ajustes sin programar.
 * El orden importa: va primero lo más específico («tee reductora» antes que
 * «reducción», «copla reductora» antes que «copla»). Un sinónimo con valor
 * vacío excluye: válvulas, llaves y herramientas no son fittings.
 */
export interface Sinonimo {
  valor: string
  patron: string
  prioridad: number
}

export const SINONIMOS_BASE: Sinonimo[] = [
  { valor: '', patron: 'v[aá]lvula|valve|llave|\\bcock\\b|abrazadera|clamp|termofusora|fusion machine|tijera|scissors|colector|manifold|filtro|filter|pe-?rt', prioridad: 0 },
  { valor: 'tee con soporte', patron: 'tee.*soporte|joint female tee', prioridad: 10 },
  { valor: 'codo con soporte', patron: 'codo.*soporte|joint female elbow', prioridad: 11 },
  { valor: 'cruz', patron: '\\bcruz\\b|\\bcross\\b', prioridad: 20 },
  { valor: 'tee', patron: '\\btee\\b', prioridad: 21 },
  { valor: 'codo largo', patron: 'codo largo|long elbow', prioridad: 30 },
  { valor: 'curva S', patron: 'curva s\\b|s bend', prioridad: 31 },
  { valor: 'puente', patron: 'puente|bridge', prioridad: 32 },
  { valor: 'codo 45°', patron: 'codo 45|45 ?° ?elbow', prioridad: 33 },
  { valor: 'codo 90°', patron: 'codo 90|90 ?° ?elbow|codo reductor|elbow reducer|codo (hembra|macho)|elbow (female|male)', prioridad: 34 },
  { valor: 'reducción', patron: 'copla reductora|coupling reducer|reducci[oó]n|reducer', prioridad: 40 },
  { valor: 'unión americana', patron: 'uni[oó]n americana|\\bunion\\b', prioridad: 41 },
  { valor: 'copla', patron: 'uni[oó]n recta|straight connector|copla|coupling|socket', prioridad: 42 },
  { valor: 'terminal', patron: 'adaptador|adaptor|adapter|terminal', prioridad: 50 },
  { valor: 'tapa', patron: '\\btapa\\b|\\bcap\\b', prioridad: 60 },
  { valor: 'tapón', patron: 'tap[oó]n|\\bplug\\b', prioridad: 61 }
]

/** Los tipos posibles: los valores de los sinónimos. */
export const TIPOS_FITTING = [...new Set(SINONIMOS_BASE.map((x) => x.valor).filter(Boolean))]

/** Diámetros nominales de PPR en mm: un segundo número fuera de esta lista no es un diámetro. */
const DN_PPR = [16, 20, 25, 32, 40, 50, 63, 75, 90, 110, 125, 160]

export interface ItemProveedor {
  familia: string
  descripcion: string
  grupo: string | null
  especificacion: string | null
  unidad: string
}

export interface Propuesta {
  clase: 'Tubo' | 'Fitting'
  modelo: string
  nombre: string
  atributos: Atributos
}

const material = (i: ItemProveedor) => (/PPR/i.test(`${i.familia} ${i.descripcion} ${i.grupo ?? ''}`) ? 'PPR' : null)

/** El tipo de fitting según los sinónimos (en orden de prioridad). Vacío si es algo que no es fitting. */
export function tipoDe(texto: string, sinonimos: Sinonimo[]): string | null {
  const s = [...sinonimos].sort((a, b) => a.prioridad - b.prioridad).find((x) => new RegExp(x.patron, 'i').test(texto))
  return s ? s.valor : null
}

/**
 * El producto GESI que corresponde a un ítem de una lista de proveedor. Solo
 * reconoce lo que puede afirmar: un tubo PPR con medida diámetro×espesor, o un
 * fitting PPR de un tipo conocido con su diámetro. Lo demás queda sin
 * clasificar (null) y se revisa a mano: no se adivina.
 */
export function proponerProducto(i: ItemProveedor, sinonimos: Sinonimo[] = SINONIMOS_BASE): Propuesta | null {
  if (material(i) !== 'PPR') return null
  const texto = `${i.descripcion} ${i.grupo ?? ''}`
  const tipo = tipoDe(texto, sinonimos)
  if (tipo === '') return null
  const m = leerMedida(i.especificacion)
  if (m && /m(etro|eter)?s?$/i.test(i.unidad.trim()) && /tub|pipe/i.test(texto)) {
    const pn = pnDe(i.especificacion)?.replace(/\s*\(.*\)$/, '')
    const aislacion = /preaisl|aislad|insulat|BWG/i.test(texto) ? 'preaislado' : 'desnudo'
    const esp = String(m.espesor).replace('.', ',')
    return {
      clase: 'Tubo',
      modelo: `Tubo PPR ${aislacion}${pn ? ` ${pn}` : ''}`,
      nombre: `Tubo PPR ${aislacion} ${m.diametro}×${esp}${pn ? ` ${pn}` : ''}`,
      atributos: { material: 'PPR', union: 'termofusión', dn: m.diametro, espesor: m.espesor, aislacion }
    }
  }
  if (!tipo) return null
  // Medidas: «20», «25×20» (dos diámetros) o «20×1/2» (diámetro y rosca en pulgadas).
  const medidas = i.especificacion?.match(/^\s*(\d+)\s*(?:[×xX*]\s*(\d+(?:\/\d+)?(?:[.,]\d+)?)\s*"?)?\s*$/)
  if (!medidas) return null
  const dn = Number(medidas[1])
  if (!DN_PPR.includes(dn)) return null
  const segunda = medidas[2] ?? null
  let dn2: number | null = null
  let pulgadas: string | null = null
  if (segunda) {
    const n = Number(segunda.replace(',', '.'))
    if (DN_PPR.includes(n) && n < dn) dn2 = n
    else if (segunda.includes('/') || n <= 4) pulgadas = segunda
    else return null
  }
  if (dn2 != null && !['reducción', 'tee', 'codo 90°'].includes(tipo)) return null
  if (tipo === 'reducción' && dn2 == null) return null
  const genero = /hembra|female/i.test(texto) ? 'hembra' : /macho|\bmale\b/i.test(texto) ? 'macho' : null
  const inserto = /inox|stainless/i.test(texto) ? 'acero inoxidable' : /bronce|brass|cobre|copper/i.test(texto) ? 'bronce' : null
  const rosca = genero || pulgadas ? [genero, pulgadas && `${pulgadas}"`].filter(Boolean).join(' ') : null

  const base = tipo.charAt(0).toUpperCase() + tipo.slice(1)
  const reducido = dn2 != null && tipo !== 'reducción' ? (tipo === 'tee' ? ' reductora' : ' reductor') : ''
  const modelo = [`${base}${reducido} PPR`, genero, inserto && `inserto ${inserto === 'acero inoxidable' ? 'inox' : inserto}`].filter(Boolean).join(' ')
  const medida = `${dn}${dn2 ? `×${dn2}` : ''}${pulgadas ? `×${pulgadas}"` : ''}`
  return {
    clase: 'Fitting',
    modelo,
    nombre: `${modelo} ${medida}`,
    atributos: { material: 'PPR', union: 'termofusión', tipo, dn, ...(dn2 ? { dn2 } : {}), ...(rosca ? { rosca } : {}), ...(inserto ? { inserto } : {}) }
  }
}

/**
 * Dos ítems de la misma lista que caen en el mismo producto GESI son un
 * error de reconocimiento (Tapa y Tapón, por ejemplo): se marcan para
 * revisar y no se enlaza ninguno.
 */
export function nombresRepetidos(propuestas: (Propuesta | null)[]): Set<string> {
  const vistos = new Map<string, number>()
  for (const p of propuestas) if (p) vistos.set(p.nombre, (vistos.get(p.nombre) ?? 0) + 1)
  return new Set([...vistos].filter(([, n]) => n > 1).map(([nombre]) => nombre))
}
