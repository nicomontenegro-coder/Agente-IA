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

/** Los tipos de fitting y cómo los escriben los proveedores. */
const TIPOS_FITTING: [string, RegExp][] = [
  ['codo 90°', /codo\s*90|90\s*°?\s*(elbow|codo)/i],
  ['codo 45°', /codo\s*45|45\s*°?\s*(elbow|codo)/i],
  ['reducción', /reduc/i],
  ['tee', /\btee\b|\bte\b/i],
  ['copla', /uni[oó]n|copla|coupling|connector|socket/i],
  ['terminal', /terminal|rosca|thread|adaptador|adapter/i],
  ['tapón', /tap[oó]n|\bcap\b|plug/i]
]

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

/**
 * El producto GESI que corresponde a un ítem de una lista de proveedor. Solo
 * reconoce lo que puede afirmar: un tubo PPR con medida diámetro×espesor, o un
 * fitting PPR de un tipo conocido con su diámetro. Lo demás queda sin
 * clasificar (null) y se revisa a mano: no se adivina.
 */
export function proponerProducto(i: ItemProveedor): Propuesta | null {
  if (material(i) !== 'PPR') return null
  const texto = `${i.descripcion} ${i.grupo ?? ''}`
  const m = leerMedida(i.especificacion)
  if (m && /m(etro|eter)?s?$/i.test(i.unidad.trim()) && /tub|pipe/i.test(texto)) {
    const pn = pnDe(i.especificacion)?.replace(/\s*\(.*\)$/, '')
    const aislacion = /preaisl|insulat|BWG/i.test(texto) ? 'preaislado' : 'desnudo'
    return {
      clase: 'Tubo',
      modelo: `Tubo PPR ${aislacion}${pn ? ` ${pn}` : ''}`,
      nombre: `Tubo PPR ${aislacion} ${m.diametro}×${String(m.espesor).replace('.', ',')}${pn ? ` ${pn}` : ''}`,
      atributos: { material: 'PPR', union: 'termofusión', dn: m.diametro, espesor: m.espesor, aislacion }
    }
  }
  const tipo = TIPOS_FITTING.find(([, re]) => re.test(texto))?.[0]
  const medidas = i.especificacion?.match(/^\s*(\d+(?:[.,]\d+)?)\s*(?:[×xX*]\s*(\d+(?:[.,]\d+)?))?\s*$/)
  if (!tipo || !medidas) return null
  const dn = Number(medidas[1].replace(',', '.'))
  const dn2 = medidas[2] ? Number(medidas[2].replace(',', '.')) : null
  // Un segundo diámetro solo tiene sentido en reducciones y tees reducidas.
  if (dn2 != null && tipo !== 'reducción' && tipo !== 'tee') return null
  const modelo = `${tipo.charAt(0).toUpperCase()}${tipo.slice(1)} PPR`
  return {
    clase: 'Fitting',
    modelo,
    nombre: `${modelo} ${dn}${dn2 ? `×${dn2}` : ''}`,
    atributos: { material: 'PPR', union: 'termofusión', tipo, dn, ...(dn2 ? { dn2 } : {}) }
  }
}
