# Skills en construcción

Reglas que el agente aprendió de documentos reales mientras se construía la app. Hoy viven como
instrucciones del lector o como cálculos de la app; cuando se construya el Agente GESI, cada grupo
pasa a ser una **skill** que el agente carga cuando la necesita, en cualquier tarea.

Cada regla dice de qué error salió: así se entiende por qué existe.

## Skill: Leer cotizaciones de proveedores

| Regla | De dónde salió |
|---|---|
| Los números tal cual: no recalcular ni corregir montos. La app rehace las cuentas y avisa. | Diseño: si la IA corrige un monto, esconde un error del documento. |
| Si el proveedor cotiza un monto global (el galpón completo) y GESI pidió en m², informar el monto global; la app divide sin redondear. | Ridge: 68,91 × 722 m² daba 49.753,02 y el documento decía 49.752,16. |
| Decir en qué unidad viene cada precio; si no es la pedida, no convertir: la app pregunta y convierte. | Lvzhou: precio por metro, compra pedida en unidades, sin aviso. |
| Si el documento es una lista de precios (catálogo), tomar solo lo pedido y dejar el desglose vacío. | Lvzhou: copió 34 tubos del catálogo como si fueran la cubicación. |
| Preguntar solo lo que mueve un número o una decisión (plazo en rango, monto estimado, carta de crédito). Lo demás, como nota. | Ridge: «30-45 días» llegaba como texto que había que interpretar a mano. |
| La carta de crédito es «sí» solo si el documento la menciona; si no, «no lo dice». | Regla GESI: sin carta de crédito en el primer embarque, el proveedor queda eliminado. |

## Skill: Tubería PPR

| Regla | De dónde salió |
|---|---|
| El PN no se adivina: SDR = diámetro ÷ espesor, y la serie y el PN salen de la tabla de la norma. Lo calcula la app, no la IA. | Lvzhou: la lista no dice PN; la IA eligió 20×2.8 «por espesor». |
| Decir siempre según qué norma: el mismo tubo puede llamarse PN16 en una norma y «PN20» en otra (por verificar con las normas). | Conversación del 26-11-2026, antes de construir el cálculo. |

## Skill: Costo landed y precio de venta

| Regla | De dónde salió |
|---|---|
| Landed estimado = FOB × factor de internación de la familia. Factor por familia, no uno solo: el flete se cobra por volumen. | Un factor único abarata los tubos (mucho aire por dólar) y encarece los codos. |
| Todo factor dice de dónde salió (qué costeo, qué embarque). | Regla de Importa: todo número dice de dónde viene. |
| El margen es sobre el precio de venta, no markup: precio = costo ÷ (1 − margen). | Misma convención que las ofertas de Importa. |
| Una lista de proveedor vencida no se borra: queda con su fecha, y se avisa antes de vender sobre ella. | Lvzhou: lista del 05-11 con 10 días de validez. |
| Al cliente nunca se le muestran costos, factores ni márgenes. | Regla de Importa. |
