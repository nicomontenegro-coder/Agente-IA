import 'server-only'

import Anthropic from '@anthropic-ai/sdk'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'
import { EsquemaLectura, desdeIA, type LecturaCotizacion } from './lectura-esquema'
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

export type { LecturaCotizacion }

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
      output_config: { format: zodOutputFormat(EsquemaLectura) },
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
    const leido = desdeIA(r.parsed_output)
    const lectura = { ...leido, preciosPorLinea: leido.preciosPorLinea.filter((p) => ids.has(p.lineaId)) }
    return { ok: true, lectura }
  } catch (e) {
    // El motivo real queda en el registro del servidor (journalctl -u gesi):
    // el mensaje de pantalla dice qué hacer, pero sin esto no se sabe qué arreglar.
    console.error('Lectura de cotización falló:', e instanceof Error ? e.message : e)
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
