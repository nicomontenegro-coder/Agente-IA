# Agente GESI — Curso práctico para crear un agente de IA

Este repositorio es un curso y, al mismo tiempo, el proyecto real: construir paso a paso
el **Agente GESI**, un asistente de IA para la operación de importaciones de GESI SpA.

Cada lección enseña conceptos (los estándares que usa la industria), los aplica a GESI
y deja algo funcionando. Al final de cada lección hay una **evaluación** para comprobar lo aprendido.

## Cómo está organizado

```
lecciones/      explicación de cada lección (leer primero)
evaluaciones/   sistema de evaluación y registro de tu progreso
agente/         el código del agente, que crece lección a lección
datos/          base de datos y archivos de ejemplo
CLAUDE.md       instrucciones para que Claude actúe como tutor y evaluador
```

## Cómo avanzar

1. Lee la lección.
2. Haz el ejercicio práctico.
3. Pide a Claude: **"evalúame la lección N"**.
4. Si apruebas (80 % o más), queda registrado en [evaluaciones/progreso.md](evaluaciones/progreso.md) y pasas a la siguiente.

Detalle del sistema: [evaluaciones/SISTEMA.md](evaluaciones/SISTEMA.md).

## Temario

### Parte 0 — Diseño: entender el negocio antes de programar
| # | Lección | Conceptos | Lo que queda hecho |
|---|---|---|---|
| 0 | [Qué es un agente](lecciones/00-que-es-un-agente.md) | Modelo, herramientas, ciclo del agente, control humano | Diseño general del Agente GESI |
| 1 | Mapa del negocio con estándares | Procure-to-Pay, Order-to-Cash, ciclo de importación, SCOR, BPMN, Incoterms, Event Storming | Mapa de procesos de GESI |
| 2 | Del mapa al modelo | DDD (lenguaje común, contextos delimitados), modelo entidad-relación, máquinas de estado | Glosario GESI, diagrama de entidades y estados |

### Parte 1 — Fundamentos del agente
| # | Lección | Conceptos | Lo que queda hecho |
|---|---|---|---|
| 3 | Entorno y primera llamada a Claude | API, clave de API, tokens, costos | Script que conversa con Claude |
| 4 | Instrucciones del sistema | Prompt de sistema, rol, reglas, ejemplos | Claude responde con las reglas de GESI |
| 5 | Herramientas (tool use) | Definición de herramientas, parámetros, esquemas | Claude usa una calculadora de landed cost |
| 6 | El ciclo del agente | Bucle pensar-actuar-observar, condiciones de término | El agente encadena herramientas solo |

### Parte 2 — Datos ordenados (lo que la primera app no logró)
| # | Lección | Conceptos | Lo que queda hecho |
|---|---|---|---|
| 7 | Construir la base de datos | SQL, tablas, claves primarias y foráneas, normalización | La base de GESI creada desde el modelo de la lección 2 |
| 8 | Herramientas sobre la base | Lectura vs. escritura, validación, transacciones | El agente registra y consulta |
| 9 | Leer documentos | Extracción estructurada, validación de datos | Cotizaciones en PDF, Excel o WhatsApp pasan a datos |

### Parte 3 — El primer módulo útil: cotizaciones
| # | Lección | Conceptos | Lo que queda hecho |
|---|---|---|---|
| 10 | Motor de cotizaciones | Reglas de negocio, puntaje ponderado, landed cost | Tabla comparativa en Excel |
| 11 | Redactor de solicitudes | Plantillas, idioma, tono, consistencia | Solicitudes con el formato GESI |
| 12 | Control humano | Human-in-the-loop, aprobaciones, registro de acciones | Nada se envía ni se guarda sin tu aprobación |

### Parte 4 — Del script al agente de verdad
| # | Lección | Conceptos | Lo que queda hecho |
|---|---|---|---|
| 13 | Skills y memoria | Contexto, skills, memoria persistente | Estándares GESI aplicados siempre |
| 14 | Claude Agent SDK | Frameworks de agentes, subagentes, permisos | El agente migra a un framework profesional |
| 15 | Canales: correo y WhatsApp | Integraciones, APIs externas, webhooks, seguridad | El agente prepara respuestas en Outlook y WhatsApp |
| 16 | Tareas programadas | Automatización, cron, informes | Informe semanal de Mercado Libre |
| 17 | Operar en serio | Costos, registros, errores, evaluación de agentes (evals) | Medir si el agente realmente ayuda |

## Requisitos
- Python 3.11 o superior (desde la lección 3)
- Cuenta en la consola de Anthropic con clave de API (lección 3)
