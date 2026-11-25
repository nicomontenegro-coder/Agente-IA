/**
 * Pruebas de la revisión de una cotización leída y de los indicadores.
 * Correr con:  npx tsx src/lib/lectura.test.ts
 *
 * Caso real: Quanzhou Ridge Steel Structure, galpón 19 × 38 × 8 m (24-11-2026).
 */

import { revisarDesglose, toneladas, porMedida, cuadraConPedido, precioDeLinea, type LineaDesglose } from './lectura'
import { igual, grupo, terminar } from './prueba'

const ridge: LineaDesglose[] = [
  { descripcion: 'Steel beam and column, H steel Q355B', unidad: 'T', cantidad: 26.45, precioUnitario: 830, monto: 21953.5 },
  { descripcion: 'Z purlin Z250×2.5mm', unidad: 'm', cantidad: 800, precioUnitario: 7.91, monto: 6328 },
  { descripcion: 'C purlin C250×2.2mm', unidad: 'm', cantidad: 777, precioUnitario: 6.84, monto: 5314.68 },
  { descripcion: 'Roof single metal sheets, t=0.4mm', unidad: 'm²', cantidad: 816, precioUnitario: 4.7, monto: 3835.2 },
  { descripcion: 'Wall single metal sheets, t=0.4mm', unidad: 'm²', cantidad: 902, precioUnitario: 4.7, monto: 4239.4 },
  { descripcion: 'Trims & flashings, ridge cap', unidad: 'm', cantidad: 599, precioUnitario: 3.2, monto: 1916.8 },
  { descripcion: 'External gutter', unidad: 'm', cantidad: 76, precioUnitario: 4.6, monto: 349.6 },
  { descripcion: 'Tied rod Φ12', unidad: 'm', cantidad: 668, precioUnitario: 1.5, monto: 1002 },
  { descripcion: 'PVC downspout Φ110', unidad: 'm', cantidad: 120, precioUnitario: 4.27, monto: 512.4 },
  { descripcion: 'Anchor bolt M24×850mm', unidad: 'set', cantidad: 76, precioUnitario: 3.8, monto: 288.8 },
  { descripcion: 'High-strength bolt M20 10.9S', unidad: 'set', cantidad: 302, precioUnitario: 0.84, monto: 253.68 },
  { descripcion: 'Normal bolt M16 8.8S', unidad: 'set', cantidad: 210, precioUnitario: 0.42, monto: 88.2 },
  { descripcion: 'Normal bolt M12 4.6S', unidad: 'set', cantidad: 1224, precioUnitario: 0.1, monto: 122.4 },
  { descripcion: 'Accessories: screw, rivet, silicone', unidad: 'm²', cantidad: 1718, precioUnitario: 1.25, monto: 2147.5 }
]

grupo('Revisar el desglose leído')
const ok = revisarDesglose(ridge, { subtotal: 48352.16, gastos: 1400, total: 49752.16 })
igual('la cotización de Ridge cuadra completa', ok.problemas, [])
igual('la suma de los 14 ítems es el EXW de 48.352,16', ok.suma, 48352.16)

const malLeido = ridge.map((l, i) => (i === 1 ? { ...l, monto: 6238 } : l))
igual(
  'un monto mal leído se detecta: 800 × 7,91 no es 6.238',
  revisarDesglose(malLeido, { subtotal: 48352.16, gastos: 1400, total: 49752.16 }).problemas[0],
  'Ítem 2 (Z purlin Z250×2.5mm): 800 × 7,91 = 6.328,00, pero el documento dice 6.238,00'
)
igual(
  'si la suma no da el subtotal del documento, se avisa',
  revisarDesglose(ridge, { subtotal: 48000, gastos: 1400, total: 49400 }).problemas[0],
  'La suma de los ítems (48.352,16) no coincide con el subtotal del documento (48.000,00)'
)
igual(
  'si subtotal más gastos no da el total, se avisa',
  revisarDesglose(ridge, { subtotal: 48352.16, gastos: 1400, total: 50000 }).problemas[0],
  'Subtotal 48.352,16 + gastos 1.400,00 = 49.752,16, pero el documento dice 50.000,00'
)
igual('sin desglose no hay nada que revisar', revisarDesglose([], { subtotal: null, gastos: null, total: 1000 }).problemas, [])

grupo('Indicadores para comparar galpones')
igual('toneladas: solo las líneas en toneladas (26,45 t)', toneladas(ridge), 26.45)
igual('la unidad «ton» también cuenta como toneladas', toneladas([{ descripcion: 'x', unidad: 'ton', cantidad: 3, precioUnitario: 1, monto: 3 }]), 3)
igual('sin líneas en toneladas no hay toneladas: null, no cero', toneladas([{ descripcion: 'x', unidad: 'm', cantidad: 3, precioUnitario: 1, monto: 3 }]), null)
igual('US$ por m² del galpón: 49.752,16 / 722', porMedida(49752.16, 722), 68.91)
igual('sin medida no hay indicador', porMedida(49752.16, null), null)
igual('una medida en cero no divide', porMedida(49752.16, 0), null)

grupo('Lo pedido contra el documento')
igual('el galpón a 49.752,16 calza con el total FOB del documento', cuadraConPedido(49752.16, 49752.16), null)
igual(
  'si se copió el EXW como precio del galpón, se avisa',
  cuadraConPedido(48352.16, 49752.16),
  'Los precios por línea suman USD 48.352,16, pero el documento dice USD 49.752,16'
)
igual('sin total del documento no hay contra qué comparar', cuadraConPedido(48352.16, null), null)

grupo('El precio por unidad cuando el documento cotiza un monto global')
const m2 = precioDeLinea({ precioUnitario: null, montoTotal: 49752.16 }, 722)
igual('galpón cotizado completo y pedido en 722 m²: se divide sin redondear', m2, 68.908809)
igual('y vuelve a dar el total del documento', cuadraConPedido(Math.round(m2! * 722 * 100) / 100, 49752.16), null)
igual('redondear a 68,91 habría descuadrado 0,86', cuadraConPedido(68.91 * 722, 49752.16), 'Los precios por línea suman USD 49.753,02, pero el documento dice USD 49.752,16')
igual('si el documento da precio unitario, se usa tal cual', precioDeLinea({ precioUnitario: 0.79, montoTotal: 1580 }, 2000), 0.79)
igual('sin precio ni monto no hay precio', precioDeLinea({ precioUnitario: null, montoTotal: null }, 10), null)

terminar()
