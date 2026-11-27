/**
 * Importar clientes desde una tabla pegada (la que entrega Gemini, una
 * planilla o un CSV). Las columnas se leen por su nombre, así que no importa
 * el orden. No se usa IA: con columnas fijas, leer es exacto y gratis.
 *
 * Funciones puras.
 */

import { ETAPAS_CLIENTE, ETIQUETA_ETAPA } from './embudo'
import { posiblesDuplicados } from './duplicados-clientes'

export interface FilaCliente {
  nombre?: string | null
  rut?: string | null
  canal?: string | null
  ciudad?: string | null
  direccion?: string | null
  contacto?: string | null
  telefono?: string | null
  email?: string | null
  notas?: string | null
  etapa?: string | null
  proximaAccion?: string | null
}

const normal = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()

/** Cómo puede venir escrito cada encabezado. */
const ENCABEZADOS: Record<keyof FilaCliente, string[]> = {
  nombre: ['nombre', 'razon social', 'cliente', 'empresa'],
  rut: ['rut'],
  canal: ['tipo', 'canal', 'rubro', 'canal de venta'],
  ciudad: ['ciudad', 'comuna'],
  direccion: ['direccion'],
  contacto: ['contacto', 'persona de contacto'],
  telefono: ['telefono', 'fono', 'celular', 'whatsapp'],
  email: ['email', 'correo', 'e-mail', 'mail'],
  notas: ['notas', 'nota', 'observaciones', 'comentarios'],
  etapa: ['etapa', 'estado'],
  proximaAccion: ['proxima accion', 'proximaaccion', 'siguiente paso']
}

function campoDe(encabezado: string): keyof FilaCliente | null {
  const e = normal(encabezado)
  return (Object.keys(ENCABEZADOS) as (keyof FilaCliente)[]).find((k) => ENCABEZADOS[k].includes(e)) ?? null
}

export function leerTabla(texto: string): FilaCliente[] {
  const lineas = texto.split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !/^\|?[\s:-]+(\|[\s:-]+)+\|?$/.test(l))
  if (lineas.length < 2) return []
  const sep = lineas[0].includes('|') ? '|' : lineas[0].includes('\t') ? '\t' : lineas[0].includes(';') ? ';' : ','
  const partir = (l: string) => {
    const celdas = l.split(sep).map((c) => c.trim())
    // En una tabla con barras, la primera y la última celda están vacías.
    return sep === '|' ? celdas.slice(l.startsWith('|') ? 1 : 0, l.endsWith('|') ? -1 : undefined) : celdas
  }
  const campos = partir(lineas[0]).map(campoDe)
  return lineas.slice(1).map((l) => {
    const fila: FilaCliente = {}
    partir(l).forEach((c, k) => {
      const campo = campos[k]
      if (campo) fila[campo] = c === '' ? null : c
    })
    return fila
  })
}

/** Dígito verificador del RUT chileno (módulo 11). */
export function validarRut(rut: string): boolean {
  const limpio = rut.replace(/[.\s-]/g, '').toUpperCase()
  const m = limpio.match(/^(\d{1,8})([\dK])$/)
  if (!m) return false
  let suma = 0
  let factor = 2
  for (const d of m[1].split('').reverse()) {
    suma += Number(d) * factor
    factor = factor === 7 ? 2 : factor + 1
  }
  const resto = 11 - (suma % 11)
  const dv = resto === 11 ? '0' : resto === 10 ? 'K' : String(resto)
  return dv === m[2]
}

export function formatoRut(rut: string): string {
  const limpio = rut.replace(/[.\s-]/g, '').toUpperCase()
  const cuerpo = limpio.slice(0, -1).replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `${cuerpo}-${limpio.slice(-1)}`
}

/**
 * El canal que corresponde a lo escrito en la tabla, buscado entre los
 * canales guardados (son datos: se agregan sin programar). Compara sin tildes
 * ni mayúsculas, y en singular o plural: «ferretería» es el canal «Ferreterías».
 */
export function canalDe(texto: string, canales: Canal[]): Canal | null {
  const raiz = (x: string) => normal(x).replace(/(es|s)$/, '')
  const t = raiz(texto)
  return canales.find((c) => raiz(c.nombre) === t) ?? null
}

export interface Canal {
  id: string
  nombre: string
}

export interface ClienteExistente {
  id: string
  nombre: string
  rut: string | null
}

export interface ClientePreparado {
  estado: 'nuevo' | 'actualiza' | 'repetido' | 'sin nombre'
  existenteId: string | null
  datos: Required<{ [K in Exclude<keyof FilaCliente, 'canal' | 'etapa'>]: string | null }> & { canalId: string | null; etapa: string | null }
  /** El nombre del canal reconocido, para mostrarlo. */
  canal: string | null
  avisos: string[]
}

export function prepararClientes(filas: FilaCliente[], existentes: ClienteExistente[], canales: Canal[]): ClientePreparado[] {
  const vistos = new Set<string>()
  return filas.map((f) => {
    const avisos: string[] = []
    const nombre = f.nombre?.trim() || null
    let rut: string | null = null
    if (f.rut) {
      if (validarRut(f.rut)) rut = formatoRut(f.rut)
      else avisos.push(`RUT con dígito verificador incorrecto: ${f.rut}`)
    }
    let canal: Canal | null = null
    if (f.canal) {
      canal = canalDe(f.canal, canales)
      if (!canal) avisos.push(`Canal «${f.canal}» no existe: queda sin canal (agrégalo en Ajustes si corresponde)`)
    }
    // La etapa del embudo: por su código (IDENTIFICADO) o por su nombre (Reunión agendada).
    let etapa: string | null = null
    if (f.etapa) {
      etapa = ETAPAS_CLIENTE.find((e) => normal(e) === normal(f.etapa!) || normal(ETIQUETA_ETAPA[e]) === normal(f.etapa!)) ?? null
      if (!etapa) avisos.push(`Etapa «${f.etapa}» no existe: queda en Identificado`)
    }
    const datos = {
      nombre, rut, canalId: canal?.id ?? null, etapa, proximaAccion: f.proximaAccion ?? null,
      ciudad: f.ciudad ?? null, direccion: f.direccion ?? null, contacto: f.contacto ?? null,
      telefono: f.telefono ?? null, email: f.email ?? null, notas: f.notas ?? null
    }
    const extra = { canal: canal?.nombre ?? null }
    if (!nombre) return { estado: 'sin nombre' as const, existenteId: null, datos, ...extra, avisos: [...avisos, 'Fila sin nombre: no se importa'] }
    // El mismo cliente se reconoce por RUT, o por nombre si no hay RUT.
    const claves = [rut && `rut:${rut}`, `nombre:${normal(nombre)}`].filter((x): x is string => !!x)
    if (claves.some((c) => vistos.has(c))) return { estado: 'repetido' as const, existenteId: null, datos, ...extra, avisos: [...avisos, 'Repetido en la tabla: se importa una vez'] }
    claves.forEach((c) => vistos.add(c))
    // El RUT identifica; el nombre solo cuando no hay RUT de ningún lado.
    const existente = rut ? existentes.find((e) => e.rut === rut) : existentes.find((e) => !e.rut && normal(e.nombre) === normal(nombre))
    if (!existente) {
      // Sin RUT que lo identifique, un nombre parecido puede ser el mismo cliente.
      const parecidos = posiblesDuplicados({ nombre, rut }, existentes)
      if (parecidos.length) avisos.push(`Posible duplicado de ${parecidos.map((x) => x.nombre).join(', ')}: si es el mismo, fusiónalos después en su ficha`)
    }
    return { estado: existente ? ('actualiza' as const) : ('nuevo' as const), existenteId: existente?.id ?? null, datos, ...extra, avisos }
  })
}
