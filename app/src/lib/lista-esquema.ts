import { z } from 'zod'

/**
 * Lo que se le pide a la IA que lea de una lista de precios (un catálogo).
 * Igual que en las cotizaciones, los textos vienen como "" cuando no están:
 * la API acepta pocos campos que admiten null (ver lectura-esquema.ts).
 */
const texto = (que: string) => z.string().describe(`${que}. Cadena vacía si el documento no lo dice`)

export const EsquemaLista = z.object({
  proveedor: texto('Nombre de la empresa, tal como aparece en el documento'),
  fecha: texto('Fecha del documento, AAAA-MM-DD'),
  validezDias: z.number().nullable().describe('Días de validez de la lista. Null si no lo dice'),
  moneda: texto('Código de tres letras: USD, EUR, CNY'),
  incoterm: texto('Incoterm de los precios: FOB, EXW…'),
  lugar: texto('Puerto o ciudad del incoterm'),
  items: z
    .array(
      z.object({
        familia: z.string().describe('Familia amplia, en español, para agrupar costos de flete: «Tubería PPR», «Fittings PPR», «Fittings metálicos», «Válvulas», «Herramientas». Pocas familias'),
        grupo: texto('La sección o nombre del producto en el documento: «PPR cold & hot water pipe», «45° Elbow»'),
        descripcion: z.string().describe('Nombre del producto en español, corto: «Tubo PPR», «Codo 45°», «Tee reductora»'),
        especificacion: texto('Medida o especificación tal como viene: «20×2.8», «32×25»'),
        unidad: z.string().describe('Unidad del precio según el documento: «m», «pieza»'),
        precio: z.number().nullable().describe('Precio unitario tal cual. Null si la celda está vacía')
      })
    )
    .describe('TODOS los productos de la lista, una fila por medida, en el orden del documento'),
  dudas: z.array(z.string()).describe('Lo que no se pudo leer con seguridad: precios ilegibles, condiciones especiales (precios a reconfirmar, etc.)')
})

type DeLaIA = z.infer<typeof EsquemaLista>

export interface LecturaLista {
  proveedor: string | null
  fecha: string | null
  validezDias: number | null
  moneda: string | null
  incoterm: string | null
  lugar: string | null
  items: { familia: string; grupo: string | null; descripcion: string; especificacion: string | null; unidad: string; precio: number | null }[]
  dudas: string[]
}

const nulo = (s: string) => (s.trim() === '' ? null : s.trim())

export function listaDesdeIA(r: DeLaIA): LecturaLista {
  return {
    ...r,
    proveedor: nulo(r.proveedor),
    fecha: nulo(r.fecha),
    moneda: nulo(r.moneda),
    incoterm: nulo(r.incoterm),
    lugar: nulo(r.lugar),
    items: r.items.map((i) => ({ ...i, grupo: nulo(i.grupo), especificacion: nulo(i.especificacion) }))
  }
}
