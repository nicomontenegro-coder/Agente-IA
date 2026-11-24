/**
 * Los textos de la RFQ y de la orden de compra, con el formato estándar de
 * GESI (diseno/p2p.md). Cada documento sale en inglés, que es lo que lee el
 * proveedor, y en español, que es lo que revisa Nico. Nunca en otro idioma.
 *
 * Funciones puras: la pantalla, la hoja impresa y el agente usan las mismas
 * (regla 1 de Importa: un texto que aparece en dos lugares se arma en uno).
 */

import { textoCorreo, asuntoCorreo, type Pedido } from './pedido-cotizacion'

export type Idioma = 'en' | 'es'

// ───────────────────────── RFQ ─────────────────────────

/** Lo que el proveedor debe incluir en su respuesta: los 10 puntos del formato GESI. */
export const PIDE_RFQ: Record<Idioma, string[]> = {
  en: [
    'Unit price for each item, with currency.',
    'Incoterm and port of loading.',
    'Minimum order quantity (MOQ) and production lead time.',
    'Validity of the quotation.',
    'Acceptance of an irrevocable letter of credit (L/C) for the first shipment.',
    'Quality, compliance and management certificates (attached).',
    'Certificate of origin under the free trade agreement with Chile.',
    'Packing: size and weight per package, and quantity per 20\' and 40\' container.',
    'Warranty.',
    'Samples: availability and cost.'
  ],
  es: [
    'Precio unitario por producto, con moneda.',
    'Incoterm y puerto de carga.',
    'Cantidad mínima (MOQ) y plazo de producción.',
    'Validez de la oferta.',
    'Aceptación de carta de crédito irrevocable (L/C) para el primer embarque.',
    'Certificados de calidad, cumplimiento y gestión (adjuntos).',
    'Certificado de origen del tratado comercial con Chile.',
    'Embalaje: medidas y peso por bulto, y cantidad por contenedor de 20\' y 40\'.',
    'Garantía.',
    'Muestras: disponibilidad y costo.'
  ]
}

export interface DatosRfq {
  codigo: string | null
  tema: string
  incoterm: string
  lugar: string | null
  destino: string | null
  plazoRespuesta: Date | null
  lineas: { descripcion: string; especificacion: string | null; cantidad: number; unidad: string }[]
  contacto: string | null
  firmante: string
  empresa: string
}

const fechaEs = (d: Date) => new Intl.DateTimeFormat('es-CL', { day: 'numeric', month: 'long', year: 'numeric' }).format(d)
const cantidadEs = (x: number) => new Intl.NumberFormat('es-CL', { maximumFractionDigits: 3 }).format(x)

/** El texto listo para pegar en WhatsApp, el chat de Alibaba o un correo. */
export function textoRfq(d: DatosRfq, idioma: Idioma): { asunto: string; cuerpo: string } {
  if (idioma === 'en') {
    const p: Pedido = {
      codigo: d.codigo,
      tema: d.tema,
      incoterm: d.incoterm,
      puertoDestino: d.destino,
      plazoRespuesta: d.plazoRespuesta,
      certificadoOrigen: false,
      lineas: d.lineas.map((l) => ({ descripcion: l.descripcion, especificacion: l.especificacion, cantidad: l.cantidad, unidad: l.unidad })),
      pide: PIDE_RFQ.en,
      requisitos: d.lugar ? [`Preferred place of delivery: ${d.incoterm} ${d.lugar}`] : [],
      contacto: d.contacto,
      empresa: d.empresa,
      firmante: d.firmante
    }
    return { asunto: asuntoCorreo(p), cuerpo: textoCorreo(p) }
  }
  const partes: string[] = []
  partes.push(d.contacto?.trim() ? `Estimado/a ${d.contacto.trim()}:` : 'Estimados:')
  partes.push('')
  partes.push(`Les pedimos su mejor cotización para los siguientes productos${d.codigo ? ` (nuestra referencia ${d.codigo})` : ''}:`)
  partes.push('')
  d.lineas.forEach((l, i) => {
    partes.push(`${i + 1}. ${l.descripcion.trim()} — ${cantidadEs(l.cantidad)} ${l.unidad}`)
    if (l.especificacion?.trim()) partes.push(`   ${l.especificacion.trim()}`)
  })
  partes.push('')
  partes.push(`Incoterm: ${d.incoterm}${d.lugar ? ` ${d.lugar}` : ''} — indicar el puerto de carga`)
  if (d.destino) partes.push(`Destino: ${d.destino}`)
  if (d.plazoRespuesta) partes.push(`Responder antes del: ${fechaEs(d.plazoRespuesta)}`)
  partes.push('')
  partes.push('Por favor incluyan en su cotización:')
  for (const r of PIDE_RFQ.es) partes.push(`- ${r}`)
  partes.push('')
  if (d.codigo) partes.push(`Por favor citen nuestra referencia ${d.codigo} en su respuesta.`)
  partes.push('Gracias, quedamos atentos.')
  partes.push('')
  partes.push('Saludos,')
  partes.push(d.firmante)
  partes.push(d.empresa)
  const asunto = `Solicitud de cotización: ${d.tema.trim() || 'productos'}${d.codigo ? ` [${d.codigo}]` : ''}`
  return { asunto, cuerpo: partes.join('\n') }
}

// ───────────────────────── Orden de compra ─────────────────────────

export interface LineaOrden {
  cantidad: number
  precioUnitario: number
}

/** Subtotal, descuento y total. El descuento se escribe como 3, no 0,03. */
export function totalesOrden(lineas: LineaOrden[], descuentoPct: number | null): { subtotal: number; descuento: number; total: number } {
  const subtotal = redondear(lineas.reduce((a, l) => a + l.cantidad * l.precioUnitario, 0))
  const descuento = redondear(subtotal * Math.max(0, descuentoPct ?? 0) / 100)
  return { subtotal, descuento, total: redondear(subtotal - descuento) }
}

const redondear = (x: number) => Math.round(x * 100) / 100

export type FormaPago = 'CARTA_CREDITO' | 'TT'

/**
 * Las secciones 5 a 9 del formato de OC de GESI. El primer embarque con un
 * proveedor va siempre con carta de crédito; los siguientes, por T/T.
 */
export function condicionesOrden(
  o: { formaPago: FormaPago; anticipoPct: number | null; garantiaMeses: number | null; codigo: string | null },
  idioma: Idioma
): { titulo: string; lineas: string[] }[] {
  const ref = o.codigo ?? (idioma === 'en' ? 'this order' : 'esta orden')
  const anticipo = o.anticipoPct ?? 30
  if (idioma === 'en') {
    return [
      {
        titulo: 'Payment',
        lineas:
          o.formaPago === 'CARTA_CREDITO'
            ? ['Irrevocable letter of credit (L/C).', 'Payment against the approved inspection certificate and the shipping documents.']
            : [`T/T: ${anticipo}% advance, ${100 - anticipo}% balance.`, 'The balance is released against the approved inspection certificate and a copy of the shipping documents.']
      },
      {
        titulo: 'Pre-shipment inspection',
        lineas: ['General quality inspection by an agency appointed by GESI.', 'If the goods do not pass, the supplier corrects them at its own cost and they are inspected again.']
      },
      {
        titulo: 'Required documents',
        lineas: [
          'Commercial invoice, packing list, original bill of lading and inspection certificate.',
          'Certificate of origin under the free trade agreement with Chile, and quality certificates.',
          `Please quote ${ref} on every document.`
        ]
      },
      {
        titulo: 'Packing, marks and quality',
        lineas: [
          `Export packing, marked with ${ref}. Loading plan for mixed orders.`,
          'Goods must match the approved specifications and samples. Any change requires written approval before production.',
          ...(o.garantiaMeses ? [`Warranty: ${o.garantiaMeses} months against manufacturing defects.`] : [])
        ]
      },
      {
        titulo: 'Acceptance',
        lineas: ['Please confirm in writing the acceptance of this order, the shipment date and your bank details.']
      }
    ]
  }
  return [
    {
      titulo: 'Pago',
      lineas:
        o.formaPago === 'CARTA_CREDITO'
          ? ['Carta de crédito irrevocable (L/C).', 'Pago contra el certificado de inspección aprobado y los documentos de embarque.']
          : [`T/T: ${anticipo} % de anticipo y ${100 - anticipo} % de saldo.`, 'El saldo se libera contra el certificado de inspección aprobado y la copia de los documentos de embarque.']
    },
    {
      titulo: 'Inspección antes del embarque',
      lineas: ['Inspección de calidad general por una agencia que designa GESI.', 'Si no aprueba, el proveedor corrige a su costo y se vuelve a inspeccionar.']
    },
    {
      titulo: 'Documentos requeridos',
      lineas: [
        'Factura comercial, packing list, BL original y certificado de inspección.',
        'Certificado de origen del tratado comercial con Chile y certificados de calidad.',
        `Citar ${ref} en todos los documentos.`
      ]
    },
    {
      titulo: 'Embalaje, marcas y calidad',
      lineas: [
        `Embalaje de exportación, marcado con ${ref}. Plan de carga en pedidos mixtos.`,
        'Según especificaciones y muestras aprobadas. Todo cambio, por escrito antes de producir.',
        ...(o.garantiaMeses ? [`Garantía: ${o.garantiaMeses} meses contra defectos de fabricación.`] : [])
      ]
    },
    {
      titulo: 'Aceptación',
      lineas: ['El proveedor confirma por escrito la aceptación, la fecha de embarque y sus datos bancarios.']
    }
  ]
}

/** La forma de pago que corresponde: carta de crédito si es el primer embarque con ese proveedor. */
export const formaPagoSugerida = (embarquesPrevios: number): FormaPago => (embarquesPrevios === 0 ? 'CARTA_CREDITO' : 'TT')
