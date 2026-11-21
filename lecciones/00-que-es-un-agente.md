# Lección 0 — Qué es un agente

## La idea en una frase

Un **agente** es un modelo de IA que, en lugar de solo responder, **persigue un objetivo usando herramientas**,
mira el resultado de cada paso y decide el siguiente, hasta terminar o necesitar que intervengas.

## La analogía: tu asistente de importaciones

Imagina que contratas a un asistente para GESI. Para que trabaje bien necesita cinco cosas,
y un agente de IA necesita exactamente las mismas:

| Asistente humano | Pieza del agente | En el Agente GESI |
|---|---|---|
| Su cabeza: entiende, razona, decide | **Modelo** (Claude) | Entiende una cotización en inglés con unidades raras |
| El manual de la empresa | **Instrucciones del sistema y skills** | Filtro eliminatorio, puntaje, formato de solicitud |
| Su escritorio: calculadora, correo, carpetas | **Herramientas** | Calcular landed cost, guardar cotización, buscar proveedor |
| El archivador de la empresa | **Datos / memoria** | Base con proveedores, cotizaciones, importaciones |
| Su forma de trabajar: hacer, revisar, corregir | **El ciclo del agente** | Pensar → usar herramienta → ver resultado → repetir |

Y una sexta, que es tu rol: **el jefe que aprueba**. El agente prepara, tú decides.

## El ciclo, paso a paso

Le dices: *"Llegó la cotización de Lvzhou, compárala con las otras."*

```
1. PIENSA     "Necesito leer la cotización y traer las anteriores."
2. ACTÚA      usa la herramienta leer_documento(cotizacion_lvzhou.pdf)
3. OBSERVA    obtiene precio FOB, MOQ, plazo, incoterm
4. PIENSA     "Falta el landed cost para compararlas en igualdad."
5. ACTÚA      usa calcular_landed_cost(...)
6. OBSERVA    obtiene el costo puesto en bodega
7. ACTÚA      usa buscar_cotizaciones(producto="tubería preaislada")
8. PIENSA     "Tengo todo. Aplico filtro y puntaje."
9. RESPONDE   tabla comparativa + recomendación → TÚ apruebas
```

Nadie le dijo el orden de los pasos: **el modelo los decide**. Eso es lo que lo hace un agente
y no un programa tradicional, donde cada paso está escrito de antemano.

## Agente vs. lo que ya conoces

- **Claude en el chat:** solo tiene lo que le pegas y te devuelve texto. Tú haces el trabajo con esa respuesta.
- **Una automatización clásica (Zapier, macros):** pasos fijos. Si la cotización llega en otro formato, falla.
- **Un agente:** decide los pasos, se adapta al formato y usa tus herramientas y tus datos.

## La lección de tu primera app

Tu app se desordenó porque eran muchas piezas que no conversaban entre sí. Es el error más común,
y el Agente GESI se diseña al revés desde el principio:

1. **Una sola base de datos** como fuente de verdad. Ninguna pieza guarda datos por su cuenta.
2. **Un solo cerebro** (el agente) que conoce todas las herramientas.
3. **Módulos que crecen de a uno:** primero cotizaciones; después Mercado Libre y el comercial de tubería.
   Cada uno funciona solo antes de sumar el siguiente.

## El diseño del Agente GESI

```
   Tú (terminal; después correo y WhatsApp)
                    │
           ┌────────▼────────┐
           │   Agente GESI   │
           │ modelo + reglas │
           └────────┬────────┘
                    │ usa herramientas
   ┌────────────────┼────────────────┐
   ▼                ▼                ▼
 leer_          calcular_       registrar /
 documento      landed_cost     buscar ...
   └────────────────┼────────────────┘
                    ▼
           ┌─────────────────┐
           │  Base de datos  │
           │ proveedores,    │
           │ cotizaciones,   │
           │ productos,      │
           │ importaciones   │
           └─────────────────┘
```

## Para pensar antes de la lección 1

Reúne estos materiales; los usaremos a lo largo del curso:

1. Dos o tres cotizaciones reales (PDF, Excel o capturas de WhatsApp).
2. Tu filtro eliminatorio: qué descarta a un proveedor de inmediato.
3. Tu puntaje: criterios y peso de cada uno.
4. Tu cálculo de landed cost (la planilla o la fórmula).
5. El formato con que pides cotizaciones.
