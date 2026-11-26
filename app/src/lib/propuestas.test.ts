/**
 * Pruebas de las propuestas del asistente.
 * Correr con:  npx tsx src/lib/propuestas.test.ts
 */

import { prepararCambios, type ItemEditable } from './propuestas'
import { igual, grupo, terminar } from './prueba'

const tubo: ItemEditable = { id: 't1', pn: null, descripcion: 'Tubo PPR', especificacion: '20×2.8', familia: 'Tubería PPR', unidad: 'm' }

grupo('Lo que el asistente puede proponer')
igual(
  'agregar el PN a un tubo de la lista, mostrando cómo estaba',
  prepararCambios([{ itemId: 't1', campo: 'pn', valor: 'PN16 (DIN 8077)' }], [tubo]),
  { ok: true, cambios: [{ itemId: 't1', campo: 'pn', valor: 'PN16 (DIN 8077)', antes: null }] }
)
igual('no puede tocar productos de otra lista', prepararCambios([{ itemId: 'otro', campo: 'pn', valor: 'PN16' }], [tubo]), { ok: false, error: 'El producto otro no es de esta lista' })
igual('no puede tocar el precio', prepararCambios([{ itemId: 't1', campo: 'precio' as never, valor: '0' }], [tubo]), { ok: false, error: 'El campo precio no se puede cambiar' })
igual('no puede dejar vacía la descripción', prepararCambios([{ itemId: 't1', campo: 'descripcion', valor: ' ' }], [tubo]), { ok: false, error: 'El campo descripcion no puede quedar vacío' })
igual('un cambio que ya está aplicado no se propone', prepararCambios([{ itemId: 't1', campo: 'familia', valor: 'Tubería PPR' }], [tubo]), { ok: false, error: 'Los cambios propuestos ya están aplicados' })

terminar()
