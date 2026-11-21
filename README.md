# Agente GESI — Curso práctico para crear un agente de IA

Este repositorio es un curso y, al mismo tiempo, el proyecto real: construir paso a paso
el **Agente GESI**, un asistente de IA para la operación de importaciones de GESI SpA.

Cada lección explica un concepto, lo programa y deja algo funcionando que sirve en el trabajo diario.

## Cómo está organizado

```
lecciones/    explicación de cada lección (leer primero)
agente/       el código del agente, que crece lección a lección
datos/        base de datos y archivos de ejemplo (cotizaciones, plantillas)
```

## Temario

### Parte 1 — Fundamentos
| # | Lección | Lo que queda funcionando |
|---|---|---|
| 0 | [Qué es un agente](lecciones/00-que-es-un-agente.md) | Entender las piezas y el diseño del Agente GESI |
| 1 | Entorno y primera llamada a Claude | Un script que conversa con Claude desde tu computador |
| 2 | Instrucciones del sistema | Claude responde con el rol y las reglas de GESI |
| 3 | Herramientas (tool use) | Claude usa una calculadora de landed cost |
| 4 | El ciclo del agente | El agente encadena varias herramientas solo hasta terminar |

### Parte 2 — Datos ordenados (lo que la primera app no logró)
| # | Lección | Lo que queda funcionando |
|---|---|---|
| 5 | Diseñar la base de datos | Proveedores, cotizaciones, productos e importaciones en un solo lugar |
| 6 | Herramientas sobre la base | El agente registra y consulta: "registra a Lvzhou", "¿quién no ha cotizado?" |
| 7 | Leer documentos | Cotizaciones en PDF, Excel o texto de WhatsApp pasan a datos estructurados |

### Parte 3 — El primer módulo útil: cotizaciones
| # | Lección | Lo que queda funcionando |
|---|---|---|
| 8 | Motor de cotizaciones | Filtro eliminatorio, puntaje, landed cost y tabla comparativa en Excel |
| 9 | Redactor de solicitudes | Solicitudes de cotización con el formato GESI |
| 10 | Control humano | Nada se envía ni se guarda sin tu aprobación |

### Parte 4 — Del script al agente de verdad
| # | Lección | Lo que queda funcionando |
|---|---|---|
| 11 | Skills y memoria | Los estándares de GESI escritos una vez y aplicados siempre |
| 12 | Claude Agent SDK | El agente migra a un framework profesional |
| 13 | Canales: correo y WhatsApp | El agente lee y prepara respuestas en Outlook y WhatsApp |
| 14 | Tareas programadas | Informe semanal de Mercado Libre automático |
| 15 | Operar en serio | Costos, registros, errores y cómo medir si el agente ayuda |

## Requisitos
- Python 3.11 o superior
- Una cuenta en la consola de Anthropic con clave de API (se ve en la lección 1)
- Ganas de romper cosas y arreglarlas
