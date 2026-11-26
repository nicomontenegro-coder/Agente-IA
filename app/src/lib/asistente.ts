import 'server-only'

import Anthropic from '@anthropic-ai/sdk'
import { betaZodTool } from '@anthropic-ai/sdk/helpers/beta/zod'
import { z } from 'zod'

import { db } from './db'
import { hayLectorIa } from './leer-cotizacion'
import { pnDeTubo, PN_POR_NORMA } from './normas-ppr'
import { precioVenta } from './lista-venta'
import { prepararCambios, CAMPOS_EDITABLES, type Cambio } from './propuestas'

/**
 * El asistente de la pantalla Precios: un agente con herramientas.
 *
 * El modelo conversa y decide qué herramienta usar; las herramientas corren
 * aquí, en el servidor, contra la base de GESI. Dos reglas que no dependen de
 * lo que el modelo decida:
 *   - Las cuentas las hacen las herramientas (PN, precio de venta), nunca el
 *     modelo de cabeza.
 *   - El asistente no escribe en la base: deja propuestas que Nico aprueba.
 *
 * Se usa el tool runner del SDK (y no un agente alojado afuera) porque las
 * herramientas tienen que leer la base local de la app.
 */

const MODELO = process.env.GESI_MODELO_IA ?? 'claude-opus-5-5'

const INSTRUCCIONES = `Eres el asistente de GESI SpA, importadora chilena, en la pantalla de una lista de precios de proveedor.

- Responde en español, breve y en tono de aplicación de negocios.
- Nunca calcules de cabeza: el PN lo calcula calcular_pn y el precio de venta calcular_precio_venta. Si una herramienta no da un dato, dilo; no lo inventes.
- Siempre di según qué norma es un PN. Si un tubo no tiene PN en la norma, dilo así.
- No puedes modificar datos: usa proponer_cambios y avisa que la propuesta queda esperando aprobación en la pantalla.
- Para conocer los productos, usa ver_lista. Los ids de producto salen de ahí.`

export const contextoLista = (listaId: string) => `lista:${listaId}`

// ── Las herramientas, como funciones normales ──

async function verLista(listaId: string) {
  const l = await db.listaPrecios.findUnique({ where: { id: listaId }, include: { proveedor: true, items: { orderBy: { posicion: 'asc' } } } })
  if (!l) return 'No existe la lista.'
  return JSON.stringify({
    proveedor: l.proveedor.nombre,
    fecha: l.fecha.toISOString().slice(0, 10),
    validezDias: l.validezDias,
    moneda: l.moneda,
    incoterm: l.incoterm,
    lugar: l.lugar,
    productos: l.items.map((i) => ({ id: i.id, familia: i.familia, descripcion: i.descripcion, especificacion: i.especificacion, unidad: i.unidad, precio: i.precio, pn: i.pn }))
  })
}

function calcularPn(especificaciones: string[], norma: string) {
  return JSON.stringify(
    especificaciones.map((e) => {
      const r = pnDeTubo(e, norma)
      return r ? { especificacion: e, ...r } : { especificacion: e, resultado: 'No es una medida de tubo o no calza con ninguna serie' }
    })
  )
}

async function proponerCambios(listaId: string, descripcion: string, cambios: Cambio[]) {
  const items = await db.listaPreciosItem.findMany({ where: { listaId } })
  const r = prepararCambios(cambios, items)
  if (!r.ok) return `No se pudo proponer: ${r.error}`
  await db.propuesta.create({ data: { contexto: contextoLista(listaId), descripcion, cambios: JSON.stringify(r.cambios) } })
  return `Propuesta creada con ${r.cambios.length} cambios. Queda esperando la aprobación de Nico en la pantalla.`
}

function herramientas(listaId: string) {
  return [
    betaZodTool({
      name: 'ver_lista',
      description: 'Devuelve la lista de precios abierta: proveedor, fecha, condiciones y todos sus productos con id, familia, descripción, especificación, unidad, precio y PN.',
      inputSchema: z.object({}),
      run: () => verLista(listaId)
    }),
    betaZodTool({
      name: 'calcular_pn',
      description: 'Calcula SDR, serie y PN de tubos PPR a partir de su especificación «diámetro×espesor» (por ejemplo «20×2.8»), según la norma indicada.',
      inputSchema: z.object({
        especificaciones: z.array(z.string()).describe('Especificaciones tal como aparecen en la lista'),
        norma: z.enum(Object.keys(PN_POR_NORMA) as [string, ...string[]]).describe('Norma para el PN')
      }),
      run: (i) => calcularPn(i.especificaciones, i.norma)
    }),
    betaZodTool({
      name: 'calcular_precio_venta',
      description: 'Calcula landed estimado y precio de venta neto en pesos: FOB × factor × tipo de cambio ÷ (1 − margen).',
      inputSchema: z.object({
        fob: z.number(),
        factor: z.number().describe('Factor de internación, por ejemplo 1.45'),
        margenPct: z.number().describe('Margen sobre el precio, en %, por ejemplo 35'),
        tipoCambio: z.number().describe('Pesos por dólar')
      }),
      run: (i) => JSON.stringify(precioVenta(i.fob, { factor: i.factor, margenPct: i.margenPct }, i.tipoCambio) ?? 'Datos incompletos o fuera de rango')
    }),
    betaZodTool({
      name: 'proponer_cambios',
      description: 'Propone cambios a productos de la lista (no los aplica). Nico los aprueba o descarta en la pantalla.',
      inputSchema: z.object({
        descripcion: z.string().describe('Qué hace la propuesta, en una línea'),
        cambios: z.array(z.object({ itemId: z.string(), campo: z.enum(CAMPOS_EDITABLES), valor: z.string() }))
      }),
      run: (i) => proponerCambios(listaId, i.descripcion, i.cambios)
    })
  ]
}

/** Las últimas vueltas de la conversación, alternando usuario y asistente como exige la API. */
async function historial(contexto: string) {
  const previos = await db.chatMensaje.findMany({ where: { contexto }, orderBy: { creadoEn: 'desc' }, take: 20 })
  const mensajes: { role: 'user' | 'assistant'; content: string }[] = []
  for (const m of previos.reverse()) {
    const role = m.rol === 'USUARIO' ? 'user' : 'assistant'
    const ultimo = mensajes[mensajes.length - 1]
    if (ultimo?.role === role) ultimo.content += `\n\n${m.texto}`
    else mensajes.push({ role, content: m.texto })
  }
  while (mensajes[0]?.role === 'assistant') mensajes.shift()
  return mensajes
}

export async function preguntarAsistente(listaId: string, texto: string): Promise<{ ok: true; respuesta: string } | { ok: false; error: string }> {
  if (!hayLectorIa()) return { ok: false, error: 'El asistente no está disponible en este servidor' }
  const contexto = contextoLista(listaId)
  const previos = await historial(contexto)
  if (process.env.GESI_LECTOR_PRUEBA === '1') return { ok: true, respuesta: await respuestaDePrueba(listaId, texto) }
  try {
    const client = new Anthropic()
    const final = await client.beta.messages.toolRunner({
      model: MODELO,
      max_tokens: 16000,
      thinking: { type: 'adaptive' },
      system: INSTRUCCIONES,
      tools: herramientas(listaId),
      max_iterations: 10,
      messages: [...previos, { role: 'user', content: texto }]
    })
    if (final.stop_reason === 'refusal') return { ok: false, error: 'El asistente no puede responder esa consulta.' }
    const respuesta = final.content.flatMap((b) => (b.type === 'text' ? [b.text] : [])).join('\n').trim()
    return { ok: true, respuesta: respuesta || 'Listo.' }
  } catch (e) {
    console.error('Asistente falló:', e instanceof Error ? e.message : e)
    if (e instanceof Anthropic.RateLimitError) return { ok: false, error: 'Demasiadas consultas seguidas o se acabó el saldo. Reintenta en un momento.' }
    if (e instanceof Anthropic.APIError) return { ok: false, error: `El servicio respondió con un error (${e.status}). Reintenta en un rato.` }
    return { ok: false, error: 'No se pudo responder. Reintenta en un rato.' }
  }
}

/** Sin API: usa las mismas herramientas para probar la pantalla. Solo entiende pedidos de PN. */
async function respuestaDePrueba(listaId: string, texto: string) {
  if (!/\bPN\b/i.test(texto)) return 'Modo de prueba: solo respondo pedidos de PN.'
  const lista = JSON.parse(await verLista(listaId)) as { productos: { id: string; especificacion: string | null; familia: string }[] }
  const tubos = lista.productos.filter((p) => p.especificacion && pnDeTubo(p.especificacion))
  const cambios = tubos.flatMap((t) => {
    const r = pnDeTubo(t.especificacion)!
    return r.pn ? [{ itemId: t.id, campo: 'pn' as const, valor: `${r.pn} (${r.norma})` }] : []
  })
  const sinPn = tubos.filter((t) => !pnDeTubo(t.especificacion)!.pn).map((t) => t.especificacion)
  const r = await proponerCambios(listaId, 'Agregar el PN según DIN 8077 a los tubos', cambios)
  return `${r}${sinPn.length ? ` Sin PN en DIN 8077: ${sinPn.join(', ')} (serie S4).` : ''}`
}
