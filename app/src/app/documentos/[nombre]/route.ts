import { db } from '@/lib/db'
import { leerPdf } from '@/lib/archivos'

/** Muestra el PDF de una cotización en el navegador, con su nombre original. */
export async function GET(_req: Request, { params }: { params: Promise<{ nombre: string }> }) {
  const { nombre } = await params
  const contenido = await leerPdf(nombre)
  if (!contenido) return new Response('No está ese documento', { status: 404 })
  const cot = await db.cotizacion.findFirst({ where: { archivo: nombre }, select: { archivoNombre: true } })
  const pend = cot ? null : await db.lecturaPendiente.findFirst({ where: { archivo: nombre }, select: { archivoNombre: true } })
  const original = (cot?.archivoNombre ?? pend?.archivoNombre ?? nombre).replace(/[^\w.\- ]/g, '_')
  return new Response(new Uint8Array(contenido), {
    headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `inline; filename="${original}"` }
  })
}
