/**
 * Códigos GESI: GESI-CP3 (compra 3) y GESI-OC7 (orden de compra 7).
 * Van en el asunto de la RFQ y en todos los documentos, para encontrar las
 * respuestas y cruzar papeles.
 */

export type TipoCodigo = 'compra' | 'orden' | 'oferta'

const LETRAS: Record<TipoCodigo, string> = { compra: 'CP', orden: 'OC', oferta: 'OF' }

export function codigo(tipo: TipoCodigo, numero: number | null | undefined): string | null {
  return numero ? `GESI-${LETRAS[tipo]}${numero}` : null
}

/**
 * El próximo número de un correlativo se puede elegir (partir la OC en 1001
 * se ve más serio que en 1), pero solo hacia arriba: si bajara, dos documentos
 * terminarían con el mismo número.
 */
export function validarProximoNumero(proximo: number | null, ultimoUsado: number): string | null {
  if (proximo == null || !Number.isInteger(proximo) || proximo < 1) return 'Ingresa un número entero mayor que cero'
  if (proximo <= ultimoUsado) return `Debe ser mayor que ${ultimoUsado}, el último número ya usado`
  return null
}
