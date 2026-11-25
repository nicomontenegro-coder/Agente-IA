import 'server-only'

import Anthropic from '@anthropic-ai/sdk'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'
import { z } from 'zod'

import { INCOTERMS } from './incoterms'
import { lecturaDePrueba } from './lector-prueba'

/**
 * Leer la cotización en PDF de un proveedor, para no tipearla.
 *
 * Es lo único de la app donde un modelo gana: cada proveedor arma su
 * documento distinto y sacar de ahí precios, plazos y su cubicación es leer,
 * no aplicar una regla.
 *
 * **Propone, no guarda.** Lo leído se muestra al lado del PDF, con las
 * cuentas rehechas por la app (lectura.ts), y una persona lo acepta. Un precio
 * mal leído que entra solo a una orden de compra es el error que no se puede
 * permitir.
 */

/**
 * GESI_LECTOR_PRUEBA=1 devuelve la cotización de Ridge sin llamar a la API:
 * sirve para probar la pantalla donde no hay clave.
 */
const dePrueba = () => process.env.GESI_LECTOR_PRUEBA === '1'

/** Sin clave no hay lectura: la pantalla solo adjunta el PDF en vez de fallar. */
export const hayLectorIa = (): boolean => dePrueba() || Boolean(process.env.ANTHROPIC_API_KEY)

/** El modelo es una decisión de plata, no de código: se cambia sin desplegar. */
const MODELO = process.env.GESI_MODELO_IA ?? 'claude-opus-5-5'

const Lectura = z.object({
  proveedor: z.string().nullable().describe('Nombre de la empresa que cotiza, tal como aparece en el membrete'),
  proveedorPais: z.string().nullable().describe('País del proveedor según su dirección, en español: China, Turquía…'),
  contacto: z.string().nullable().describe('Persona que firma o aparece como vendedor'),
  email: z.string().nullable().describe('Correo del proveedor'),
  telefono: z.string().nullable().describe('Teléfono, móvil, WeChat o WhatsApp'),
  referencia: z.string().nullable().describe('Número o referencia de la cotización. Null si no tiene'),
  fecha: z.string().nullable().describe('Fecha del documento, AAAA-MM-DD'),
  moneda: z.string().nullable().describe('Código de tres letras: USD, EUR, CNY'),
  incoterm: z.string().nullable().describe(`El incoterm del TOTAL, uno de: ${INCOTERMS.join(', ')}. Null si no lo dice`),
  lugar: z.string().nullable().describe('Puerto o ciudad del incoterm del total, por ejemplo "Xiamen"'),
  subtotal: z.number().nullable().describe('Suma de los ítems tal como la escribe el documento (por ejemplo el total EXW). Null si no la escribe'),
  gastosHastaFob: z.number().nullable().describe('Gastos cotizados aparte para llegar a puerto (FOB cost, inland freight). Null si no hay'),
  total: z.number().nullable().describe('El total final que escribe el documento'),
  validezDias: z.number().nullable().describe('Días de validez de la oferta. Null si no lo dice'),
  leadTimeDias: z.number().nullable().describe('Días hasta el embarque. Si da un rango, el mayor, y anota el rango en dudas'),
  condicionesPago: z.string().nullable().describe('Condiciones de pago tal como las escribe'),
  aceptaCartaCredito: z
    .boolean()
    .nullable()
    .describe('True solo si menciona L/C o carta de crédito como forma aceptada; false si la rechaza o exige otra forma excluyente; null si no la menciona'),
  moq: z.string().nullable().describe('Cantidad mínima de pedido, si aparece'),
  noIncluye: z.string().nullable().describe('Lo que el documento dice que NO incluye el precio (instalación, fundaciones…)'),
  desglose: z
    .array(
      z.object({
        descripcion: z.string().describe('Descripción corta del ítem, en el idioma del documento'),
        unidad: z.string().nullable(),
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

export type LecturaCotizacion = z.infer<typeof Lectura>

const INSTRUCCIONES = `Lees cotizaciones de proveedores para GESI, un importador chileno.

Extrae solo lo que el documento dice:
- Si un dato no aparece, es null. No lo completes con lo habitual.
- Los números tal cual: no conviertas monedas, no apliques descuentos, no recalcules montos. La app rehace las cuentas y avisa si no cuadran; si corriges un monto, esconde un error del documento.
- La cita tiene que ser texto literal del documento.
- Cuando GESI pidió un solo conjunto (por ejemplo, un galpón completo) y el proveedor lo desglosa en piezas, el precio de esa línea es el total que el documento declara para el conjunto, y las piezas van en el desglose.
- Anota en dudas lo ambiguo: un rango de plazos, un monto "estimado", impuestos incluidos.`

export interface LineaPedida {
  id: string
  descripcion: string
  cantidad: number
  unidad: string
}

export type ResultadoLectura = { ok: true; lectura: LecturaCotizacion } | { ok: false; error: string }

export async function leerCotizacion(pdfBase64: string, pedido: LineaPedida[]): Promise<ResultadoLectura> {
  if (dePrueba()) return { ok: true, lectura: lecturaDePrueba(pedido) }
  if (!hayLectorIa()) return { ok: false, error: 'Falta la clave de la API en el servidor' }

  const lineas = pedido.map((l) => `- id ${l.id}: ${l.descripcion} — ${l.cantidad} ${l.unidad}`).join('\n')
  try {
    const client = new Anthropic()
    const r = await client.messages.parse({
      model: MODELO,
      max_tokens: 16000,
      system: INSTRUCCIONES,
      output_config: { format: zodOutputFormat(Lectura) },
      messages: [
        {
          role: 'user',
          content: [
            { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: pdfBase64 } },
            { type: 'text', text: `GESI pidió cotización de estas líneas:\n${lineas}\n\nLee la cotización y extrae lo que pide el esquema.` }
          ]
        }
      ]
    })
    // Antes de leer el contenido: una negativa llega como respuesta normal.
    if (r.stop_reason === 'refusal') return { ok: false, error: 'El modelo no quiso procesar este documento. Copia los datos a mano.' }
    if (r.stop_reason === 'max_tokens') return { ok: false, error: 'El documento es muy largo y la lectura se cortó.' }
    if (!r.parsed_output) return { ok: false, error: 'No se pudo entender la lectura. Copia los datos a mano.' }
    // Un id que la IA inventó no corresponde a nada: se descarta.
    const ids = new Set(pedido.map((l) => l.id))
    const lectura = { ...r.parsed_output, preciosPorLinea: r.parsed_output.preciosPorLinea.filter((p) => ids.has(p.lineaId)) }
    return { ok: true, lectura }
  } catch (e) {
    // La lectura es una ayuda, no el único camino: nunca revienta la pantalla.
    if (e instanceof Anthropic.AuthenticationError) return { ok: false, error: 'La clave de la API no es válida. Revísala en el servidor.' }
    if (e instanceof Anthropic.PermissionDeniedError) return { ok: false, error: 'La clave no tiene permiso, o la cuenta no tiene saldo.' }
    if (e instanceof Anthropic.RateLimitError) return { ok: false, error: 'Demasiadas lecturas seguidas o se acabó el saldo. Reintenta en un momento.' }
    if (e instanceof Anthropic.BadRequestError) return { ok: false, error: 'La API rechazó el archivo: puede estar dañado o ser muy grande.' }
    if (e instanceof Anthropic.APIConnectionError) return { ok: false, error: 'No se pudo conectar con la API. Revisa la salida a internet del servidor.' }
    if (e instanceof Anthropic.APIError) return { ok: false, error: `El servicio respondió con un error (${e.status}). Reintenta en un rato.` }
    return { ok: false, error: 'No se pudo leer el documento. Copia los datos a mano.' }
  }
}
