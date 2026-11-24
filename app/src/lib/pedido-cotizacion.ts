/**
 * El pedido de cotización (RFQ): lo que se le pide al proveedor.
 *
 * Acá vive lo que se puede probar sin base ni pantalla: qué líneas sirven,
 * cómo se llama el correo y cómo queda su texto. El documento impreso y el
 * texto para copiar en un correo dicen lo mismo porque salen de las mismas
 * piezas (regla 1).
 *
 * Va en inglés: se manda a fábricas extranjeras, igual que la orden de
 * compra. La pantalla donde se arma sigue en español.
 */

import { INCOTERM_LABEL, type Incoterm } from './incoterms'

export interface LineaPedido {
  descripcion: string
  especificacion?: string | null
  cantidad: number | null
  /** Cómo se escribe la unidad en el documento: «pcs», «m», «t». */
  unidad?: string | null
}

export interface Pedido {
  /** GESI-RFQ12, o null si todavía no se guardó. */
  codigo: string | null
  /** Para el asunto: de qué se trata, en pocas palabras. */
  tema: string
  incoterm: string
  puertoDestino?: string | null
  plazoRespuesta?: Date | null
  certificadoOrigen: boolean
  lineas: LineaPedido[]
  /** Lo que se le pide incluir en la respuesta, de Ajustes. */
  pide: string[]
  /** Requisitos propios de este pedido. */
  requisitos: string[]
  /** A quién se le escribe, si se sabe. */
  contacto?: string | null
  empresa?: string | null
  firmante?: string | null
}

// ── Validar ──────────────────────────────────────────────────────

/** Una línea sin descripción ni cantidad es una fila que quedó en blanco. */
export const lineaVacia = (l: LineaPedido) => l.descripcion.trim() === '' && (l.cantidad == null || l.cantidad === 0)

/** Los problemas de las líneas, todos de una vez, para corregirlos juntos. */
export function revisarPedido(lineas: LineaPedido[]): string[] {
  const utiles = lineas.filter((l) => !lineaVacia(l))
  if (utiles.length === 0) return ['Agrega al menos un producto con su cantidad.']
  const problemas: string[] = []
  lineas.forEach((l, i) => {
    if (lineaVacia(l)) return
    if (l.descripcion.trim() === '') problemas.push(`La línea ${i + 1} tiene cantidad pero no dice qué producto es.`)
    if (l.cantidad == null || !(l.cantidad > 0)) {
      problemas.push(`«${l.descripcion.trim() || `línea ${i + 1}`}» no tiene cantidad: sin ella el proveedor no puede cotizar.`)
    }
  })
  return problemas
}

// ── Las unidades, en inglés ──────────────────────────────────────

/**
 * Las unidades del catálogo están en español —«u», «Caja», «Plancha»—, y en
 * un pedido a una fábrica china «u» no se entiende. Las que tienen nombre
 * propio en inglés se traducen; las métricas se escriben igual; una que el
 * usuario haya creado y no esté acá queda con su símbolo, o su nombre.
 */
const UNIDAD_EN: Record<string, string> = {
  UN: 'pcs',
  CAJA: 'cartons',
  PAR: 'pairs',
  PLANCHA: 'sheets',
  TON: 't',
  LB: 'lb'
}

export function unidadEn(u: { codigo: string; nombre?: string | null; simbolo?: string | null } | null): string | null {
  if (!u) return null
  return UNIDAD_EN[u.codigo] ?? (u.simbolo?.trim() || u.nombre?.trim() || u.codigo.toLowerCase())
}

// ── El correo ────────────────────────────────────────────────────

const fechaEn = (d: Date) =>
  new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(d)

export const cantidadEn = (x: number) => new Intl.NumberFormat('en-US', { maximumFractionDigits: 3 }).format(x)

/** El incoterm como se lee en un pedido: «FOB (Free On Board)». */
export function incotermEn(incoterm: string): string {
  const nombre = INCOTERM_EN[incoterm as Incoterm]
  return nombre ? `${incoterm} (${nombre})` : incoterm
}

/** Los nombres oficiales en inglés: los de la app están en español. */
const INCOTERM_EN: Partial<Record<Incoterm, string>> = {
  EXW: 'Ex Works',
  FCA: 'Free Carrier',
  FAS: 'Free Alongside Ship',
  FOB: 'Free On Board',
  CFR: 'Cost and Freight',
  CIF: 'Cost, Insurance and Freight',
  CPT: 'Carriage Paid To',
  CIP: 'Carriage and Insurance Paid To',
  DAP: 'Delivered at Place',
  DPU: 'Delivered at Place Unloaded',
  DDP: 'Delivered Duty Paid'
}
// INCOTERM_LABEL se importa para que el compilador avise si cambia la lista.
void INCOTERM_LABEL

/**
 * El asunto lleva el código: así la respuesta se encuentra buscándolo en el
 * correo, y el lector de cotizaciones sabe a qué pedido responde.
 */
export function asuntoCorreo(p: Pedido): string {
  const codigo = p.codigo ? ` [${p.codigo}]` : ''
  return `Request for quotation: ${p.tema.trim() || 'products'}${codigo}`
}

/** Los términos que se piden, en el orden en que se leen. */
export function terminos(p: Pedido): { etiqueta: string; valor: string }[] {
  return [
    { etiqueta: 'Incoterm', valor: `${incotermEn(p.incoterm)} — please state the port of loading` },
    ...(p.puertoDestino ? [{ etiqueta: 'Destination', valor: p.puertoDestino }] : []),
    ...(p.plazoRespuesta ? [{ etiqueta: 'Please reply by', valor: fechaEn(p.plazoRespuesta) }] : []),
    ...(p.certificadoOrigen
      ? [
          {
            etiqueta: 'Certificate of origin',
            valor: 'Required: Form F under the Chile–China Free Trade Agreement'
          }
        ]
      : [])
  ]
}

/** El texto para pegar en un correo: lo mismo que la hoja impresa, sin diseño. */
export function textoCorreo(p: Pedido): string {
  const partes: string[] = []
  partes.push(p.contacto?.trim() ? `Dear ${p.contacto.trim()},` : 'Dear Sir or Madam,')
  partes.push('')
  partes.push(
    `We would like to receive your best quotation for the following products${p.codigo ? ` (our reference ${p.codigo})` : ''}:`
  )
  partes.push('')
  p.lineas
    .filter((l) => !lineaVacia(l))
    .forEach((l, i) => {
      const cantidad = l.cantidad != null ? `${cantidadEn(l.cantidad)}${l.unidad ? ` ${l.unidad}` : ''}` : ''
      partes.push(`${i + 1}. ${l.descripcion.trim()} — ${cantidad}`)
      if (l.especificacion?.trim()) partes.push(`   ${l.especificacion.trim().replace(/\n+/g, '\n   ')}`)
    })
  partes.push('')
  for (const t of terminos(p)) partes.push(`${t.etiqueta}: ${t.valor}`)
  if (p.requisitos.length > 0) {
    partes.push('')
    partes.push('Requirements:')
    for (const r of p.requisitos) partes.push(`- ${r}`)
  }
  if (p.pide.length > 0) {
    partes.push('')
    partes.push('Please include in your quotation:')
    for (const r of p.pide) partes.push(`- ${r}`)
  }
  partes.push('')
  if (p.codigo) partes.push(`Please quote our reference ${p.codigo} in your reply.`)
  partes.push('Thank you, and we look forward to hearing from you.')
  partes.push('')
  partes.push('Best regards,')
  if (p.firmante?.trim()) partes.push(p.firmante.trim())
  if (p.empresa?.trim()) partes.push(p.empresa.trim())
  return partes.join('\n')
}
