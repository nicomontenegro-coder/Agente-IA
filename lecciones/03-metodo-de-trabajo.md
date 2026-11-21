# Lección 3 — Método de trabajo

## Por qué esta lección

Con IA se puede escribir mucho código muy rápido. El riesgo es que también se pueden acumular
errores muy rápido, como pasó con tu primera app. Esta lección explica el método que
usaremos en todo el curso para construir rápido **sin perder el control**.
Las reglas completas están en `METODO.md`; aquí está el porqué de cada una.

Al terminar sabrás:

- Por qué se verifica en dos capas: el código y el agente.
- Qué es una prueba automática y cómo se escribe antes que el código.
- Qué es una eval y en qué se diferencia de una prueba.
- Qué es núcleo y qué es hoja, y por qué cambia cuánto revisas.
- Qué son los hooks y por qué una regla impuesta vale más que una pedida.

---

## 1. Dos capas de verificación

Un agente tiene dos formas muy distintas de fallar:

| Capa | Pregunta | Ejemplo de falla | Cómo se verifica |
|---|---|---|---|
| **Código** | ¿El programa hace lo que dijimos? | La fórmula de landed cost suma el IVA cuando no debía | **Pruebas** automáticas |
| **Agente** | ¿El modelo decide bien? | El agente lee "MOQ 500 rolls" como 500 metros | **Evals** con casos reales |

El código es **determinista**: con la misma entrada da siempre la misma salida.
El modelo es **probabilístico**: puede responder distinto ante la misma entrada,
y puede equivocarse aunque el código esté perfecto. Por eso se necesitan las dos capas.

---

## 2. Pruebas: el contrato del código

Una **prueba** es un pequeño programa que dice: *"con esta entrada, el resultado debe ser este"*.
Se ejecuta en un segundo y avisa si algo se rompió.

### Un ejemplo con números (ficticio)

Contenedor de tubería desde Ningbo, 1.000 metros:

| Concepto | Monto (US$) | Cómo se calcula |
|---|---|---|
| FOB | 20.000 | Precio del proveedor |
| Flete marítimo | 3.500 | Cotización del forwarder |
| Seguro | 120 | Póliza |
| **CIF** | **23.620** | FOB + flete + seguro |
| Arancel (0 % con TLC China) | 0 | 0 % × CIF |
| IVA importación (19 %) | 4.487,80 | 19 % × (CIF + arancel). **Crédito fiscal: no va al costo** |
| Agente de aduana | 450 | Honorarios |
| Puerto y almacenaje | 600 | Gastos locales |
| Transporte a Punta Arenas | 2.800 | Camión o barcaza |
| **Landed cost total** | **27.470** | CIF + arancel + gastos locales (sin IVA) |
| **Landed cost por metro** | **27,47** | Total ÷ 1.000 |

Las pruebas que escribiríamos **antes** de programar la calculadora:

1. Con estos datos, el landed cost por metro debe ser **27,47**.
2. Si el arancel es 6 % (sin certificado de origen), se agregan 1.417,20 y el total debe ser **28.887,20**.
3. El IVA **nunca** debe sumarse al landed cost.
4. Si falta la moneda de algún monto, la calculadora debe **rechazar** el cálculo, no adivinar.
5. Si la cantidad es 0, debe dar error, no dividir por cero.

### Por qué escribir la prueba primero

- Te obliga a definir **qué significa "correcto"** antes de que exista el código.
- Claude tiene **cómo comprobarse**: programa hasta que las pruebas pasen.
- Si algún día cambias la fórmula, las pruebas avisan si rompiste algo que funcionaba.

Fíjate que las pruebas 3, 4 y 5 son **reglas de negocio**. Las pruebas son también
tu manual de reglas, escrito de forma que una máquina lo puede revisar.

---

## 3. Evals: el examen del agente

Una **eval** es como una prueba, pero para el comportamiento del agente. Se arma así:

1. Juntas casos reales: por ejemplo, 10 cotizaciones que ya revisaste tú a mano.
2. Para cada una anotas el **resultado correcto**: precio, MOQ, incoterm, si cumple el formato.
3. Le das las 10 al agente y comparas su resultado con el tuyo.
4. Obtienes una **tasa de acierto**: por ejemplo, 9 de 10 campos bien leídos en promedio.

| Prueba (código) | Eval (agente) |
|---|---|
| Pasa o falla | Da un porcentaje de acierto |
| Siempre da lo mismo | Puede variar un poco entre ejecuciones |
| Se escribe con números inventados | Se arma con casos reales |
| Verifica fórmulas y reglas | Verifica lectura, juicio y redacción |

**Regla de oro:** cada vez que el agente se equivoque en el trabajo real,
ese caso se agrega a las evals. Así el agente mejora con el uso, y los errores no se repiten.

---

## 4. Núcleo y hojas

No todo el código merece la misma revisión. La idea viene de la charla de Anthropic sobre
programar con IA en producción:

- **Núcleo:** las piezas de las que dependen otras. Un error ahí se propaga a todo.
  En GESI: el modelo de datos, la fórmula de landed cost, el filtro eliminatorio, el puntaje.
  **Tú lo entiendes y lo revisas.**
- **Hojas:** piezas de las que nada depende. Un error ahí queda aislado y se nota fácil.
  En GESI: el formato visual de un informe o el texto de un mensaje de ayuda.
  **Claude puede escribirlas con más libertad**, y basta con mirar el resultado.

Por eso las lecciones 1 y 2 van antes de programar: el mapa y el modelo son el núcleo del núcleo.

---

## 5. Contexto: tú eres el jefe de producto

Cuando le pides algo a Claude, trátalo como a un programador muy capaz que **acaba de llegar**
a GESI y no sabe nada del negocio. Antes de pedir código, dale:

1. **Qué** se va a construir.
2. **Para qué**: el problema real que resuelve.
3. **Con qué datos** y en qué formato llegan.
4. **Cómo sabremos que está bien**: las pruebas o el caso real para comparar.
5. **Qué no debe hacer**: por ejemplo, nunca enviar mensajes sin aprobación.

❌ "Haz un lector de cotizaciones."

✅ "Necesito leer cotizaciones de proveedores chinos que llegan en PDF o como texto de WhatsApp,
para cargarlas en la tabla LíneaCotización. Deben salir: precio unitario, moneda, incoterm, lugar,
MOQ y lead time. Si falta un dato, debe quedar vacío y marcado, nunca inventado.
Está bien cuando acierte en las 10 cotizaciones de `pruebas/evals/cotizaciones/`."

---

## 6. Hooks: lo importante se impone

Un **hook** es un comando que Claude Code ejecuta **automáticamente** en ciertos momentos.
Los dos que usaremos:

| Hook | Cuándo corre | Para qué en GESI |
|---|---|---|
| **De arranque** (SessionStart) | Al iniciar una sesión | Instalar dependencias, para que las pruebas puedan correr |
| **De término** (Stop) | Cuando Claude cree haber terminado | Correr las pruebas; si fallan, Claude debe seguir trabajando |

La diferencia clave:

- El `CLAUDE.md` es un **consejo**. Claude normalmente lo sigue, pero puede saltárselo.
- Un hook es una **regla**. Corre siempre, se acuerde Claude o no.

Ya lo viviste: en tu primera app, las sesiones arrancaban sin dependencias y aparecían
miles de errores falsos. El hook de arranque lo resolvió.
Y como dice tu regla 3, el hook debe ser **barato**: si no se tocó código, no corre las pruebas,
y no bloquea dos veces seguidas para no quedar en un bucle.

---

## 7. Mirar el resultado y exigir evidencia

Las pruebas verifican números, no la experiencia. Antes de dar algo por terminado:

- **Abrir el resultado:** el Excel generado, el borrador del mensaje, la pantalla.
- **Compararlo con un caso real:** ¿la tabla comparativa de Lvzhou y la competencia
  se parece a la que harías tú?

**Terminado** significa tres cosas juntas:

1. Las pruebas pasan.
2. Las evals no empeoraron.
3. Alguien miró el resultado y se ve bien.

Si Claude dice "listo" sin evidencia, la respuesta correcta es: *"muéstrame cómo lo verificaste"*.

---

## 8. Orden y memoria entre sesiones

Cada sesión de Claude parte sin recordar las anteriores. Para que el trabajo no se pierda:

- **Commits frecuentes** en Git: cada paso que funciona queda guardado y se puede volver atrás.
- **Revisar en el orden del flujo de datos**, siguiendo el mapa de la lección 1, y **anotar
  con fecha** lo encontrado en vez de arreglar a mitad de la revisión.
- **CLAUDE.md corto**, con lo esencial. Lo temático va en *skills* que se cargan cuando se necesitan.
- **Permisos explícitos:** lo que sirve para verificar corre sin preguntar; lo destructivo
  (borrar la base, leer secretos, desplegar a mano) está prohibido.

---

## Resumen

- Se verifica en **dos capas**: pruebas para el código, evals para el agente.
- **Pruebas primero**: definen qué es "correcto" y le dan a Claude cómo comprobarse.
- **Evals** con casos reales; cada error real se vuelve un caso nuevo.
- **Núcleo** lo revisas tú; **hojas** pueden ser más libres.
- Tú eres el **jefe de producto**: contexto, objetivo y criterio de terminado antes del código.
- **Hooks**: lo importante se impone, no se pide.
- **Terminado** = pruebas pasan + evals sin retroceso + resultado revisado.
