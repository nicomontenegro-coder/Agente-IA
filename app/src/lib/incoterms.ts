/**
 * Incoterms 2020 y qué conceptos de costo cubre cada uno.
 *
 * La idea central: el precio que da un proveedor NO es comparable entre
 * incoterms. Un EXW de USD 10 y un CIF de USD 10 son precios muy distintos.
 * Para compararlos hay que llevarlos todos a un mismo punto: el Valor CIF,
 * que además es la base sobre la que Aduana calcula arancel e IVA.
 *
 * Modelamos el viaje de la mercadería como una secuencia de ETAPAS. El
 * incoterm define hasta qué etapa paga el vendedor (ya viene en el precio)
 * y desde cuál pagas tú.
 */

/** Etapas del costo, en orden real del viaje. */
export const STAGES = [
  'MERCADERIA',        // 1. Valor de la mercadería en fábrica (ex works)
  'TRANSPORTE_ORIGEN', // 2. Transporte interno en país de origen
  'DESPACHO_EXPO',     // 3. Despacho aduanero de exportación
  'THC_ORIGEN',        // 4. Gastos portuarios / handling en origen
  'FLETE',             // 5. Flete internacional
  'SEGURO',            // 6. Seguro internacional
  // ───────── hasta aquí se acumula el VALOR CIF (base aduanera) ─────────
  'ARANCEL',           // 7. Arancel ad valorem
  'IVA',               // 8. IVA de importación
  'THC_DESTINO',       // 9. Gastos portuarios / handling en destino
  'AGENTE_ADUANA',     // 10. Agente de aduana y trámites
  'SERVICIOS_ZF',      // 11. Servicios de zona franca (ZOFRI, Iquique…)
  'ALMACENAJE',        // 12. Almacenaje, demurrage, sobreestadía
  'TRANSPORTE_DESTINO' // 13. Transporte del puerto a tu bodega
] as const

export type Stage = (typeof STAGES)[number]

/** Última etapa que compone el Valor CIF. */
export const CIF_STAGES: Stage[] = [
  'MERCADERIA',
  'TRANSPORTE_ORIGEN',
  'DESPACHO_EXPO',
  'THC_ORIGEN',
  'FLETE',
  'SEGURO'
]

export const STAGE_LABEL: Record<Stage, string> = {
  MERCADERIA: 'Mercadería (ex works)',
  TRANSPORTE_ORIGEN: 'Transporte interno origen',
  DESPACHO_EXPO: 'Despacho aduanero exportación',
  THC_ORIGEN: 'Gastos portuarios origen (THC)',
  FLETE: 'Flete internacional',
  SEGURO: 'Seguro internacional',
  ARANCEL: 'Arancel ad valorem',
  IVA: 'IVA importación',
  THC_DESTINO: 'Gastos portuarios destino (THC)',
  AGENTE_ADUANA: 'Agente de aduana',
  SERVICIOS_ZF: 'Servicios de zona franca',
  ALMACENAJE: 'Almacenaje / demurrage',
  TRANSPORTE_DESTINO: 'Transporte a bodega'
}

export const INCOTERMS = [
  'EXW', 'FCA', 'FAS', 'FOB', 'CFR', 'CIF', 'CPT', 'CIP', 'DAP', 'DPU', 'DDP'
] as const

export type Incoterm = (typeof INCOTERMS)[number]

export const INCOTERM_LABEL: Record<Incoterm, string> = {
  EXW: 'EXW — En fábrica',
  FCA: 'FCA — Franco transportista',
  FAS: 'FAS — Franco al costado del buque',
  FOB: 'FOB — Franco a bordo',
  CFR: 'CFR — Costo y flete',
  CIF: 'CIF — Costo, seguro y flete',
  CPT: 'CPT — Transporte pagado hasta',
  CIP: 'CIP — Transporte y seguro pagados hasta',
  DAP: 'DAP — Entregado en lugar',
  DPU: 'DPU — Entregado y descargado',
  DDP: 'DDP — Entregado con derechos pagados'
}

/**
 * Etapas que YA vienen incluidas en el precio del proveedor, por incoterm.
 * Todo lo que no está en esta lista, lo pagas tú aparte.
 */
export const INCLUDED_STAGES: Record<Incoterm, Stage[]> = {
  EXW: ['MERCADERIA'],
  FCA: ['MERCADERIA', 'TRANSPORTE_ORIGEN', 'DESPACHO_EXPO'],
  FAS: ['MERCADERIA', 'TRANSPORTE_ORIGEN', 'DESPACHO_EXPO'],
  FOB: ['MERCADERIA', 'TRANSPORTE_ORIGEN', 'DESPACHO_EXPO', 'THC_ORIGEN'],
  CFR: ['MERCADERIA', 'TRANSPORTE_ORIGEN', 'DESPACHO_EXPO', 'THC_ORIGEN', 'FLETE'],
  CPT: ['MERCADERIA', 'TRANSPORTE_ORIGEN', 'DESPACHO_EXPO', 'THC_ORIGEN', 'FLETE'],
  CIF: ['MERCADERIA', 'TRANSPORTE_ORIGEN', 'DESPACHO_EXPO', 'THC_ORIGEN', 'FLETE', 'SEGURO'],
  CIP: ['MERCADERIA', 'TRANSPORTE_ORIGEN', 'DESPACHO_EXPO', 'THC_ORIGEN', 'FLETE', 'SEGURO'],
  DAP: [
    'MERCADERIA', 'TRANSPORTE_ORIGEN', 'DESPACHO_EXPO', 'THC_ORIGEN', 'FLETE',
    'SEGURO', 'THC_DESTINO', 'TRANSPORTE_DESTINO'
  ],
  DPU: [
    'MERCADERIA', 'TRANSPORTE_ORIGEN', 'DESPACHO_EXPO', 'THC_ORIGEN', 'FLETE',
    'SEGURO', 'THC_DESTINO', 'TRANSPORTE_DESTINO'
  ],
  DDP: [
    'MERCADERIA', 'TRANSPORTE_ORIGEN', 'DESPACHO_EXPO', 'THC_ORIGEN', 'FLETE',
    'SEGURO', 'ARANCEL', 'IVA', 'THC_DESTINO', 'AGENTE_ADUANA', 'TRANSPORTE_DESTINO'
  ]
}

export function isIncluded(incoterm: Incoterm, stage: Stage): boolean {
  return INCLUDED_STAGES[incoterm].includes(stage)
}

/** Etapas que tú debes pagar aparte con este incoterm. */
export function buyerStages(incoterm: Incoterm): Stage[] {
  return STAGES.filter((s) => !isIncluded(incoterm, s))
}

/**
 * Incoterms donde el precio del proveedor ya incluye costos POSTERIORES a la
 * llegada (DAP, DPU, DDP). En estos casos no basta con sumar: hay que RESTAR
 * esos costos del precio para poder reconstruir el Valor CIF, porque Aduana
 * no grava el transporte interno en destino ni los impuestos mismos.
 */
export function requiresDeduction(incoterm: Incoterm): boolean {
  return INCLUDED_STAGES[incoterm].some((s) => !CIF_STAGES.includes(s))
}

/** Etapas post-CIF que vienen embebidas en el precio y hay que deducir. */
export function deductibleStages(incoterm: Incoterm): Stage[] {
  return INCLUDED_STAGES[incoterm].filter((s) => !CIF_STAGES.includes(s))
}

/**
 * Cómo viaja la carga. Estaba escrito igual en tres pantallas: si una se
 * queda corta, la misma ruta se llama de dos formas distintas (regla 1).
 */
export const MODALIDAD_LABEL: Record<string, string> = {
  MARITIMO_FCL: 'Marítimo FCL',
  MARITIMO_LCL: 'Marítimo LCL',
  AEREO: 'Aéreo',
  TERRESTRE: 'Terrestre'
}
