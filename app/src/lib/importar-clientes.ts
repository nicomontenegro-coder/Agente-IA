/**
 * Importar clientes desde una tabla pegada (la que entrega Gemini, una
 * planilla o un CSV). Las columnas se leen por su nombre, así que no importa
 * el orden. No se usa IA: con columnas fijas, leer es exacto y gratis.
 *
 * Funciones puras.
 */

export interface FilaCliente {
  nombre?: string | null
  rut?: string | null
  tipo?: string | null
  ciudad?: string | null
  direccion?: string | null
  contacto?: string | null
  telefono?: string | null
  email?: string | null
  notas?: string | null
}

const normal = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()

/** Cómo puede venir escrito cada encabezado. */
const ENCABEZADOS: Record<keyof FilaCliente, string[]> = {
  nombre: ['nombre', 'razon social', 'cliente', 'empresa'],
  rut: ['rut'],
  tipo: ['tipo', 'canal', 'rubro'],
  ciudad: ['ciudad', 'comuna'],
  direccion: ['direccion'],
  contacto: ['contacto', 'persona de contacto'],
  telefono: ['telefono', 'fono', 'celular', 'whatsapp'],
  email: ['email', 'correo', 'e-mail', 'mail'],
  notas: ['notas', 'nota', 'observaciones', 'comentarios']
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

/** Los tipos de cliente: son los canales de venta (deciden el precio). */
export const TIPOS_CLIENTE = ['ferretería', 'instalador', 'constructora', 'otro'] as const
const TIPO_POR_TEXTO: [string, RegExp][] = [
  ['ferretería', /ferreter/],
  ['instalador', /instala|gasfiter|contratista/],
  ['constructora', /constru/],
  ['otro', /^otro/]
]

export interface ClienteExistente {
  id: string
  nombre: string
  rut: string | null
}

export interface ClientePreparado {
  estado: 'nuevo' | 'actualiza' | 'repetido' | 'sin nombre'
  existenteId: string | null
  datos: Required<{ [K in keyof FilaCliente]: string | null }>
  avisos: string[]
}

export function prepararClientes(filas: FilaCliente[], existentes: ClienteExistente[]): ClientePreparado[] {
  const vistos = new Set<string>()
  return filas.map((f) => {
    const avisos: string[] = []
    const nombre = f.nombre?.trim() || null
    let rut: string | null = null
    if (f.rut) {
      if (validarRut(f.rut)) rut = formatoRut(f.rut)
      else avisos.push(`RUT con dígito verificador incorrecto: ${f.rut}`)
    }
    let tipo: string | null = null
    if (f.tipo) {
      tipo = TIPO_POR_TEXTO.find(([, re]) => re.test(normal(f.tipo!)))?.[0] ?? 'otro'
      if (!TIPO_POR_TEXTO.some(([, re]) => re.test(normal(f.tipo!)))) avisos.push(`Tipo «${f.tipo}» no reconocido: queda como «otro»`)
    }
    const datos = {
      nombre, rut, tipo,
      ciudad: f.ciudad ?? null, direccion: f.direccion ?? null, contacto: f.contacto ?? null,
      telefono: f.telefono ?? null, email: f.email ?? null, notas: f.notas ?? null
    }
    if (!nombre) return { estado: 'sin nombre' as const, existenteId: null, datos, avisos: [...avisos, 'Fila sin nombre: no se importa'] }
    // El mismo cliente se reconoce por RUT, o por nombre si no hay RUT.
    const claves = [rut && `rut:${rut}`, `nombre:${normal(nombre)}`].filter((x): x is string => !!x)
    if (claves.some((c) => vistos.has(c))) return { estado: 'repetido' as const, existenteId: null, datos, avisos: [...avisos, 'Repetido en la tabla: se importa una vez'] }
    claves.forEach((c) => vistos.add(c))
    const existente = existentes.find((e) => (rut && e.rut === rut) || normal(e.nombre) === normal(nombre))
    return { estado: existente ? ('actualiza' as const) : ('nuevo' as const), existenteId: existente?.id ?? null, datos, avisos }
  })
}
