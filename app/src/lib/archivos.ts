import 'server-only'

import { randomUUID } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

/**
 * Los PDF de los proveedores viven en una carpeta, no en la base: la base
 * queda liviana y su respaldo diario no carga megas de documentos. Fuera del
 * repositorio, para que un despliegue no los toque.
 */
const carpeta = () => process.env.GESI_DOCUMENTOS ?? path.join(process.cwd(), 'documentos')

/** 30 MB: lo que acepta la API para leer un PDF, con margen. */
export const MAXIMO_PDF = 30 * 1024 * 1024

/** Solo nombres que la app generó: así nadie pide ../../etc/passwd. */
const NOMBRE_VALIDO = /^[0-9a-f-]{36}\.pdf$/

export async function guardarPdf(archivo: File): Promise<string> {
  const nombre = `${randomUUID()}.pdf`
  await mkdir(carpeta(), { recursive: true })
  await writeFile(path.join(carpeta(), nombre), Buffer.from(await archivo.arrayBuffer()))
  return nombre
}

export async function leerPdf(nombre: string): Promise<Buffer | null> {
  if (!NOMBRE_VALIDO.test(nombre)) return null
  try {
    return await readFile(path.join(carpeta(), nombre))
  } catch {
    return null
  }
}

/** Un PDF de verdad empieza con %PDF, se llame como se llame. */
export const esPdf = (b: Buffer) => b.subarray(0, 4).toString('latin1') === '%PDF'
