import 'server-only'

import Anthropic from '@anthropic-ai/sdk'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'

import { EsquemaLista, listaDesdeIA, type LecturaLista } from './lista-esquema'
import { hayLectorIa } from './leer-cotizacion'

/**
 * Leer una lista de precios completa (un catálogo de varias páginas).
 *
 * A diferencia de una cotización, aquí se quiere todo: cada medida con su
 * precio. Un catálogo de 7 páginas son cientos de filas, así que la respuesta
 * llega en streaming (una sola respuesta larga sin streaming puede cortarse
 * por tiempo) y con un tope de salida amplio.
 */

const MODELO = process.env.GESI_MODELO_IA ?? 'claude-opus-5-5'

const INSTRUCCIONES = `Lees listas de precios de proveedores para GESI, un importador chileno.

- Extrae TODOS los productos, una fila por medida o especificación. No resumas ni omitas filas.
- Los precios tal cual: no conviertas monedas ni unidades. Si una celda de precio está vacía, precio es null.
- La unidad sale de las notas del documento («prices for pipes are per meter») o de la columna. Escríbela corta: m, pieza, kg.
- La familia es amplia y sirve para repartir el flete: separa lo voluminoso (tuberías) de lo compacto (fittings, válvulas). Usa pocas familias.
- Anota en dudas las condiciones que afectan precios (por ejemplo, precios de cobre a reconfirmar).`

export type ResultadoLista = { ok: true; lectura: LecturaLista } | { ok: false; error: string }

export async function leerLista(pdfBase64: string, nombreArchivo = ''): Promise<ResultadoLista> {
  if (process.env.GESI_LECTOR_PRUEBA === '1') {
    const { listaDePrueba } = await import('./lector-prueba')
    return { ok: true, lectura: listaDePrueba() }
  }
  if (!hayLectorIa()) return { ok: false, error: 'Lectura automática no disponible en este servidor' }
  try {
    const client = new Anthropic()
    const r = await client.messages
      .stream({
        model: MODELO,
        max_tokens: 64000,
        system: INSTRUCCIONES,
        output_config: { format: zodOutputFormat(EsquemaLista) },
        messages: [
          {
            role: 'user',
            content: [
              { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: pdfBase64 } },
              { type: 'text', text: 'Lee esta lista de precios completa y extrae lo que pide el esquema.' }
            ]
          }
        ]
      })
      .finalMessage()
    if (r.stop_reason === 'refusal') return { ok: false, error: 'El modelo no quiso procesar este documento.' }
    if (r.stop_reason === 'max_tokens') return { ok: false, error: 'La lista es demasiado larga para leerla de una vez. Divide el PDF en partes.' }
    if (!r.parsed_output) return { ok: false, error: 'No se pudo entender la lectura.' }
    return { ok: true, lectura: listaDesdeIA(r.parsed_output) }
  } catch (e) {
    console.error('Lectura de lista de precios falló:', e instanceof Error ? e.message : e)
    if (e instanceof Anthropic.AuthenticationError) return { ok: false, error: 'La clave de la API no es válida. Revísala en el servidor.' }
    if (e instanceof Anthropic.RateLimitError) return { ok: false, error: 'Demasiadas lecturas seguidas o se acabó el saldo. Reintenta en un momento.' }
    if (e instanceof Anthropic.BadRequestError) return { ok: false, error: 'La API rechazó el archivo: puede estar dañado o ser muy grande.' }
    if (e instanceof Anthropic.APIError) return { ok: false, error: `El servicio respondió con un error (${e.status}). Reintenta en un rato.` }
    return { ok: false, error: 'No se pudo leer el documento.' }
  }
}
