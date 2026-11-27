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

## 2026-11-26 — Migración por valor, y listas de precios en la app nueva

- **Importa no recibe funciones nuevas.** Todo lo nuevo se construye en la app nueva (compras.gesi.cl).
- **Se migra por valor, no por un orden fijo** (patrón estrangulador): primero lo que más urge al negocio.
  Tres reglas: una función vive en una sola app a la vez; lo que se mueve, se mueve completo y se apaga en
  Importa; las dependencias se resuelven con un puente explícito (por ejemplo, el factor de internación
  se ingresa a mano diciendo de qué costeo salió, hasta que el costeo se migre).
- **Lo que urge hoy: prospectar y ofertar la preventa del embarque de Lvzhou.** Se construyó la lectura de
  listas de precios de proveedores y la lista de venta (factor y margen por familia, documento para clientes).
- El costo landed estimado es un dato central que usan varios procesos (decidir compra, precio de venta,
  evaluar mercado, negociar): ver `lecciones/img/costo-estimado.png`.

## 2026-11-27 — Base de conocimiento de productos

- Se copia la **estructura** de los estándares de la industria (GS1 GPC / UNSPSC: 4 niveles; ETIM: atributos
  fijos por clase), no su contenido: **Segmento → Familia → Clase → Producto**, cada clase con su lista de atributos.
- La jerarquía, las clases, los atributos y las equivalencias (producto GESI ↔ producto de cada proveedor) son
  **datos en la base**. Solo las reglas (PN según norma, qué fitting calza con qué tubo) van a código o skills.
- **Decidido (Nico delegó: «el estándar de la industria a nuestra escala»):** se sigue UNSPSC. Segmento 40
  (Sistemas de distribución y acondicionamiento) → Familia 4017 (Tuberías y fittings) → Clases **Tubo** y
  **Fitting**. El estándar tiene una clase por tipo de fitting; a nuestra escala el **tipo es un atributo**.
  El **material** (PPR, PVC, bronce, galvanizado) y la **unión** (termofusión, cementado, rosca) también son
  atributos: sumar PVC o bronce no agrega clases. Debajo: modelo y **variantes** (SKU con precio).
- Se parte con lo que hay en la lista de Lvzhou: tubos y fittings PPR.

## 2026-11-27 — Regla: traer y adaptar

Lo que viene de Importa **se trae y se adapta**; no se copia tal cual. Antes de usarlo en la app nueva:

1. **Se homologa con las directivas de la app nueva:** modelo con PK y FK (nada de relaciones por texto
   que hay que adivinar), clave natural única donde la hay (el RUT de un cliente), plantillas y listas como
   datos editables (no escritas en el programa), tono estándar de aplicación de negocios y la jerarquía de
   productos.
2. **Entra al BPMN:** el módulo traído se ubica en su proceso (P2P, Vender, Importación) para que se vea
   cómo conversa con los demás. Clientes quedó en `lecciones/img/bpmn-vender.png`.
3. **Se trae completo, con sus datos, y se apaga en Importa** (regla de migración por valor).
4. **Comentarios que prometen algo que el código no hace se corrigen o se borran.**

Origen: Clientes se trajo con el tipo como texto (no conversaba con los canales de la lista de venta), los
tipos escritos en el programa, el nombre como clave en vez del RUT, y un comentario que prometía un historial
de gestiones que no existía.
