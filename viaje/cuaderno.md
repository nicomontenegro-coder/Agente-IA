# Cuaderno de ejercicios

Responde en papel o en la app de notas del celular. Al volver, pega tus respuestas en Claude
y pide: **"revisa mis ejercicios del viaje"**. Después podrás tomar las evaluaciones oficiales.

---

## Ejercicios de la Lección 0 — Qué es un agente

**0.1** Con tus palabras, ¿qué diferencia a un agente de Claude en el chat y de una automatización
tipo Zapier? Usa un ejemplo de GESI.

**0.2** Escribe el ciclo *piensa → actúa → observa* para esta instrucción:
*"Avísame qué prospectos de tubería no han respondido en 7 días y prepárales un mensaje."*
¿Qué herramientas necesitaría el agente? ¿En qué paso apruebas tú?

**0.3** Nombra una tarea de tu trabajo que **no** conviene darle a un agente y explica por qué.

---

## Ejercicios de la Lección 1 — Mapa del negocio

**1.1 — Event Storming del P2P (el ejercicio principal, unos 60 minutos)**
Elige una línea: tubería de Lvzhou o cerco de Ikon.

1. Escribe al menos **25 eventos en pasado**, sin orden.
2. Ordénalos en una línea de tiempo.
3. Marca con ⭐ los **eventos pivote**.
4. Agrega a 5 eventos su **comando** y su **actor**.
5. Escribe al menos 3 **políticas** ("cuando X, entonces Y").
6. Marca con 🔴 al menos 4 **puntos calientes**, y estima cuántos minutos por semana te cuesta cada uno.

**1.2 — O2C**
Haz una versión corta (10 a 15 eventos) del ciclo de venta de tubería a una salmonera.
¿Dónde se toca con el P2P?

**1.3 — SCOR**
Revisa los 7 procesos SCOR. ¿Cuál haces "en la cabeza", sin registro? ¿Qué riesgo tiene eso?

**1.4 — Incoterms**
Dos cotizaciones para el mismo tubo: A) US$ 18/m FOB Ningbo; B) US$ 21/m CIF San Antonio.
¿Por qué no puedes decir que A es más barata? ¿Qué datos te faltan para compararlas?

**1.5 — BPMN**
Dibuja con los 5 símbolos el proceso "llega un mensaje de un proveedor por WhatsApp",
con dos carriles: *Agente GESI* y *Nico*. ¿Qué decide el agente solo y qué apruebas tú?

**1.6 — Línea base**
Copia la tabla de línea base de la lección y llénala con tu **estimación** de una semana normal.
Luego escribe 3 **criterios de éxito** medibles y con plazo.

---

## Ejercicios de la Lección 2 — Del mapa al modelo

**2.1 — Glosario GESI**
Escribe al menos 15 términos con su definición GESI y con qué **no** confundirlo.
Incluye como mínimo: proveedor, contacto, producto, SKU, RFQ, cotización, OC, PI, embarque,
landed cost, prospecto, cliente, MOQ, lead time, incoterm.

**2.2 — Contextos**
¿Qué significa "cliente" en Ventas B2B, en Mercado Libre y en la triangulación de lámparas GW3?
¿Conviene que sea una sola entidad o varias? Justifica.

**2.3 — Entidad u objeto de valor**
Clasifica: Proveedor · US$ 18,50 · FOB Ningbo · Contenedor 40' HC · Embarque de noviembre ·
Dirección de bodega · Contacto de Lvzhou · Medidas del rollo.

**2.4 — Modelo ER**
Dibuja el modelo de **Ventas B2B**: Prospecto, Cliente, Contacto, CotizaciónCliente, Pedido, Producto.
Marca claves primarias, foráneas y el tipo de cada relación.

**2.5 — Máquina de estados**
Diseña los estados de un **Prospecto** de tubería, desde que lo identificas hasta que compra
o se descarta. Indica el evento que provoca cada transición y al menos una guarda.

**2.6 — Normalización**
En tu primera app, ¿qué dato estaba repetido en varios lugares? ¿Qué problema causó?
¿Cómo se resolvería con IDs?

---

## Ejercicios de la Lección 3 — Método de trabajo

**3.1 — Pruebas primero**
Con el ejemplo de landed cost de la lección, calcula a mano:
a) El landed cost por metro si el flete sube a US$ 4.200.
b) El landed cost total si además no hay certificado de origen (arancel 6 %).
Escribe ambos como pruebas: *"con esta entrada, el resultado debe ser…"*.

**3.2 — Más pruebas**
Escribe 3 pruebas más para la calculadora que representen **reglas de negocio** de GESI.

**3.3 — Eval**
Diseña la eval para el lector de cotizaciones: ¿qué casos reales juntarías, qué campos revisarías
y desde qué tasa de acierto lo considerarías usable?

**3.4 — Núcleo u hoja**
Clasifica y justifica: fórmula de landed cost · color de la tabla en Excel · filtro eliminatorio ·
texto de saludo de una RFQ · estados de la importación · nombre del archivo de un informe.

**3.5 — Contexto**
Escribe el pedido completo (los 5 puntos) que le harías a Claude para construir
el **redactor de RFQ**.

**3.6 — Tu experiencia**
¿Cuál de tus 7 reglas de la primera app te habría ahorrado más problemas si la hubieras aplicado
desde el día 1? ¿Por qué?

---

# Autoevaluación de práctica

Preguntas para repasar durante el viaje. Las respuestas están al final.
Las evaluaciones oficiales tendrán preguntas nuevas, generadas al momento.

### Lección 0

1. ¿Cuáles son las 5 piezas de un agente?
2. Verdadero o falso: en un agente, el programador escribe de antemano el orden de los pasos.
3. ¿Qué rol cumples tú en el Agente GESI?

### Lección 1

4. ¿Qué significan P2P y O2C?
5. ¿Qué es el three-way match y qué compara?
6. Verdadero o falso: los Incoterms definen quién es dueño de la mercadería.
7. ¿Por qué un precio siempre debe guardarse con incoterm y lugar?
8. En Event Storming, ¿en qué tiempo verbal se escriben los eventos y qué son los puntos calientes?
9. Nombra los 7 procesos de SCOR.
10. ¿Por qué hay que medir la línea base antes de construir el agente?

### Lección 2

11. ¿Qué es el lenguaje común (ubicuo) en DDD?
12. ¿Qué es un contexto delimitado? Da un ejemplo con "producto".
13. ¿Diferencia entre entidad y objeto de valor?
14. ¿Por qué la cotización guarda `proveedor_id` en vez del nombre del proveedor?
15. ¿Cuándo está bien copiar un dato en vez de referenciarlo?
16. ¿Qué es una guarda en una máquina de estados?

### Lección 3

17. ¿Cuáles son las dos capas de verificación y con qué se verifica cada una?
18. ¿Por qué el IVA de importación normalmente no se suma al landed cost?
19. ¿Diferencia entre CLAUDE.md y un hook?
20. ¿Qué tres cosas deben cumplirse para dar algo por terminado?

---

# Respuestas de la autoevaluación

1. Modelo, instrucciones/skills, herramientas, datos/memoria y el ciclo del agente
   (más el control humano: tú apruebas).
2. **Falso.** El modelo decide los pasos según el objetivo y lo que observa. Eso lo distingue de un programa tradicional.
3. El jefe que aprueba: el agente prepara y tú decides los envíos a terceros y los cambios importantes.
4. P2P: Procure-to-Pay, de la necesidad de compra al pago al proveedor.
   O2C: Order-to-Cash, del interés del cliente al cobro.
5. Un control antes de pagar: compara que la **orden de compra**, lo **recibido** y la **factura** coincidan.
6. **Falso.** Definen costos, riesgos y obligaciones de entrega, no la propiedad ni la forma de pago.
7. Porque el mismo número significa costos distintos según quién paga flete, seguro y gastos.
   Sin incoterm y lugar no se puede comparar ni calcular el landed cost.
8. En **pasado** ("cotización recibida"). Los puntos calientes son problemas o dudas:
   donde se pierde tiempo o hay errores, y por eso donde más aporta el agente.
9. Orchestrate, Plan, Order, Source, Transform, Fulfill, Return.
10. Porque sin saber cuánto toma hoy una tarea es imposible demostrar si el agente ahorra tiempo o evita errores.
11. Que cada concepto tenga un solo nombre y una sola definición, usados igual en la conversación,
    el código, la base de datos y el agente.
12. Un área del negocio con límites claros donde cada término tiene un significado preciso.
    "Producto" en Abastecimiento es lo que vende el proveedor (código, MOQ); en Mercado Libre es
    una publicación (título, fotos, precio de venta).
13. La entidad tiene identidad propia que se mantiene aunque cambien sus datos (Proveedor).
    El objeto de valor se define solo por sus datos (US$ 18,50; FOB Ningbo).
14. Porque el ID no cambia nunca y el nombre se puede escribir de muchas formas.
    Con el ID la relación no se rompe.
15. Cuando el dato debe quedar **congelado en el tiempo**. Por ejemplo, el precio en una OC,
    que es un compromiso aunque después llegue otra cotización.
16. Una condición que debe cumplirse para permitir una transición.
    Por ejemplo: solo se puede seleccionar una cotización que esté evaluada.
17. **Código**, que se verifica con pruebas automáticas. **Agente**, que se verifica con evals sobre casos reales.
18. Porque para una empresa con giro el IVA de importación normalmente es **crédito fiscal**:
    se recupera, así que no es un costo del producto.
19. CLAUDE.md es un consejo que Claude puede saltarse; un hook es una regla que se ejecuta siempre, automáticamente.
20. Las pruebas pasan, las evals no empeoran y alguien miró el resultado y se ve bien.

---

# Soluciones del ejercicio 3.1

a) CIF = 20.000 + 4.200 + 120 = 24.320. Total = 24.320 + 0 + 450 + 600 + 2.800 = **28.170**.
   Por metro = **28,17**.

b) Arancel 6 % × 24.320 = 1.459,20. Total = 28.170 + 1.459,20 = **29.629,20**.
   Por metro = **29,63** (redondeado).
