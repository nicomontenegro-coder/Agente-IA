# Lección 1 — Mapa del negocio con estándares

## Por qué empezamos aquí

Tu primera app se desordenó porque se construyeron piezas sin un plano. En esta lección haremos
ese plano, pero sin inventarlo: usaremos los modelos que las empresas del mundo ya probaron.

Al terminar sabrás:

- Qué es un proceso de negocio y cuáles son los ciclos estándar.
- Cómo se ven los procesos de GESI dentro de esos ciclos.
- Qué son SCOR, BPMN e Incoterms, y para qué sirve cada uno en el agente.
- Cómo armar el mapa con la técnica Event Storming.
- Cómo medir tu punto de partida (línea base) y definir qué será un éxito.

---

## 1. Qué es un proceso de negocio

Un **proceso** es una serie de actividades que parte con un disparador y termina con un resultado
que le importa a alguien.

- **Disparador:** "necesito tubería para la temporada de invierno".
- **Actividades:** buscar proveedores, pedir cotizaciones, comparar, negociar, comprar, importar.
- **Resultado:** tubería en bodega en Punta Arenas a un costo conocido.

La clave: un proceso **cruza áreas y herramientas**. La cotización llega por WhatsApp,
se compara en Excel, el pago sale del banco y el contenedor se sigue por correo con el forwarder.
Si cada herramienta guarda su propia versión, el proceso se rompe en cada cruce.
Eso es lo que le pasó a tu app.

---

## 2. Los tres ciclos estándar

Casi todas las empresas comerciales funcionan con los mismos ciclos. Los ERP del mundo
(SAP, Odoo, Oracle) están construidos alrededor de ellos. Tienen nombre en inglés porque así
se buscan en cualquier libro o curso.

### 2.1 Procure-to-Pay (P2P): de la necesidad al pago al proveedor

```
Necesidad
  → Búsqueda de proveedores
  → Solicitud de cotización (RFQ)
  → Cotizaciones recibidas
  → Evaluación y selección
  → Negociación
  → Orden de compra (OC / PO)
  → Proforma invoice (PI) del proveedor
  → Pago de anticipo
  → Producción e inspección
  → Pago de saldo
  → Recepción de la mercadería
  → Factura y cierre
```

Términos estándar que conviene usar desde hoy:

| Término | Sigla | Qué es en GESI |
|---|---|---|
| Request for Quotation | RFQ | El mensaje en que pides precio a Lvzhou o a Ikon |
| Quotation | — | La respuesta con precios, MOQ, plazo e incoterm |
| Purchase Order | PO / OC | Tu compromiso de compra formal |
| Proforma Invoice | PI | El documento del proveedor que confirma el pedido y contra el que pagas |
| Minimum Order Quantity | MOQ | La cantidad mínima que acepta el proveedor |
| Lead time | — | Tiempo desde que pagas el anticipo hasta que la mercadería está lista |

Un control clásico de este ciclo es el **three-way match** (calce de tres vías): antes de pagar
el saldo se compara que **la OC, lo recibido y la factura** digan lo mismo. Si el proveedor
factura 1.000 m y embarcó 950, el calce lo detecta.

### 2.2 Ciclo de importación: del embarque a la bodega

En las empresas que importan, el P2P tiene un tramo propio:

```
Mercadería lista
  → Reserva de espacio (booking) con el forwarder
  → Carga y zarpe
  → Bill of Lading (BL): el título de la carga
  → Tránsito marítimo
  → Llegada a puerto chileno
  → Agente de aduana tramita la Declaración de Ingreso (DIN)
  → Pago de derechos e IVA
  → Retiro del puerto
  → Transporte a bodega (por ejemplo, a Punta Arenas)
```

De aquí sale el **landed cost**: el costo real del producto puesto en tu bodega, con todo incluido.
Es la única forma justa de comparar proveedores, porque un precio bajo en China puede terminar
siendo caro en Punta Arenas.

> Dato útil para Chile: el arancel general es 6 % sobre el valor CIF, pero Chile tiene tratados
> con China, Turquía, Vietnam y la Unión Europea (Polonia). Con certificado de origen el arancel
> puede bajar, muchas veces a 0 %. Hay que verificarlo por producto. El IVA de importación (19 %)
> en general es **crédito fiscal** para una empresa, así que normalmente no se suma al landed cost.
> Lo veremos con números en la lección 3.

### 2.3 Order-to-Cash (O2C): del interés del cliente al cobro

```
Prospecto
  → Contacto y calificación
  → Cotización al cliente
  → Negociación
  → Pedido / orden de compra del cliente
  → Despacho
  → Factura (documento tributario electrónico del SII)
  → Cobro
  → Conciliación del pago
```

En GESI tienes varias versiones de este ciclo:

- **Tubería preaislada:** salmoneras y ferreterías de Punta Arenas y Puerto Natales. Ciclo B2B clásico.
- **Lámparas GW3:** contratos anuales con Perú. O2C con un cliente extranjero, en el que además
  la mercadería viaja directo de China a Perú (triangulación), así que tu P2P y tu O2C se tocan
  en el mismo embarque.
- **Mercado Libre:** publicación → venta → despacho → liquidación de Mercado Libre (que te paga
  descontando comisión y envío).

### 2.4 Lo que une los ciclos

Los ciclos no están aislados:

- Una **venta** a una salmonera (O2C) puede disparar una **compra** a Lvzhou (P2P).
- El **landed cost** (importación) define el **precio mínimo** de venta (O2C).
- El **stock** une lo que entra (P2P) con lo que sale (O2C).

Estos puntos de unión son exactamente donde tu primera app "no conversaba".
En la lección 2 los convertiremos en relaciones explícitas.

---

## 3. SCOR: el modelo de referencia de la cadena de suministro

**SCOR** (Supply Chain Operations Reference) es mantenido por la asociación ASCM.
Su versión actual (SCOR Digital Standard) organiza una cadena de suministro en siete procesos:

| Proceso SCOR | Significa | En GESI |
|---|---|---|
| Orchestrate | Dirigir y coordinar la cadena | Tus decisiones de qué líneas de negocio impulsar |
| Plan | Planificar demanda y abastecimiento | Cuánta tubería traer para el invierno |
| Order | Recibir y gestionar pedidos de clientes | Pedidos de salmoneras, ventas en Mercado Libre |
| Source | Abastecerse de proveedores | Todo tu trabajo con Lvzhou, Ikon y Alibaba |
| Transform | Transformar o producir | Poco en GESI: etiquetado con marca propia (OEM) |
| Fulfill | Entregar al cliente | Despachos a Punta Arenas, envíos de Mercado Libre |
| Return | Devoluciones | Devoluciones de Mercado Libre, reclamos de calidad |

**Para qué te sirve:**

1. **Lista de chequeo:** si un proceso SCOR no aparece en tu mapa, probablemente lo estás haciendo
   "en la cabeza". Por ejemplo, ¿dónde está tu proceso de devoluciones?
2. **Métricas estándar:** SCOR define cómo medir. Dos que te sirven desde ya:
   - **Pedido perfecto:** porcentaje de pedidos entregados completos, a tiempo, sin daños y con la documentación correcta.
   - **Tiempo de ciclo:** días desde que pides la cotización hasta que la mercadería está en bodega.

No necesitas certificarte en SCOR. Úsalo como checklist y como diccionario de métricas.

---

## 4. BPMN: la forma estándar de dibujar procesos

**BPMN 2.0** (Business Process Model and Notation) es un estándar de la organización OMG.
Cualquier consultor, programador o herramienta de procesos lo entiende. Solo necesitas cinco símbolos:

| Símbolo | Forma | Significa | Ejemplo GESI |
|---|---|---|---|
| Evento | Círculo | Algo que pasa | "Llegó cotización" |
| Actividad | Rectángulo redondeado | Algo que alguien hace | "Calcular landed cost" |
| Compuerta | Rombo | Una decisión o bifurcación | "¿Pasa el filtro eliminatorio?" |
| Flujo | Flecha | El orden | De una actividad a la siguiente |
| Carril | Franja horizontal | Quién lo hace | Tú, el proveedor, el forwarder, el agente de IA |

Ejemplo en texto de la evaluación de una cotización:

```
(Cotización recibida)
   → [Revisar formato]
   → <¿Formato GESI?>
        no → [Pedir reenvío] → fin
        sí → [Aplicar filtro]
   → <¿Pasa filtro?>
        no → [Descartar] → fin
        sí → [Puntaje + landed cost]
   → [Agregar a comparación]
   → (Cotización evaluada)
```

Los **carriles** son especialmente útiles para el agente: dibujar un carril "Agente GESI"
y otro "Nico" deja a la vista qué hará el agente y qué tendrás que aprobar tú.

---

## 5. Incoterms 2020: las reglas del precio

Los **Incoterms** son reglas de la Cámara de Comercio Internacional (ICC). La versión vigente es 2020
y tiene 11 términos. Definen **quién paga qué costo, quién asume el riesgo y hasta dónde**.
Ojo: no definen quién es dueño de la mercadería ni cómo se paga.

| Grupo | Términos | Idea |
|---|---|---|
| E | EXW | Retiras en la fábrica; tú pagas todo desde ahí |
| F | FCA, FAS, FOB | El vendedor entrega en el país de origen; tú pagas el flete principal |
| C | CFR, CIF, CPT, CIP | El vendedor paga el flete principal, pero el riesgo pasa a ti en origen |
| D | DAP, DPU, DDP | El vendedor entrega en destino |

FAS, FOB, CFR y CIF son solo para transporte marítimo. Para contenedores, la ICC recomienda
FCA, CPT o CIP, aunque en la práctica FOB y CIF siguen siendo muy usados con China.

**Por qué importa para el agente:**

Un precio sin incoterm y sin lugar **no se puede comparar**. "US$ 18/m FOB Ningbo" y
"US$ 21/m CIF San Antonio" no se comparan entre sí: hay que llevarlos al mismo punto,
que es el landed cost en tu bodega.

Por eso, en el modelo de datos de GESI, un precio siempre se guardará como **monto + moneda +
incoterm + lugar**. Nunca solo el número. Este es uno de los errores más comunes de los sistemas
caseros y el agente tiene que evitarlo desde el diseño.

---

## 6. Event Storming: cómo construir el mapa

**Event Storming** es una técnica creada por Alberto Brandolini. Se usa en talleres con notas
adhesivas, pero funciona igual en papel o en el celular.

### Las piezas

| Color tradicional | Pieza | Cómo se escribe | Ejemplo |
|---|---|---|---|
| Naranja | **Evento** | En pasado, lo que ocurrió | "Cotización recibida" |
| Azul | **Comando** | Una orden o acción | "Solicitar cotización" |
| Amarillo | **Actor** | Quién da el comando | Nico, proveedor, agente |
| Lila | **Política** | "Cuando X, entonces Y" | "Cuando llega una cotización, se aplica el filtro" |
| Rosado | **Sistema externo** | Algo fuera de tu control | WhatsApp, Aduana, Mercado Libre |
| Rojo | **Punto caliente** | Un problema o una duda | "Aquí pierdo 30 minutos copiando datos" |

### Los pasos

1. **Lluvia de eventos.** Anota todos los eventos de tu negocio que se te ocurran, sin orden.
   Solo eventos, en pasado. Apunta a 30 o más.
2. **Línea de tiempo.** Ordénalos de izquierda a derecha según cuándo ocurren.
3. **Eventos pivote.** Marca los que cambian de etapa. Por ejemplo, "OC emitida" separa
   la búsqueda de la compra, y "Mercadería internada" separa la importación de la venta.
4. **Comandos y actores.** Antes de cada evento, anota qué acción lo causa y quién la hace.
5. **Políticas.** Anota las reglas automáticas. Muchas serán tareas del agente.
6. **Puntos calientes.** Marca en rojo donde se te va el tiempo o donde hay errores.
   **Ahí está el valor del agente.**

### Ejemplo con la tubería de Lvzhou

```
Necesidad de tubería detectada
→ Proveedores candidatos identificados
→ RFQ enviada                 (comando: Nico envía RFQ)
→ Cotización recibida         (política: aplicar filtro)
   🔴 llega en formato distinto, hay que pasarla a mano
→ Cotización evaluada
→ Proveedor seleccionado      ← evento pivote
→ OC emitida
→ PI recibida
→ Anticipo pagado
→ Producción terminada
→ Inspección aprobada
→ Saldo pagado
→ Carga embarcada             (sistema externo: naviera)
→ BL recibido
→ Carga arribada
→ DIN aceptada                (sistema externo: Aduana)
→ Mercadería internada        ← evento pivote
→ Mercadería en bodega
```

**Conexión con el agente:** los **eventos** serán los cambios de estado de tus datos (lección 2),
las **políticas** serán reglas del agente y los **puntos calientes** serán su lista de prioridades.

---

## 7. Línea base y criterios de éxito

Antes de construir algo para ahorrar tiempo hay que saber **cuánto tiempo toma hoy**.
Si no, nunca sabrás si el agente sirve.

### La línea base

Durante una semana normal, anota para cada tarea repetitiva:

| Tarea | Veces por semana | Minutos cada vez | Errores o retrabajos | Comentario |
|---|---|---|---|---|
| Redactar RFQ | | | | |
| Responder mensajes de proveedores | | | | |
| Pasar cotizaciones a la matriz | | | | |
| Calcular landed cost | | | | |
| Revisar Mercado Libre | | | | |
| Seguimiento a prospectos | | | | |

No tiene que ser perfecto. Una estimación honesta anotada en el momento vale más
que un recuerdo al final de la semana.

### Criterios de éxito

Un buen criterio de éxito es **medible** y tiene **plazo**. Ejemplos:

- ❌ "Que el agente me ayude con las cotizaciones."
- ✅ "En la semana de uso real (lección 19), el tiempo para pasar una cotización a la matriz
  baja de 20 a 5 minutos, con cero errores de landed cost."
- ✅ "Apruebo sin editar al menos el 70 % de los borradores de RFQ."

---

## Resumen

- Tu negocio ya calza en ciclos estándar: **P2P**, **importación** y **O2C**.
- **SCOR** sirve como checklist de procesos y como fuente de métricas.
- **BPMN** es el idioma estándar para dibujar procesos, y sus carriles muestran qué hace el agente y qué apruebas tú.
- **Incoterms**: un precio sin incoterm y lugar no se puede comparar.
- **Event Storming** construye el mapa con eventos en pasado; los puntos calientes muestran dónde aporta el agente.
- **Línea base y criterios de éxito**: sin medir antes, no hay cómo saber si el agente sirve.
