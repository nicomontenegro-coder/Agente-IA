/**
 * Códigos GESI: GESI-CP3 (compra 3) y GESI-OC7 (orden de compra 7).
 * Van en el asunto de la RFQ y en todos los documentos, para encontrar las
 * respuestas y cruzar papeles.
 */

export type TipoCodigo = 'compra' | 'orden'

const LETRAS: Record<TipoCodigo, string> = { compra: 'CP', orden: 'OC' }

export function codigo(tipo: TipoCodigo, numero: number | null | undefined): string | null {
  return numero ? `GESI-${LETRAS[tipo]}${numero}` : null
}
