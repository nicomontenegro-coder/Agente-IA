'use server'

import { revalidatePath } from 'next/cache'

import { db } from '@/lib/db'
import { preguntarAsistente, contextoLista } from '@/lib/asistente'
import { prepararCambios, type Cambio } from '@/lib/propuestas'
import type { EstadoForm } from './compras'

export async function enviarMensaje(listaId: string, _e: EstadoForm, datos: FormData): Promise<EstadoForm> {
  const texto = String(datos.get('texto') ?? '').trim()
  if (!texto) return { error: 'Escribe tu consulta' }
  if (texto.length > 2000) return { error: 'La consulta es demasiado larga' }
  const r = await preguntarAsistente(listaId, texto)
  if (!r.ok) return { error: r.error }
  const contexto = contextoLista(listaId)
  // Se guardan juntos y después de responder: si se guardara antes, el
  // historial que lee el asistente traería la pregunta dos veces.
  await db.chatMensaje.create({ data: { contexto, rol: 'USUARIO', texto } })
  await db.chatMensaje.create({ data: { contexto, rol: 'ASISTENTE', texto: r.respuesta } })
  revalidatePath(`/precios/${listaId}`)
  return { ok: 'Respuesta recibida' }
}

export async function aprobarPropuesta(listaId: string, propuestaId: string): Promise<void> {
  const p = await db.propuesta.findUnique({ where: { id: propuestaId } })
  if (!p || p.contexto !== contextoLista(listaId) || p.estado !== 'PENDIENTE') return
  const items = await db.listaPreciosItem.findMany({ where: { listaId } })
  const r = prepararCambios(JSON.parse(p.cambios) as Cambio[], items)
  await db.$transaction([
    ...(r.ok ? r.cambios.map((c) => db.listaPreciosItem.update({ where: { id: c.itemId }, data: { [c.campo]: c.valor || null } })) : []),
    db.propuesta.update({ where: { id: propuestaId }, data: { estado: r.ok ? 'APLICADA' : 'DESCARTADA', resueltaEn: new Date() } })
  ])
  revalidatePath(`/precios/${listaId}`)
}

export async function descartarPropuesta(listaId: string, propuestaId: string): Promise<void> {
  await db.propuesta.updateMany({ where: { id: propuestaId, contexto: contextoLista(listaId), estado: 'PENDIENTE' }, data: { estado: 'DESCARTADA', resueltaEn: new Date() } })
  revalidatePath(`/precios/${listaId}`)
}
