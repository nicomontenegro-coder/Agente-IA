# Agente GESI — Curso práctico para crear un agente de IA

Este repositorio es un curso y, al mismo tiempo, el proyecto real: construir paso a paso
el **Agente GESI**, un asistente de IA para la operación de importaciones de GESI SpA.

Cada lección enseña conceptos (los estándares que usa la industria), los aplica a GESI
y deja algo funcionando. Al final de cada lección hay una **evaluación**.
Los **hitos** 🎯 se aprueban con resultados reales, no con preguntas.

## Cómo está organizado

```
lecciones/      explicación de cada lección (leer primero)
evaluaciones/   sistema de evaluación y registro de tu progreso
agente/         el código del agente, que crece lección a lección
pruebas/        pruebas del código y casos de prueba (evals) del agente
datos/          base de datos y archivos de ejemplo
METODO.md       cómo trabajamos: reglas para construir con IA sin perder el control
CLAUDE.md       instrucciones para que Claude actúe como tutor y evaluador
```

## Cómo avanzar

1. Lee la lección.
2. Haz el ejercicio práctico siguiendo [METODO.md](METODO.md).
3. Pide a Claude: **"evalúame la lección N"**.
4. Con 80 % o más queda registrado en [evaluaciones/progreso.md](evaluaciones/progreso.md) y pasas a la siguiente.

Detalle: [evaluaciones/SISTEMA.md](evaluaciones/SISTEMA.md).

## Temario

### Parte 0 — Diseño: entender el negocio antes de programar
| # | Lección | Conceptos | Lo que queda hecho |
|---|---|---|---|
| 0 | [Qué es un agente](lecciones/00-que-es-un-agente.md) | Modelo, herramientas, ciclo, control humano | Diseño general del Agente GESI |
| 1 | Mapa del negocio con estándares | Procure-to-Pay, Order-to-Cash, ciclo de importación, SCOR, BPMN, Incoterms, Event Storming, línea base, criterios de éxito | Mapa de procesos de GESI y medición del tiempo actual |
| 2 | Del mapa al modelo | DDD (lenguaje común, contextos delimitados), modelo entidad-relación, máquinas de estado | Glosario GESI, diagrama de entidades y estados |
| 3 | Método de trabajo | Verificar en dos capas, pruebas primero, núcleo vs. hojas, hooks, evals | Tu versión comentada de [METODO.md](METODO.md) |

### Parte 1 — Herramientas del programador
| # | Lección | Conceptos | Lo que queda hecho |
|---|---|---|---|
| 4 | Terminal y Python I | Comandos básicos, variables, tipos, funciones | Calculadora de landed cost en Python |
| 5 | Python II y primeras pruebas | Listas, diccionarios, archivos, errores, pytest | La calculadora con pruebas que la verifican |
| 6 | Git y GitHub | Commits, ramas, historial, volver atrás, permisos | Tu trabajo versionado y respaldado |

### Parte 2 — Fundamentos del agente
| # | Lección | Conceptos | Lo que queda hecho |
|---|---|---|---|
| 7 | Primera llamada a Claude | API, clave, tokens, costos, elegir modelo, hooks de arranque y término | Script que conversa con Claude; el repo se verifica solo |
| 8 | Instrucciones del sistema | Prompt de sistema, rol, reglas, ejemplos | Claude responde con las reglas de GESI |
| 9 | Herramientas (tool use) | Definición de herramientas, parámetros, esquemas | Claude usa la calculadora de landed cost |
| 10 | El ciclo del agente | Pensar-actuar-observar, errores, reintentos, cuándo pedir ayuda | El agente encadena herramientas solo |
| 11 | Patrones: workflows vs. agentes | Lo más simple que funcione, encadenar, enrutar, orquestar | Saber cuándo usar código fijo y cuándo un agente |

### Parte 3 — Datos ordenados (lo que la primera app no logró)
| # | Lección | Conceptos | Lo que queda hecho |
|---|---|---|---|
| 12 | Construir la base de datos | SQL, claves primarias y foráneas, normalización, respaldos | La base de GESI creada desde el modelo de la lección 2 |
| 13 | Migrar los datos de tu app | Limpieza, deduplicación, normalización de nombres, validación | Proveedores, prospectos e historial rescatados |
| 14 | Herramientas sobre la base | Lectura vs. escritura, validación, transacciones | El agente registra y consulta |
| 15 | Leer documentos y primeras evals | Extracción estructurada, casos de prueba con resultado conocido | Cotizaciones en PDF, Excel o WhatsApp pasan a datos, con su tasa de acierto medida |

### Parte 4 — Primer módulo útil: cotizaciones
| # | Lección | Conceptos | Lo que queda hecho |
|---|---|---|---|
| 16 | Motor de cotizaciones | Reglas de negocio, puntaje ponderado, landed cost | Tabla comparativa en Excel |
| 17 | Redactor de solicitudes | Plantillas, idiomas (inglés, chino), tono, consistencia | Solicitudes con el formato GESI |
| 18 | Control humano | Human-in-the-loop, aprobaciones, registro de acciones | Nada se envía ni se guarda sin tu aprobación |
| 19 | 🎯 Hito: una semana de uso real | Medición contra la línea base, retroalimentación, iteración | El módulo usado en tu trabajo y ajustado con datos |

### Parte 5 — Del script al agente de verdad
| # | Lección | Conceptos | Lo que queda hecho |
|---|---|---|---|
| 20 | Skills, memoria y contexto | Ingeniería de contexto, skills, memoria persistente | Estándares GESI aplicados siempre |
| 21 | MCP: el agente en Claude y en tu celular | Model Context Protocol, servidores y conectores | Tus datos y herramientas usables desde la app de Claude |
| 22 | Claude Agent SDK | Frameworks de agentes, subagentes, permisos | El agente migra a un framework profesional |
| 23 | Seguridad de agentes | Inyección de prompts, secretos, mínimo privilegio, datos personales (Ley 21.719) | El agente resiste mensajes maliciosos y protege tus datos |
| 24 | Despliegue en la nube | Servidores, variables de entorno, disponibilidad, monitoreo | El agente corre 24/7 fuera de tu computador |
| 25 | Canales: correo y WhatsApp | Integraciones, APIs externas, webhooks | El agente prepara respuestas en Outlook y WhatsApp |
| 26 | Tareas programadas | Automatización, cron, API de Mercado Libre | Informe semanal de Mercado Libre (módulo B) |
| 27 | Operar en serio | Costos, registros, evals continuas, mantenimiento | Panel con costo, uso y acierto del agente |
| 28 | 🎯 Proyecto final: módulo comercial | Todo lo anterior, con menos guía | Módulo de tubería preaislada (C) construido por ti |
