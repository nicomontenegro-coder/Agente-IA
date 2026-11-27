/**
 * Exportar una tabla a un archivo que Excel abre bien en Chile: columnas
 * separadas por punto y coma, coma decimal y sin punto de miles (así Excel
 * lo toma como número y se puede sumar), y tildes correctas.
 *
 * Función pura: arma el texto; la pantalla lo descarga.
 */

export type Celda = string | number | null | undefined

/** Un número como lo lee Excel en Chile: 0,311 y no 0.311 ni «0,31 USD». */
const numero = (x: number) => String(x).replace('.', ',')

function celda(v: Celda): string {
  if (v == null) return ''
  const t = typeof v === 'number' ? numero(v) : v
  // Comillas si trae separador, comillas o saltos de línea; las comillas internas se doblan.
  return /[;"\n\r]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t
}

export function aCsv(encabezados: string[], filas: Celda[][]): string {
  return [encabezados, ...filas].map((f) => f.map(celda).join(';')).join('\r\n')
}

/** La marca que le dice a Excel que el archivo viene en UTF-8: sin ella, «Tubería» se lee «TuberÃ­a». */
export const BOM = '﻿'

/** Un nombre de archivo sin caracteres raros, con la fecha. */
export function nombreArchivo(base: string, fecha = new Date()): string {
  const limpio = base.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase()
  return `${limpio || 'tabla'}-${fecha.toISOString().slice(0, 10)}.csv`
}
