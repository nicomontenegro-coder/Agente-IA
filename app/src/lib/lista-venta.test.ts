/**
 * Pruebas del paso de la lista de precios del proveedor a la lista de venta.
 * Correr con:  npx tsx src/lib/lista-venta.test.ts
 *
 * Caso real: lista de precios de Lvzhou (05-11-2026, FOB Shanghai, 10 días).
 * El factor y el tipo de cambio de estas pruebas son ilustrativos: los reales
 * los ingresa Nico.
 */

import { precioVenta, vigencia, familiasDe, filasDeVenta, type ParametrosFamilia } from './lista-venta'
import { igual, grupo, terminar } from './prueba'

const tubos: ParametrosFamilia = { factor: 1.45, margenPct: 35 }

grupo('Del FOB al precio de venta')
const p = precioVenta(0.311, tubos, 950)
igual('landed en dólares: FOB × factor (0,311 × 1,45)', p?.landedUsd, 0.45095)
igual('landed en pesos: × tipo de cambio 950, sin redondear todavía', p?.landedClp, 428.4025)
igual('precio de venta: landed ÷ (1 − 35%), en pesos sin decimales', p?.precioClp, 659)
igual('el margen es sobre el precio, no sobre el costo (no es markup)', Math.round(((659 - 428.4025) / 659) * 100), 35)
igual('sin precio del proveedor no hay precio de venta', precioVenta(null, tubos, 950), null)
igual('sin factor no se inventa uno', precioVenta(0.311, { factor: null, margenPct: 35 }, 950), null)
igual('sin margen la familia no se vende', precioVenta(0.311, { factor: 1.45, margenPct: null }, 950), null)
igual('un margen de 100% o más no existe', precioVenta(0.311, { factor: 1.45, margenPct: 100 }, 950), null)
igual('sin tipo de cambio no hay pesos', precioVenta(0.311, tubos, null), null)

grupo('Vigencia de la lista del proveedor')
const v = vigencia(new Date('2026-11-05T12:00:00'), 10, new Date('2026-11-26T12:00:00'))
igual('la lista de Lvzhou venció el 15-11', v.vence?.toISOString().slice(0, 10), '2026-11-15')
igual('y hoy está vencida hace 11 días', [v.vencida, v.dias], [true, -11])
const v2 = vigencia(new Date('2026-11-25T12:00:00'), 10, new Date('2026-11-26T12:00:00'))
igual('una lista de ayer vale 9 días más', [v2.vencida, v2.dias], [false, 9])
igual('sin validez no se sabe cuándo vence', vigencia(new Date('2026-11-25T12:00:00'), null, new Date()).vence, null)

grupo('Familias de la lista')
igual(
  'cuenta los productos por familia, en el orden del documento',
  familiasDe([{ familia: 'Tubería PPR' }, { familia: 'Fittings PPR' }, { familia: 'Tubería PPR' }]),
  [{ familia: 'Tubería PPR', productos: 2 }, { familia: 'Fittings PPR', productos: 1 }]
)

grupo('Filas de la lista de venta')
const items = [
  { familia: 'Tubería PPR', descripcion: 'Tubo PPR', especificacion: '20×2.8', unidad: 'm', precio: 0.311 },
  { familia: 'Tubería PPR', descripcion: 'Tubo PPR', especificacion: '110×15.1', unidad: 'm', precio: null },
  { familia: 'Fittings PPR', descripcion: 'Codo 90°', especificacion: '20', unidad: 'pieza', precio: 0.039 }
]
const general = { factor: 1.45, tipoCambio: 950 }
const porMetro = filasDeVenta(items, general, [{ familia: 'Tubería PPR', margenPct: 35, unidadVenta: null, contenido: null }])
igual('sin unidad de venta, el tubo se vende por metro: 659', [porMetro[0].unidadVenta, porMetro[0].precioClp], ['m', 659])
igual('la medida sin precio y la familia sin margen quedan fuera', porMetro.map((f) => f.especificacion), ['20×2.8'])
const porTira = filasDeVenta(items, general, [
  { familia: 'Tubería PPR', margenPct: 35, unidadVenta: 'tira de 4 m', contenido: 4 },
  { familia: 'Fittings PPR', margenPct: 40, unidadVenta: null, contenido: null }
])
igual('por tira de 4 m: el FOB de la tira es 0,311 × 4 = 1,244', porTira[0].fobVenta, 1.244)
igual('landed de la tira: 1,244 × 1,45 × 950 = 1.714 pesos', Math.round(porTira[0].landedClp), 1714)
igual('precio de la tira con 35% de margen: 2.636', [porTira[0].unidadVenta, porTira[0].precioClp], ['tira de 4 m', 2636])
igual('el codo sigue por pieza: 0,039 × 1,45 × 950 ÷ 0,6 = 90', [porTira[1].unidadVenta, porTira[1].precioClp], ['pieza', 90])

terminar()
