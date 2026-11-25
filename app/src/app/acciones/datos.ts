'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { db } from '@/lib/db'
import { TIPOS_CERTIFICADO } from '@/lib/proveedores'
import type { EstadoForm } from './compras'

const texto = (v: FormDataEntryValue | null) => {
  const s = typeof v === 'string' ? v.trim() : ''
  return s === '' ? null : s
}
const entero = (v: FormDataEntryValue | null) => {
  const n = Number(texto(v)?.replace(',', '.'))
  return texto(v) && Number.isFinite(n) ? Math.round(n) : null
}
const fechaDe = (v: FormDataEntryValue | null) => {
  const s = texto(v)
  return s ? new Date(`${s}T12:00:00`) : null
}

/** Las familias se eligen de la lista o se escriben nuevas separadas por coma. */
async function familiasDe(datos: FormData): Promise<string[]> {
  const elegidas = datos.getAll('familiaId').map((v) => String(v))
  const nuevas = (texto(datos.get('familiasNuevas')) ?? '').split(',').map((s) => s.trim()).filter(Boolean)
  for (const nombre of nuevas) {
    const f = await db.familia.upsert({ where: { nombre }, create: { nombre }, update: {} })
    elegidas.push(f.id)
  }
  return [...new Set(elegidas)]
}

export async function guardarProveedor(id: string | null, _e: EstadoForm, datos: FormData): Promise<EstadoForm> {
  const nombre = texto(datos.get('nombre'))
  if (!nombre) return { error: 'Ingresa el nombre del proveedor' }
  const otro = await db.proveedor.findUnique({ where: { nombre } })
  if (otro && otro.id !== id) return { error: 'Ya existe un proveedor con ese nombre' }
  const lc = texto(datos.get('aceptaCartaCredito'))
  const data = {
    nombre,
    pais: texto(datos.get('pais')),
    contacto: texto(datos.get('contacto')),
    email: texto(datos.get('email')),
    telefono: texto(datos.get('telefono')),
    canal: texto(datos.get('canal')) ?? 'CORREO',
    aceptaCartaCredito: lc === 'SI' ? true : lc === 'NO' ? false : null,
    notas: texto(datos.get('notas'))
  }
  const familias = await familiasDe(datos)
  const p = id
    ? await db.proveedor.update({ where: { id }, data: { ...data, familias: { deleteMany: {}, create: familias.map((familiaId) => ({ familiaId })) } } })
    : await db.proveedor.create({ data: { ...data, familias: { create: familias.map((familiaId) => ({ familiaId })) } } })
  revalidatePath('/proveedores')
  if (!id) redirect(`/proveedores/${p.id}`)
  revalidatePath(`/proveedores/${p.id}`)
  return { ok: 'Proveedor guardado' }
}

export async function agregarCertificado(proveedorId: string, _e: EstadoForm, datos: FormData): Promise<EstadoForm> {
  const tipo = texto(datos.get('tipo'))
  const nombre = texto(datos.get('nombre'))
  if (!tipo || !TIPOS_CERTIFICADO.some((t) => t.valor === tipo)) return { error: 'Selecciona el tipo de certificado' }
  if (!nombre) return { error: 'Ingresa el nombre del certificado (por ejemplo, ISO 9001)' }
  await db.certificado.create({ data: { proveedorId, tipo, nombre, vigenteHasta: fechaDe(datos.get('vigenteHasta')) } })
  revalidatePath(`/proveedores/${proveedorId}`)
  return { ok: 'Certificado agregado' }
}

export async function quitarCertificado(proveedorId: string, certificadoId: string) {
  await db.certificado.deleteMany({ where: { id: certificadoId, proveedorId } })
  revalidatePath(`/proveedores/${proveedorId}`)
}

export async function guardarProducto(id: string | null, _e: EstadoForm, datos: FormData): Promise<EstadoForm> {
  const nombre = texto(datos.get('nombre'))
  if (!nombre) return { error: 'Ingresa el nombre del producto' }
  let familiaId = texto(datos.get('familiaId'))
  const familiaNueva = texto(datos.get('familiaNueva'))
  if (familiaNueva) familiaId = (await db.familia.upsert({ where: { nombre: familiaNueva }, create: { nombre: familiaNueva }, update: {} })).id
  const data = {
    nombre,
    codigo: texto(datos.get('codigo')),
    especificacion: texto(datos.get('especificacion')),
    unidad: texto(datos.get('unidad')) ?? 'u',
    codigoHS: texto(datos.get('codigoHS')),
    certificacionLocal: texto(datos.get('certificacionLocal')),
    familiaId
  }
  if (id) await db.producto.update({ where: { id }, data })
  else await db.producto.create({ data })
  revalidatePath('/productos')
  return { ok: id ? 'Producto guardado' : 'Producto agregado' }
}

export async function guardarEmpresa(_e: EstadoForm, datos: FormData): Promise<EstadoForm> {
  const data = {
    nombre: texto(datos.get('nombre')) ?? 'GESI SpA',
    rut: texto(datos.get('rut')),
    direccion: texto(datos.get('direccion')),
    contacto: texto(datos.get('contacto')),
    email: texto(datos.get('email')),
    telefono: texto(datos.get('telefono')),
    garantiaMeses: entero(datos.get('garantiaMeses')),
    anticipoPct: entero(datos.get('anticipoPct')) ?? 30
  }
  await db.empresa.upsert({ where: { id: 1 }, create: { id: 1, ...data }, update: data })
  revalidatePath('/ajustes')
  return { ok: 'Datos guardados' }
}
