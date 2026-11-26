/**
 * Las dudas de una lectura, convertidas en preguntas con respuesta.
 *
 * Una duda escrita («plazo 30-45 días») obliga a la persona a interpretarla y
 * corregir el campo a mano. Una pregunta con opciones se responde con un clic
 * y la respuesta llena el campo. Solo se pregunta lo que mueve un número o una
 * decisión; lo demás queda como nota.
 *
 * Funciones puras: reciben la lectura y devuelven otra.
 */

/** Los campos que una respuesta puede llenar. */
export const CAMPOS_PREGUNTABLES = ['leadTimeDias', 'validezDias', 'gastosHastaFob', 'total', 'subtotal', 'aceptaCartaCredito'] as const
export type CampoPreguntable = (typeof CAMPOS_PREGUNTABLES)[number]

export interface Pregunta {
  campo: CampoPreguntable
  pregunta: string
  opciones: { etiqueta: string; valor: string }[]
}

/** Lo que de una lectura toca responder una pregunta. */
export interface Respondible {
  leadTimeDias: number | null
  validezDias: number | null
  gastosHastaFob: number | null
  total: number | null
  subtotal: number | null
  aceptaCartaCredito: boolean | null
  preciosPorLinea: { lineaId: string; precioUnitario: number | null; montoTotal?: number | null; unidad?: string | null; cita: string }[]
  preguntas: Pregunta[]
  dudas: string[]
  /** Lo que la persona decidió, para que quede escrito de dónde sale cada número. */
  respuestas?: string[]
}

type Resultado<T> = { ok: true; lectura: T } | { ok: false; error: string }

const fmt = (x: number) => new Intl.NumberFormat('es-CL', { maximumFractionDigits: 6 }).format(x)
/** Número en formato chileno o internacional: «1.400», «0,311», «45». */
function numeroDe(s: string): number | null {
  const t = s.trim().replace(/\s/g, '')
  if (!/^-?[\d.,]+$/.test(t)) return null
  const normal = t.includes(',') ? t.replace(/\./g, '').replace(',', '.') : /^\d{1,3}(\.\d{3})+$/.test(t) ? t.replace(/\./g, '') : t
  const n = Number(normal)
  return Number.isFinite(n) ? n : null
}

export function aplicarRespuesta<T extends Respondible>(lectura: T, indice: number, valor: string): Resultado<T> {
  const p = lectura.preguntas[indice]
  if (!p) return { ok: false, error: 'La pregunta ya fue respondida' }
  if (!CAMPOS_PREGUNTABLES.includes(p.campo)) return { ok: false, error: 'Esa pregunta no se puede aplicar' }
  let nuevo: number | boolean
  if (p.campo === 'aceptaCartaCredito') {
    const v = valor.trim().toUpperCase()
    if (v !== 'SI' && v !== 'NO') return { ok: false, error: 'Responde sí o no' }
    nuevo = v === 'SI'
  } else {
    const n = numeroDe(valor)
    if (n == null || n < 0) return { ok: false, error: 'Ingresa un número' }
    nuevo = n
  }
  const etiqueta = p.opciones.find((o) => o.valor === valor)?.etiqueta ?? valor.trim()
  return {
    ok: true,
    lectura: {
      ...lectura,
      [p.campo]: nuevo,
      preguntas: lectura.preguntas.filter((_, k) => k !== indice),
      respuestas: [...(lectura.respuestas ?? []), `${p.pregunta} → ${etiqueta}`]
    }
  }
}

/**
 * El documento cobra por metro y GESI pide por unidad: con cuántos metros
 * tiene cada unidad, el precio se pasa a la unidad pedida.
 */
export function convertirUnidad<T extends Respondible>(lectura: T, lineaId: string, factor: number | null, unidadPedida: string): Resultado<T> {
  const i = lectura.preciosPorLinea.findIndex((p) => p.lineaId === lineaId)
  const p = lectura.preciosPorLinea[i]
  if (!p || p.precioUnitario == null) return { ok: false, error: 'Esa línea no tiene precio unitario que convertir' }
  const unidadDoc = p.unidad ?? 'unidad del documento'
  if (factor == null || !(factor > 0)) return { ok: false, error: `Ingresa cuántos ${unidadDoc} tiene cada ${unidadPedida}` }
  const nuevo = Math.round(p.precioUnitario * factor * 1e6) / 1e6
  const precios = lectura.preciosPorLinea.map((x, k) => (k === i ? { ...x, precioUnitario: nuevo, unidad: unidadPedida } : x))
  return {
    ok: true,
    lectura: {
      ...lectura,
      preciosPorLinea: precios,
      respuestas: [...(lectura.respuestas ?? []), `Precio convertido: ${fmt(p.precioUnitario)} por ${unidadDoc} × ${fmt(factor)} ${unidadDoc} por ${unidadPedida} = ${fmt(nuevo)} por ${unidadPedida}`]
    }
  }
}
