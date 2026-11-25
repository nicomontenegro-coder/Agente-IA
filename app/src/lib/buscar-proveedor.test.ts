/**
 * Pruebas de la búsqueda del proveedor que firma una cotización leída.
 * Correr con:  npx tsx src/lib/buscar-proveedor.test.ts
 */

import { sugerirProveedores, nucleoDelNombre } from './buscar-proveedor'
import { igual, grupo, terminar } from './prueba'

const guardados = [
  { id: 'ridge', nombre: 'Ridge Steel', email: null },
  { id: 'hebei', nombre: 'Hebei Pipes', email: 'sales@hebeipipes.com' },
  { id: 'lvzhou', nombre: 'Lvzhou Pipes', email: 'nina@lvzhou-pipe.com' },
  { id: 'gmail', nombre: 'Shandong Fence Factory', email: 'shandongfence@gmail.com' }
]
const ids = (r: { id: string }[]) => r.map((x) => x.id)

grupo('El nombre sin lo que no lo distingue')
igual('se quitan la forma legal y la puntuación', nucleoDelNombre('Quanzhou Ridge Steel Structure Co., Ltd.'), ['quanzhou', 'ridge', 'steel', 'structure'])
igual('mayúsculas y tildes no importan', nucleoDelNombre('ACERO ÑUÑOA S.A.'), ['acero', 'nunoa'])

grupo('Sugerir a quién corresponde la cotización')
igual(
  'el nombre largo del PDF encuentra a «Ridge Steel» ya guardado',
  ids(sugerirProveedores({ nombre: 'Quanzhou Ridge Steel Structure Co., Ltd.', email: 'merlin@ridgesteelstructure.com' }, guardados)),
  ['ridge']
)
igual(
  'el dominio del correo lo encuentra aunque el nombre esté escrito distinto',
  sugerirProveedores({ nombre: 'Hebei Steel Tube Co.', email: 'tom@hebeipipes.com' }, guardados)[0],
  { id: 'hebei', nombre: 'Hebei Pipes', motivo: 'coincide el dominio de correo (hebeipipes.com)' }
)
igual(
  'compartir «pipes» no basta para confundir a Lvzhou con Hebei',
  ids(sugerirProveedores({ nombre: 'Lvzhou Pipes Co., Ltd', email: null }, guardados)),
  ['lvzhou']
)
igual(
  'un correo de gmail no dice de qué empresa es',
  ids(sugerirProveedores({ nombre: 'Zhejiang Wire Mesh', email: 'otro@gmail.com' }, guardados)),
  []
)
igual('un proveedor nuevo no trae sugerencias', ids(sugerirProveedores({ nombre: 'Tianjin Steel Co.', email: null }, guardados)), [])
igual('sin nombre ni correo no se adivina', ids(sugerirProveedores({ nombre: null, email: null }, guardados)), [])

terminar()
