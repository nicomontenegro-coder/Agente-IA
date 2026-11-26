import 'server-only'

import { db } from './db'
import { etapaCompra, type HechosCompra } from './compra'
import { toneladas, porMedida } from './lectura'
import { estadoInvitacion, evaluarProveedor, totalCotizacion, avisoComparacion } from './proveedores'

/**
 * Lo que se trae de una compra vive aquí y no en cada página: si la lista y
 * la ficha armaran su propia consulta, tarde o temprano mostrarían etapas
 * distintas para la misma compra.
 */
const INCLUIR = {
  lineas: { orderBy: { orden: 'asc' as const }, include: { producto: true } },
  invitaciones: {
    orderBy: { creadoEn: 'asc' as const },
    include: {
      proveedor: { include: { certificados: true } },
      cotizacion: { include: { lineas: true, desglose: { orderBy: { posicion: 'asc' as const } } } }
    }
  },
  ordenes: { orderBy: { fecha: 'asc' as const }, include: { pagos: true, lineas: true, cotizacion: { include: { invitacion: { include: { proveedor: true } } } } } }
}

type CompraFila = NonNullable<Awaited<ReturnType<typeof leer>>>

const leer = (id: string) => db.compra.findUnique({ where: { id }, include: INCLUIR })

/** Lo registrado que permite despejar la etapa. */
export function hechosDe(c: CompraFila): HechosCompra {
  // Una OC anulada no cuenta: la compra vuelve a la etapa que tenía sin ella.
  const vigentes = c.ordenes.filter((o) => !o.anuladaEl)
  const pagos = vigentes.flatMap((o) => o.pagos)
  return {
    invitacionesEnviadas: c.invitaciones.filter((i) => i.enviadaEl).length,
    cotizacionesRecibidas: c.invitaciones.filter((i) => i.cotizacion).length,
    ocEmitida: vigentes.length > 0,
    primerPago: pagos.some((p) => p.tipo === 'CARTA_CREDITO' || p.tipo === 'ANTICIPO'),
    embarcada: false,
    segundoPago: pagos.some((p) => p.tipo === 'SALDO'),
    cerrada: false
  }
}

/** Embarques previos con un proveedor: cuántas OC se le han emitido en otras compras. */
async function ordenesPrevias(proveedorIds: string[], compraId: string) {
  const ordenes = await db.ordenCompra.findMany({
    where: { compraId: { not: compraId }, cotizacion: { invitacion: { proveedorId: { in: proveedorIds } } } },
    select: { cotizacion: { select: { invitacion: { select: { proveedorId: true } } } } }
  })
  const cuenta = new Map<string, number>()
  for (const o of ordenes) {
    const p = o.cotizacion.invitacion.proveedorId
    cuenta.set(p, (cuenta.get(p) ?? 0) + 1)
  }
  return cuenta
}

export async function compraCompleta(id: string, hoy = new Date()) {
  const c = await leer(id)
  if (!c) return null
  const previas = await ordenesPrevias(c.invitaciones.map((i) => i.proveedorId), c.id)
  const { etapa, origen } = etapaCompra(c.etapa, hechosDe(c))
  const invitaciones = c.invitaciones.map((i) => {
    const primerEmbarque = (previas.get(i.proveedorId) ?? 0) === 0
    const acepta = i.cotizacion?.aceptaCartaCredito ?? i.proveedor.aceptaCartaCredito
    const lineasCotizadas = c.lineas.map((l) => ({
      compraLineaId: l.id,
      cantidad: l.cantidad,
      precioUnitario: i.cotizacion?.lineas.find((x) => x.compraLineaId === l.id)?.precioUnitario ?? null
    }))
    return {
      ...i,
      estado: estadoInvitacion({ enviadaEl: i.enviadaEl, declino: i.declino, tieneCotizacion: !!i.cotizacion }, c.plazoRespuesta, hoy),
      primerEmbarque,
      evaluacion: evaluarProveedor({ certificados: i.proveedor.certificados, aceptaCartaCredito: acepta }, primerEmbarque, hoy),
      lineasCotizadas,
      total: i.cotizacion ? totalCotizacion(lineasCotizadas) : null
    }
  }).map((i) => {
    // Indicadores para comparar lo que cada proveedor cubica distinto.
    const ton = i.cotizacion ? toneladas(i.cotizacion.desglose) : null
    return { ...i, toneladas: ton, porMedida: porMedida(i.total, c.medidaRef), porTonelada: porMedida(i.total, ton) }
  })
  const cotizadas = invitaciones.filter((i) => i.cotizacion)
  return {
    ...c,
    etapaVale: etapa,
    origenEtapa: origen,
    invitaciones,
    avisoComparacion: avisoComparacion(cotizadas.map((i) => ({ moneda: i.cotizacion!.moneda, incoterm: i.cotizacion!.incoterm, lugar: i.cotizacion!.lugar })))
  }
}

export type CompraCompleta = NonNullable<Awaited<ReturnType<typeof compraCompleta>>>

/** Todas las compras con la etapa que vale, para la lista. */
export async function comprasConEtapa() {
  const filas = await db.compra.findMany({ orderBy: { numero: 'desc' }, include: INCLUIR })
  return filas.map((c) => {
    const { etapa } = etapaCompra(c.etapa, hechosDe(c))
    return {
      id: c.id,
      numero: c.numero,
      titulo: c.titulo,
      etapa,
      lineas: c.lineas.length,
      invitadas: c.invitaciones.length,
      respondidas: c.invitaciones.filter((i) => i.cotizacion).length,
      actualizadoEn: c.actualizadoEn
    }
  })
}

/** El siguiente número de un correlativo, sin repetir aunque dos guarden a la vez. */
export async function siguienteNumero(tipo: string): Promise<number> {
  const c = await db.correlativo.upsert({ where: { tipo }, create: { tipo, ultimo: 1 }, update: { ultimo: { increment: 1 } } })
  return c.ultimo
}

export async function empresa() {
  return db.empresa.upsert({ where: { id: 1 }, create: { id: 1 }, update: {} })
}
