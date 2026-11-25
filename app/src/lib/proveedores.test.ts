/**
 * Pruebas de invitaciones, filtros y comparación. Correr con:  npx tsx src/lib/proveedores.test.ts
 * Casos: Lvzhou (tubería, China), Ikon (cerco 3D, Turquía).
 */

import { estadoInvitacion, evaluarProveedor, puntajeCertificados, totalCotizacion, avisoComparacion } from './proveedores'
import { igual, grupo, terminar } from './prueba'

const dia = (s: string) => new Date(`${s}T12:00:00`)
const hoy = dia('2026-11-24')

grupo('Estado de cada invitación')
igual('sin fecha de envío está por enviar', estadoInvitacion({ enviadaEl: null, declino: false, tieneCotizacion: false }, null, hoy), 'POR_ENVIAR')
igual('enviada y dentro del plazo', estadoInvitacion({ enviadaEl: dia('2026-11-20'), declino: false, tieneCotizacion: false }, dia('2026-11-30'), hoy), 'ENVIADA')
igual('el último día del plazo todavía no está vencida', estadoInvitacion({ enviadaEl: dia('2026-11-20'), declino: false, tieneCotizacion: false }, dia('2026-11-24'), hoy), 'ENVIADA')
igual('pasado el plazo sin cotización queda sin respuesta', estadoInvitacion({ enviadaEl: dia('2026-11-10'), declino: false, tieneCotizacion: false }, dia('2026-11-20'), hoy), 'SIN_RESPUESTA')
igual('una cotización tardía igual la deja respondida', estadoInvitacion({ enviadaEl: dia('2026-11-10'), declino: false, tieneCotizacion: true }, dia('2026-11-20'), hoy), 'RESPONDIDA')
igual('si dijo que no, declinó', estadoInvitacion({ enviadaEl: dia('2026-11-10'), declino: true, tieneCotizacion: false }, null, hoy), 'DECLINO')

grupo('Puntaje de certificados: un punto por tipo')
igual('ISO 9001 e ISO 15874: calidad y cumplimiento, 2 puntos', puntajeCertificados([{ tipo: 'CALIDAD', vigenteHasta: null }, { tipo: 'CUMPLIMIENTO', vigenteHasta: null }], hoy), 2)
igual('dos de calidad cuentan como un tipo', puntajeCertificados([{ tipo: 'CALIDAD', vigenteHasta: null }, { tipo: 'CALIDAD', vigenteHasta: null }], hoy), 1)
igual('un certificado vencido no suma', puntajeCertificados([{ tipo: 'GESTION', vigenteHasta: dia('2025-12-31') }], hoy), 0)

grupo('Filtros eliminatorios')
igual(
  'Lvzhou con certificados y acepta carta de crédito pasa',
  evaluarProveedor({ certificados: [{ tipo: 'CALIDAD', vigenteHasta: null }], aceptaCartaCredito: true }, true, hoy),
  { eliminado: false, motivos: [], pendientes: [], puntaje: 1 }
)
igual(
  'no aceptar carta de crédito en el primer embarque elimina',
  evaluarProveedor({ certificados: [{ tipo: 'CALIDAD', vigenteHasta: null }], aceptaCartaCredito: false }, true, hoy),
  { eliminado: true, motivos: ['No acepta carta de crédito (primer embarque)'], pendientes: [], puntaje: 1 }
)
igual(
  'en embarques siguientes no exigir carta de crédito',
  evaluarProveedor({ certificados: [{ tipo: 'CALIDAD', vigenteHasta: null }], aceptaCartaCredito: false }, false, hoy).eliminado,
  false
)
igual(
  'certificados todos vencidos elimina',
  evaluarProveedor({ certificados: [{ tipo: 'CALIDAD', vigenteHasta: dia('2025-01-01') }], aceptaCartaCredito: true }, true, hoy).motivos,
  ['Certificados vencidos']
)
igual(
  'si todavía no manda certificados ni responde sobre la carta, queda pendiente, no eliminado',
  evaluarProveedor({ certificados: [], aceptaCartaCredito: null }, true, hoy),
  { eliminado: false, motivos: [], pendientes: ['Certificados pendientes', 'Carta de crédito por confirmar'], puntaje: 0 }
)

grupo('Comparar cotizaciones')
igual('2.000 m a 0,79 + 500 codos a 0,35', totalCotizacion([{ compraLineaId: 'a', cantidad: 2000, precioUnitario: 0.79 }, { compraLineaId: 'b', cantidad: 500, precioUnitario: 0.35 }]), 1755)
igual('si falta un precio no hay total: no se inventa', totalCotizacion([{ compraLineaId: 'a', cantidad: 2000, precioUnitario: 0.79 }, { compraLineaId: 'b', cantidad: 500, precioUnitario: null }]), null)
igual('mismo incoterm y lugar: se comparan directo', avisoComparacion([{ moneda: 'USD', incoterm: 'FOB', lugar: 'Ningbo' }, { moneda: 'USD', incoterm: 'FOB', lugar: 'ningbo ' }]), null)
igual(
  'FOB Ambarlı contra EXW Hebei: avisa',
  avisoComparacion([{ moneda: 'USD', incoterm: 'FOB', lugar: 'Ambarlı' }, { moneda: 'USD', incoterm: 'EXW', lugar: 'Hebei' }]),
  'Las cotizaciones difieren en moneda, incoterm o lugar: los totales no son comparables directamente. Compara por landed cost.'
)

terminar()
