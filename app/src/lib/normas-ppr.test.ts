/**
 * Pruebas del paso de medidas de tubo PPR a serie y PN.
 * Correr con:  npx tsx src/lib/normas-ppr.test.ts
 *
 * Casos reales: los tres grupos de tubos de la lista de Lvzhou (05-11-2026).
 */

import { leerMedida, pnDeTubo, seccionDe } from './normas-ppr'
import { igual, grupo, terminar } from './prueba'

grupo('Leer la medida')
igual('20×2.8 es diámetro 20 y pared 2,8', leerMedida('20×2.8'), { diametro: 20, espesor: 2.8 })
igual('también con x y con coma', [leerMedida('25x3,5'), leerMedida('110 X 15.1')], [{ diametro: 25, espesor: 3.5 }, { diametro: 110, espesor: 15.1 }])
igual('una medida de fitting (solo diámetro) no es un tubo', leerMedida('20'), null)
igual('una reducción 32×20 no es un tubo', leerMedida('32×20'), null)

grupo('Serie y PN según la norma')
igual('20×2.8: SDR 7,1 → serie S3.2 → PN16 en DIN 8077', pnDeTubo('20×2.8'), { sdr: 7.1, serie: 'S3.2', pn: 'PN16', norma: 'DIN 8077' })
igual('32×4.4 es la misma serie: PN16', pnDeTubo('32×4.4')?.pn, 'PN16')
igual('20×3.4: SDR 5,9 → S2.5 → PN20', pnDeTubo('20×3.4'), { sdr: 5.9, serie: 'S2.5', pn: 'PN20', norma: 'DIN 8077' })
igual('20×2.3: SDR 8,7 → S4, que la DIN 8077 no define: sin PN, no se inventa', pnDeTubo('20×2.3'), { sdr: 8.7, serie: 'S4', pn: null, norma: 'DIN 8077' })
igual('un espesor que no calza con ninguna serie (SDR 6,45) no se fuerza', pnDeTubo('20×3.1'), null)
igual('un fitting no tiene PN por medida', pnDeTubo('20'), null)

grupo('Secciones de la lista de venta')
igual('el tubo 20×2.8 va en la sección PN16, como la hoja «Tubos PN16»', seccionDe('Tubería PPR', '20×2.8'), 'Tubería PPR · PN16 (DIN 8077)')
igual('el 20×3.4 va en PN20', seccionDe('Tubería PPR', '20×3.4'), 'Tubería PPR · PN20 (DIN 8077)')
igual('el 20×2.3 no tiene PN en la norma: queda en la familia', seccionDe('Tubería PPR', '20×2.3'), 'Tubería PPR')
igual('un fitting queda en su familia', seccionDe('Fittings PPR', '20'), 'Fittings PPR')
igual('un PN aprobado a mano manda', seccionDe('Tubería PPR', '20×2.3', 'PN16 (otra norma)'), 'Tubería PPR · PN16 (otra norma)')

terminar()
