/**
 * Datos de demostración, todos ficticios: una compra de tubería preaislada
 * con tres proveedores invitados que muestran los tres casos (respondió y
 * pasa, respondió pero queda eliminado, no respondió).
 *
 *   npm run demo:crear
 */
import { PrismaClient } from '@prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'

import { resolverUrlDb } from '../src/lib/db-url'

const db = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url: resolverUrlDb() }) })
const FICTICIO = 'Dato ficticio de demostración.'
const hace = (dias: number) => new Date(Date.now() - dias * 86_400_000)

async function main() {
  await db.empresa.create({
    data: { id: 1, nombre: 'GESI SpA', rut: '76.000.000-0', direccion: 'Santiago, Chile', contacto: 'Nico Montenegro', email: 'contacto@gesi.example', garantiaMeses: 12, anticipoPct: 30 }
  })
  const ppr = await db.familia.create({ data: { nombre: 'Tubería PPR' } })
  const fittings = await db.familia.create({ data: { nombre: 'Fittings' } })
  const cerco = await db.familia.create({ data: { nombre: 'Cerco 3D' } })

  const tubo = await db.producto.create({
    data: { codigo: 'PPR-20', nombre: 'Pre-insulated PPR pipe', especificacion: 'PPR 20×3.4, ISO 15874', unidad: 'm', familiaId: ppr.id }
  })
  const codo = await db.producto.create({ data: { codigo: 'PPR-C20', nombre: 'Insulated elbow 90°', especificacion: 'DN 20', unidad: 'pcs', familiaId: fittings.id } })
  await db.producto.create({ data: { codigo: 'C3D-200', nombre: '3D welded fence panel', especificacion: '2.0 × 2.5 m, 4 mm wire', unidad: 'pcs', familiaId: cerco.id } })

  const lvzhou = await db.proveedor.create({
    data: {
      nombre: 'Lvzhou Pipes',
      pais: 'China',
      contacto: 'Jun',
      canal: 'WHATSAPP',
      aceptaCartaCredito: true,
      notas: FICTICIO,
      familias: { create: [{ familiaId: ppr.id }, { familiaId: fittings.id }] },
      certificados: { create: [{ tipo: 'CALIDAD', nombre: 'ISO 9001' }, { tipo: 'CUMPLIMIENTO', nombre: 'ISO 15874' }] }
    }
  })
  const zhejiang = await db.proveedor.create({
    data: {
      nombre: 'Zhejiang Thermal',
      pais: 'China',
      canal: 'ALIBABA',
      notas: FICTICIO,
      familias: { create: [{ familiaId: ppr.id }] },
      certificados: { create: [{ tipo: 'CALIDAD', nombre: 'ISO 9001' }] }
    }
  })
  const hebei = await db.proveedor.create({
    data: { nombre: 'Hebei Pipes', pais: 'China', canal: 'CORREO', email: 'sales@hebei.example', notas: FICTICIO, familias: { create: [{ familiaId: ppr.id }] } }
  })
  await db.proveedor.create({
    data: {
      nombre: 'Ikon',
      pais: 'Turquía',
      canal: 'CORREO',
      aceptaCartaCredito: true,
      notas: FICTICIO,
      familias: { create: [{ familiaId: cerco.id }] },
      certificados: { create: [{ tipo: 'CALIDAD', nombre: 'ISO 9001' }, { tipo: 'GESTION', nombre: 'ISO 14001' }, { tipo: 'CUMPLIMIENTO', nombre: 'CE' }] }
    }
  })

  const compra = await db.compra.create({
    data: {
      numero: 1,
      titulo: 'Pre-insulated PPR pipe for Magallanes',
      incoterm: 'FOB',
      lugar: 'Ningbo',
      destino: 'Punta Arenas, Chile',
      plazoRespuesta: hace(2),
      etapa: 'BUSCANDO',
      lineas: {
        create: [
          { productoId: tubo.id, descripcion: tubo.nombre, especificacion: tubo.especificacion, cantidad: 2000, unidad: 'm', orden: 0 },
          { productoId: codo.id, descripcion: codo.nombre, especificacion: codo.especificacion, cantidad: 500, unidad: 'pcs', orden: 1 }
        ]
      }
    },
    include: { lineas: { orderBy: { orden: 'asc' } } }
  })
  const [lTubo, lCodo] = compra.lineas

  const invLv = await db.invitacion.create({ data: { compraId: compra.id, proveedorId: lvzhou.id, enviadaEl: hace(9) } })
  await db.cotizacion.create({
    data: {
      invitacionId: invLv.id,
      recibidaEl: hace(5),
      referencia: 'LZ-2611-08',
      incoterm: 'FOB',
      lugar: 'Ningbo',
      leadTimeDias: 30,
      validezDias: 30,
      moq: '1 container 40\'',
      aceptaCartaCredito: true,
      notas: `3 % de descuento sobre 50.000. ${FICTICIO}`,
      lineas: { create: [{ compraLineaId: lTubo.id, precioUnitario: 0.79 }, { compraLineaId: lCodo.id, precioUnitario: 0.35 }] }
    }
  })
  const invZh = await db.invitacion.create({ data: { compraId: compra.id, proveedorId: zhejiang.id, enviadaEl: hace(9) } })
  await db.cotizacion.create({
    data: {
      invitacionId: invZh.id,
      recibidaEl: hace(4),
      incoterm: 'FOB',
      lugar: 'Ningbo',
      leadTimeDias: 25,
      validezDias: 15,
      aceptaCartaCredito: false,
      notas: `Solo T/T 100 % anticipado. ${FICTICIO}`,
      lineas: { create: [{ compraLineaId: lTubo.id, precioUnitario: 0.72 }, { compraLineaId: lCodo.id, precioUnitario: 0.31 }] }
    }
  })
  await db.proveedor.update({ where: { id: zhejiang.id }, data: { aceptaCartaCredito: false } })
  await db.invitacion.create({ data: { compraId: compra.id, proveedorId: hebei.id, enviadaEl: hace(9) } })
  await db.correlativo.create({ data: { tipo: 'compra', ultimo: 1 } })

  console.log('✓ Demo: 4 proveedores, 3 productos, 1 compra con 3 invitaciones (una respondida y válida, una eliminada, una sin respuesta)')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
