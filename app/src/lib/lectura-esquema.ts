import { z } from 'zod'

import { INCOTERMS } from './incoterms'

/**
 * Lo que se le pide a la IA que lea de una cotización.
 *
 * La API rechaza un esquema con más de 16 campos que admiten «vacío» (null):
 * cada uno multiplica el trabajo de armar la respuesta. El primero que se
 * escribió tenía 23 y la API devolvía 400 sin leer nada. Por eso los textos
 * vienen como "" cuando el documento no los dice, y solo los números y el sí/no
 * de la carta de crédito admiten null: ahí un 0 o un false inventado sí
 * cambiaría una decisión. La conversión a null va en `desdeIA`.
 */
const texto = (que: string) => z.string().describe(`${que}. Cadena vacía si el documento no lo dice`)

export const EsquemaLectura = z.object({
  proveedor: texto('Nombre de la empresa que cotiza, tal como aparece en el membrete'),
  proveedorPais: texto('País del proveedor según su dirección, en español: China, Turquía…'),
  contacto: texto('Persona que firma o aparece como vendedor'),
  email: texto('Correo del proveedor'),
  telefono: texto('Teléfono, móvil, WeChat o WhatsApp'),
  referencia: texto('Número o referencia de la cotización'),
  fecha: texto('Fecha del documento, AAAA-MM-DD'),
  moneda: texto('Código de tres letras: USD, EUR, CNY'),
  incoterm: texto(`El incoterm del TOTAL, uno de: ${INCOTERMS.join(', ')}`),
  lugar: texto('Puerto o ciudad del incoterm del total, por ejemplo "Xiamen"'),
  subtotal: z.number().nullable().describe('Suma de los ítems tal como la escribe el documento (por ejemplo el total EXW). Null si no la escribe'),
  gastosHastaFob: z.number().nullable().describe('Gastos cotizados aparte para llegar a puerto (FOB cost, inland freight). Null si no hay'),
  total: z.number().nullable().describe('El total final que escribe el documento. Null si no lo escribe'),
  validezDias: z.number().nullable().describe('Días de validez de la oferta. Null si no lo dice'),
  leadTimeDias: z.number().nullable().describe('Días hasta el embarque. Si da un rango, el mayor, y anota el rango en dudas. Null si no lo dice'),
  condicionesPago: texto('Condiciones de pago tal como las escribe'),
  aceptaCartaCredito: z
    .boolean()
    .nullable()
    .describe('True solo si menciona L/C o carta de crédito como forma aceptada; false si la rechaza o exige otra forma excluyente; null si no la menciona'),
  moq: texto('Cantidad mínima de pedido'),
  noIncluye: texto('Lo que el documento dice que NO incluye el precio (instalación, fundaciones…)'),
  desglose: z
    .array(
      z.object({
        descripcion: z.string().describe('Descripción corta del ítem, en el idioma del documento'),
        unidad: texto('Unidad: T, m, m2, set…'),
        cantidad: z.number().nullable(),
        precioUnitario: z.number().nullable(),
        monto: z.number().nullable().describe('El monto de la línea tal como aparece, sin recalcularlo')
      })
    )
    .describe('Cada ítem cotizado, en el orden del documento'),
  preciosPorLinea: z
    .array(
      z.object({
        lineaId: z.string().describe('El id de la línea de GESI a la que corresponde'),
        precioUnitario: z.number().describe('Precio por la unidad que pidió GESI'),
        cita: z.string().describe('Fragmento literal del documento de donde sale ese precio')
      })
    )
    .describe('El precio que corresponde a cada línea pedida por GESI. Omite las que el documento no cotiza'),
  dudas: z.array(z.string()).describe('Lo que no se pudo leer con seguridad o quedó ambiguo. Vacío si todo está claro')
})

type DeLaIA = z.infer<typeof EsquemaLectura>

/** Lo mismo, con null donde el documento no decía nada: así lo usa la app. */
export type LecturaCotizacion = {
  [K in Exclude<keyof DeLaIA, 'desglose'>]: DeLaIA[K] extends string ? string | null : DeLaIA[K]
} & { desglose: { descripcion: string; unidad: string | null; cantidad: number | null; precioUnitario: number | null; monto: number | null }[] }

const nulo = (s: string) => (s.trim() === '' ? null : s.trim())

export function desdeIA(r: DeLaIA): LecturaCotizacion {
  return {
    ...r,
    proveedor: nulo(r.proveedor),
    proveedorPais: nulo(r.proveedorPais),
    contacto: nulo(r.contacto),
    email: nulo(r.email),
    telefono: nulo(r.telefono),
    referencia: nulo(r.referencia),
    fecha: nulo(r.fecha),
    moneda: nulo(r.moneda),
    incoterm: nulo(r.incoterm),
    lugar: nulo(r.lugar),
    condicionesPago: nulo(r.condicionesPago),
    moq: nulo(r.moq),
    noIncluye: nulo(r.noIncluye),
    desglose: r.desglose.map((d) => ({ ...d, unidad: nulo(d.unidad) }))
  }
}

/** Cuántos campos admiten null en el esquema que se envía (el límite de la API es 16). */
export function camposQueAdmitenVacio(esquema: unknown): number {
  let n = 0
  const recorrer = (x: unknown) => {
    if (Array.isArray(x)) return x.forEach(recorrer)
    if (!x || typeof x !== 'object') return
    const o = x as Record<string, unknown>
    if (Array.isArray(o.anyOf) || Array.isArray(o.oneOf) || Array.isArray(o.type)) n++
    Object.values(o).forEach(recorrer)
  }
  recorrer(esquema)
  return n
}
