/**
 * Pruebas del importador de clientes desde una tabla pegada.
 * Correr con:  npx tsx src/lib/importar-clientes.test.ts
 *
 * Datos ficticios: nunca clientes reales en el repositorio.
 */

import { leerTabla, validarRut, formatoRut, prepararClientes, canalDe } from './importar-clientes'

const CANALES = [
  { id: 'f', nombre: 'Ferreterías' },
  { id: 'i', nombre: 'Instaladores' },
  { id: 'c', nombre: 'Constructoras' }
]
import { igual, grupo, terminar } from './prueba'

const markdown = `| Nombre | RUT | Tipo | Ciudad | Dirección | Contacto | Teléfono | Email | Notas |
|---|---|---|---|---|---|---|---|---|
| Ferretería Austral Ltda. | 76.123.456-0 | Ferretería | Punta Arenas | Av. Bulnes 100 | Juan Soto | +56 9 1111 1111 | compras@austral.example | Pide crédito |
| Instalaciones Patagonia | 12.345.678-5 | instalador | Puerto Natales |  | Ana Ruiz |  |  |  |`

grupo('Leer la tabla, venga como venga')
const t = leerTabla(markdown)
igual('tabla con barras (como la entrega Gemini): 2 filas', t.length, 2)
igual('lee las columnas por su nombre', [t[0].nombre, t[0].ciudad, t[1].canal], ['Ferretería Austral Ltda.', 'Punta Arenas', 'instalador'])
igual('una celda vacía queda vacía', t[1].telefono, null)
const tsv = 'Nombre\tRUT\tTipo\nFerretería Austral Ltda.\t76.123.456-0\tFerretería'
igual('también separada por tabulaciones (copiada de una planilla)', leerTabla(tsv)[0].rut, '76.123.456-0')
igual('y por punto y coma', leerTabla('nombre;ciudad\nAustral;Punta Arenas')[0].ciudad, 'Punta Arenas')
igual('encabezados con otro nombre: «Razón social», «Correo», «Fono»', leerTabla('Razón social;Correo;Fono\nAustral;a@b.cl;123')[0], { nombre: 'Austral', email: 'a@b.cl', telefono: '123' })

grupo('RUT chileno')
igual('un RUT con dígito verificador correcto es válido', validarRut('76.123.456-0'), true)
igual('con el dígito equivocado no', validarRut('76.123.456-1'), false)
igual('el dígito K vale', validarRut('11.111.111-1') && validarRut('10.000.013-K'), true)
igual('se guarda con un formato único', formatoRut('76123456-0'), '76.123.456-0')

grupo('Preparar la importación')
const r = prepararClientes(t, [], CANALES)
igual('los dos clientes quedan listos', r.map((x) => x.estado), ['nuevo', 'nuevo'])
igual('el tipo escrito se reconoce como canal guardado, en singular o plural', r.map((x) => [x.datos.canalId, x.canal]), [['f', 'Ferreterías'], ['i', 'Instaladores']])
const malo = prepararClientes(leerTabla('Nombre;RUT\nX;76.123.456-1'), [], CANALES)
igual('un RUT mal escrito se avisa, no se guarda inventado', [malo[0].avisos[0], malo[0].datos.rut], ['RUT con dígito verificador incorrecto: 76.123.456-1', null])
const dup = prepararClientes(leerTabla('Nombre;RUT\nAustral;76.123.456-0\nAUSTRAL;'), [], CANALES)
igual('dos filas del mismo cliente: la segunda se marca repetida', dup[1].estado, 'repetido')
const existe = prepararClientes(leerTabla('Nombre;RUT\nOtra razón social;76.123.456-0'), [{ id: 'c1', nombre: 'Ferretería Austral Ltda.', rut: '76.123.456-0' }], CANALES)
igual('si ya existe (mismo RUT), se actualiza en vez de duplicar', [existe[0].estado, existe[0].existenteId], ['actualiza', 'c1'])
igual('una fila sin nombre se descarta con aviso', prepararClientes(leerTabla('Nombre;Ciudad\n;Punta Arenas'), [], CANALES)[0].estado, 'sin nombre')
igual('un canal que no existe queda vacío, con aviso: no se inventa', prepararClientes(leerTabla('Nombre;Tipo\nX;salmonera'), [], CANALES)[0].avisos, ['Canal «salmonera» no existe: queda sin canal (agrégalo en Ajustes si corresponde)'])
igual('si se agrega el canal «Salmoneras», la misma fila ya se reconoce', canalDe('salmonera', [...CANALES, { id: 's', nombre: 'Salmoneras' }])?.id, 's')
igual('con RUT, el nombre no identifica: «Austral» con otro RUT es otro cliente', prepararClientes(leerTabla('Nombre;RUT\nAustral;12.345.678-5'), [{ id: 'c1', nombre: 'Austral', rut: '76.123.456-0' }], CANALES)[0].estado, 'nuevo')

grupo('Traer el embudo desde Importa')
const deImporta = prepararClientes(leerTabla('Nombre\tTipo\tEtapa\tproximaAccion\nAustral\tferretería\tREUNION\tLlevar muestras\nNatales\t\tVisitado\t\nSur\t\tganadísimo\t'), [], CANALES)
igual('la etapa se lee por su código o por su nombre', deImporta.map((x) => x.datos.etapa), ['REUNION', 'VISITADO', null])
igual('una etapa desconocida se avisa y no se inventa', deImporta[2].avisos, ['Etapa «ganadísimo» no existe: queda en Identificado'])
igual('la próxima acción viaja con el cliente', deImporta[0].datos.proximaAccion, 'Llevar muestras')

terminar()
