# Decisiones del proyecto

Lo que se decidió, cuándo y por qué. Cualquier sesión de Claude lee esto antes de trabajar.

## 2026-11-23 — App nueva, organizada por procesos

**Decisión:** construir en este repositorio una app nueva y limpia para GESI, organizada por
**procesos** (P2P, Importación, O2C) y no por tipos de datos. Se empieza por el **P2P**, y dentro
de él por la **RFQ**.

**Por qué:** Importa está organizada por cosas (proveedores, cotizaciones, costeos, ofertas) y por
herramientas (evaluar, costear). Las piezas del ciclo de compra existen, pero ningún lugar muestra
el proceso completo ni "en qué paso va esta compra y qué sigue". Eso contradice lo aprendido en la
Lección 1 (BPMN): el proceso cruza todas las piezas y tiene que estar representado.

**Cómo:**
- Cada módulo se diseña primero con las lecciones (Event Storming → BPMN → modelo → estados) y el
  diseño lo aprueba Nico antes de programar (es el núcleo).
- Se reutilizan de Importa los cálculos probados (landed cost, incoterms, aranceles) con sus pruebas.
- Importa sigue en producción hasta que la app nueva cubra lo necesario; después se migran los datos.
- El módulo de RFQ que se había pedido en la sesión de Importa se detiene, para no construirlo dos veces.

## 2026-11-23 — TypeScript

**Decisión:** la app y el agente se escriben en **TypeScript**, no en Python.

**Por qué:** es el lenguaje de Importa, así que sus cálculos y pruebas se reutilizan tal cual, y el
Claude Agent SDK existe en TypeScript. Las lecciones de programación del curso pasan a TypeScript.

## 2026-11-23 — Una sesión por repositorio

- **Esta sesión (Agente-IA):** el curso, la app nueva y el agente.
- **La sesión de Importa:** solo mantenimiento de Importa mientras siga en uso.
- Nunca trabajan dos sesiones en el mismo repositorio al mismo tiempo. Se coordinan por GitHub.

## 2026-11-23 — Mientras se construye la app nueva

- La sesión de Importa publicó un módulo de RFQ ("Pedir cotización", `/pedidos`) antes de que se
  pudiera detener. Queda en uso: sirve para emitir RFQ ahora. Sus funciones probadas se
  reutilizan en la app nueva.
- Las RFQ se generan solo en inglés y español: nunca en idiomas que Nico no domina.

## 2026-11-24 — Primera versión de la app nueva

Nico pidió implementar el diseño sin esperar más revisiones, para avanzar. Se construyó en `app/`
la primera mitad del P2P: compras con varios productos, RFQ en inglés y español a varios
proveedores, cotizaciones con filtros y comparativa, y orden de compra imprimible con el formato
GESI. La revisión guiada del modelo (paso 1 de 5) queda pendiente y se retoma con la app funcionando.
