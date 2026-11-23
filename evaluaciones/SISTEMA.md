# Sistema de evaluación

Cada lección se evalúa en tres partes. Claude genera las preguntas en el momento
(así no hay respuestas para memorizar) y corrige con la rúbrica de abajo.

## Qué se puede preguntar

Solo lo que la lección enseña. Si un caso de la parte B depende de un supuesto que la lección
no cubre (si hay stock, cuál es el margen), el enunciado lo declara. Lo que corresponde a una
lección posterior no descuenta puntos; a lo más se comenta como adelanto.

Cada caso práctico (parte B) trae un **bloque de contexto** antes de la pregunta:

- **Situación:** qué pasó y qué datos ya están registrados (en Importa o en la conversación).
- **Supuestos:** lo que se da por hecho (hay o no hay stock, margen objetivo, tiempos de importación).
- **Qué se espera:** el formato de la respuesta, por ejemplo el ciclo con una herramienta por cada «actúa».

Solo se descuenta lo que el enunciado pidió con esas palabras: si dice «marca», no se exige detallar.
Los matices que no cambian el resultado se comentan, pero no restan puntos.

## Las tres partes

| Parte | Qué mide | Formato | Peso |
|---|---|---|---|
| **A. Conceptos** | Que entiendes las ideas y los estándares | 5 preguntas: opción múltiple, verdadero/falso con justificación y respuesta corta | 40 % |
| **B. Aplicación a GESI** | Que sabes usar el concepto en tu negocio | 1 ejercicio práctico con un caso real o realista de GESI | 40 % |
| **C. Explícalo con tus palabras** | Que lo entiendes de verdad, no de memoria | Explicar un concepto como se lo explicarías a un socio que no sabe del tema | 20 % |

En las lecciones con código, la parte B incluye **mostrar cómo verificaste**
que lo construido funciona (pruebas, evals o comparación con un caso real), según [METODO.md](../METODO.md).
Un ejercicio sin verificación no puede obtener más de 2 puntos en la parte B.

Además, cada evaluación incluye **1 o 2 preguntas de repaso** de lecciones anteriores
(dentro de la parte A), para que lo aprendido no se olvide.

## Rúbrica

**Parte A** — cada pregunta vale 1 punto. La respuesta correcta sin justificación cuando se pide vale 0,5.

**Parte B** — de 0 a 4 puntos:
- 4: correcto, completo y aplicado con criterio al caso de GESI.
- 3: correcto con omisiones menores.
- 2: idea central correcta, pero con errores o incompleto.
- 1: intento con errores de fondo.
- 0: sin respuesta o fuera de tema.

**Parte C** — de 0 a 2 puntos:
- 2: claro, correcto y con un ejemplo propio.
- 1: correcto pero vago, o sin ejemplo.
- 0: incorrecto.

**Nota final** = porcentaje ponderado. **Se aprueba con 80 %.**

## Hitos 🎯

Los hitos (lecciones 19 y 28) no tienen preguntas. Se aprueban con resultados reales:
- **Lección 19:** una semana de uso del módulo de cotizaciones, con tiempo medido contra la línea base
  y una lista de ajustes hechos a partir del uso.
- **Lección 28:** el módulo comercial funcionando, con sus pruebas, sus evals y una semana de uso.

## Si no apruebas

Claude explica cada error, indica qué parte de la lección repasar y, cuando estés listo,
toma una evaluación nueva con preguntas distintas.

## Registro

Cada evaluación queda anotada en [progreso.md](progreso.md) con la fecha, la nota y los temas para reforzar.
