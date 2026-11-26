import type { LecturaCotizacion } from './lectura-esquema'
import type { LineaPedida } from './leer-cotizacion'

/**
 * Lo que la IA lee de la cotización real de Quanzhou Ridge (24-11-2026), para
 * probar la pantalla sin gastar ni tener clave. El precio va a la primera
 * línea pedida: en esa compra es el galpón completo.
 */
export function lecturaDePrueba(pedido: LineaPedida[], nombreArchivo = ''): LecturaCotizacion {
  if (/price.?list/i.test(nombreArchivo)) return listaLvzhou(pedido)
  return {
    proveedor: 'Quanzhou Ridge Steel Structure Co., Ltd.',
    proveedorPais: 'China',
    contacto: null,
    email: 'merlin@ridgesteelstructure.com',
    telefono: '+86-17750077961',
    referencia: null,
    fecha: '2026-11-24',
    moneda: 'USD',
    incoterm: 'FOB',
    lugar: 'Xiamen',
    subtotal: 48352.16,
    gastosHastaFob: 1400,
    total: 49752.16,
    validezDias: 10,
    leadTimeDias: 45,
    condicionesPago: '30% deposit, and balance by T/T before shipment',
    aceptaCartaCredito: null,
    moq: null,
    noIncluye: 'Foundation, installation and civil construction; site technician service is extra',
    desglose: [
      { descripcion: 'H steel Q355B, beams and columns (fabricated, shotblasted Sa 2.5, primer + mild-grey paint)', unidad: 'T', cantidad: 26.45, precioUnitario: 830, monto: 21953.5 },
      { descripcion: 'Z purlin Z250×2.5mm, roof, galvanized Q235B', unidad: 'm', cantidad: 800, precioUnitario: 7.91, monto: 6328 },
      { descripcion: 'C purlin C250×2.2mm, wall, galvanized Q235B', unidad: 'm', cantidad: 777, precioUnitario: 6.84, monto: 5314.68 },
      { descripcion: 'Roof single metal sheets, t=0.4mm', unidad: 'm2', cantidad: 816, precioUnitario: 4.7, monto: 3835.2 },
      { descripcion: 'Wall single metal sheets, t=0.4mm', unidad: 'm2', cantidad: 902, precioUnitario: 4.7, monto: 4239.4 },
      { descripcion: 'Trims & flashings, ridge cap', unidad: 'm', cantidad: 599, precioUnitario: 3.2, monto: 1916.8 },
      { descripcion: 'External gutter', unidad: 'm', cantidad: 76, precioUnitario: 4.6, monto: 349.6 },
      { descripcion: 'Tied rod Φ12 round steel', unidad: 'm', cantidad: 668, precioUnitario: 1.5, monto: 1002 },
      { descripcion: 'PVC downspout Φ110', unidad: 'm', cantidad: 120, precioUnitario: 4.27, monto: 512.4 },
      { descripcion: 'Anchor bolt M24×850mm', unidad: 'Set', cantidad: 76, precioUnitario: 3.8, monto: 288.8 },
      { descripcion: 'High-strength bolt M20, 10.9S', unidad: 'Set', cantidad: 302, precioUnitario: 0.84, monto: 253.68 },
      { descripcion: 'Normal bolt M16, 8.8S', unidad: 'Set', cantidad: 210, precioUnitario: 0.42, monto: 88.2 },
      { descripcion: 'Normal bolt M12, 4.6S', unidad: 'Set', cantidad: 1224, precioUnitario: 0.1, monto: 122.4 },
      { descripcion: 'Accessories: screw, rivet, silicone, etc.', unidad: 'm2', cantidad: 1718, precioUnitario: 1.25, monto: 2147.5 }
    ],
    preciosPorLinea: pedido.length ? [{ lineaId: pedido[0].id, precioUnitario: null, montoTotal: 49752.16, unidad: 'set', cita: 'Total Amount FOB XIAMEN: 49,752.16' }] : [],
    preguntas: [
      {
        campo: 'leadTimeDias',
        pregunta: 'El embarque es «30-45 days after receipt of deposit». ¿Qué plazo uso para comparar?',
        opciones: [
          { etiqueta: '30 días', valor: '30' },
          { etiqueta: '45 días', valor: '45' }
        ]
      }
    ],
    dudas: [
      'El costo FOB de 1.400 (2 × 40\' HQ) está marcado como estimado: se ajusta según la carga real.'
    ]
  }
}

/**
 * Lo que la IA lee de la lista de precios real de Lvzhou (05-11-2026) cuando
 * la compra pide un PPR PN16: el precio viene por metro.
 */
function listaLvzhou(pedido: LineaPedida[]): LecturaCotizacion {
  return {
    proveedor: 'Zhejiang Lvzhou Pipe Technology Co., Ltd',
    proveedorPais: 'China',
    contacto: null,
    email: null,
    telefono: null,
    referencia: null,
    fecha: '2026-11-05',
    moneda: 'USD',
    incoterm: 'FOB',
    lugar: 'Shanghai',
    subtotal: null,
    gastosHastaFob: null,
    total: null,
    validezDias: 10,
    leadTimeDias: null,
    condicionesPago: null,
    aceptaCartaCredito: null,
    moq: null,
    noIncluye: null,
    desglose: [],
    preciosPorLinea: pedido.length ? [{ lineaId: pedido[0].id, precioUnitario: 0.311, montoTotal: null, unidad: 'meter', cita: 'PPR cold & hot water pipe 20×2.8 US$0.311' }] : [],
    preguntas: [],
    dudas: ['Es una lista de precios general, no una cotización de esta compra: no trae cantidades ni total.']
  }
}
