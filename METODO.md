# Método de trabajo GESI

Reglas para construir con IA sin perder el control. Nacen de dos fuentes:
la charla "Vibe coding in prod" (Anthropic) y lo que funcionó al corregir la primera app.

## Verificamos en dos capas

1. **El código**: ¿hace lo que dijimos? Se verifica con pruebas automáticas.
2. **El agente**: ¿decide bien? Se verifica con *evals*: casos reales con resultado conocido
   (por ejemplo, 10 cotizaciones ya revisadas a mano) y se mide cuántos acierta.

Las dos capas son obligatorias. Un código perfecto puede alimentar un agente que lee mal una cotización.

## Antes de programar

1. **Contexto primero.** Escribir qué se va a construir, para qué y con qué datos,
   como lo haría un jefe de producto con un programador nuevo.
2. **Criterio de terminado.** Escribir cómo vamos a saber que funciona
   (por ejemplo: "para la cotización de Lvzhou de prueba, el landed cost da X").
3. **Núcleo u hoja.** Núcleo = lo que otras piezas usan (modelo de datos, reglas de negocio, landed cost):
   lo entiendes y lo revisas tú. Hoja = piezas de las que nada depende (un formato de informe):
   Claude puede escribirlas con más libertad.

## Mientras se programa

4. **Pruebas primero.** Primero la prueba que falla, después el código que la hace pasar.
5. **Pasos chicos y commits frecuentes.** Cada paso que funciona queda guardado en Git.
6. **Darle a Claude cómo comprobarse.** Siempre debe poder correr pruebas por su cuenta.
7. **Lo importante se impone, no se pide.** Un hook de término corre las pruebas al final;
   si fallan, el trabajo vuelve. El CLAUDE.md es un consejo; el hook es una regla.
8. **Verificación barata.** Los hooks se saltan si no se tocó código y no bloquean en bucle.

## Antes de dar algo por terminado

9. **Mirar el resultado.** Abrir el Excel, la pantalla o el mensaje generado y compararlo
   con un caso real. Las pruebas verifican números, no la experiencia.
10. **Evidencia, no confianza.** Terminado = pruebas pasadas + evals sin retroceso + resultado revisado.

## Orden y memoria

11. **Revisar en el orden del flujo de datos** (según el mapa del negocio) y no arreglar a mitad
    de la revisión: anotar con fecha lo encontrado para que la sesión siguiente sepa dónde quedó.
12. **CLAUDE.md corto.** Lo temático va en skills que se cargan cuando se necesitan.
13. **Permisos explícitos.** Lo que sirve para verificar corre sin preguntar; lo destructivo
    está prohibido (borrar la base, leer `.env`, desplegar a mano).

## En producción

14. **Medir contra la línea base.** El agente sirve si ahorra tiempo o evita errores medibles.
15. **Cada error real se vuelve un caso de prueba.** Si el agente se equivocó con una cotización,
    esa cotización entra al set de evals para que no vuelva a pasar.
