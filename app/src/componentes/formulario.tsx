'use client'

import {
  startTransition,
  useActionState,
  useEffect,
  useRef,
  type FormEvent
} from 'react'

/**
 * Cuando la pestaña quedó de una versión anterior de la app.
 *
 * Las funciones que guardan datos llevan un identificador que cambia en cada
 * despliegue. Si alguien tiene la pantalla abierta y mientras tanto se
 * despliega, su pestaña pide una función que en el servidor ya no existe, y
 * Next contesta recargando la página entera. Para quien estaba escribiendo
 * eso se ve como que la app borró todo sin decir nada: pasó, y costó una
 * hora de trabajo.
 *
 * Atajarlo acá convierte esa caída en un aviso que se puede leer. Y como el
 * costeo se guarda solo en el navegador, recargar ya no cuesta nada.
 */
const DE_OTRA_VERSION = /Failed to find Server Action|older or newer deployment|Connection closed|Failed to fetch/i

export const AVISO_VERSION =
  'Esta pestaña quedó de una versión anterior de la app. Recarga la página (Cmd+Shift+R) y vuelve a guardar: lo que escribiste se recupera solo.'

/**
 * Envía un formulario a una Server Action sin que React lo vacíe.
 *
 * Con `<form action={...}>`, React 19 limpia todos los campos al terminar la
 * acción, también cuando vuelve con un error: tipeabas una cotización entera,
 * fallaba una validación y había que escribirla de nuevo. Enviando desde
 * `onSubmit` React no toca el formulario, y lo escrito queda ahí para
 * corregirlo.
 *
 * Con `limpiarSiOk` se vacía solo cuando la acción responde `{ ok }`: sirve
 * para formularios de "agregar otro", como categorías o documentos.
 */
export function useFormulario<E extends { error?: string; ok?: string }>(
  accion: (estado: E, datos: FormData) => Promise<E>,
  { inicial = {} as E, limpiarSiOk = false }: { inicial?: E; limpiarSiOk?: boolean } = {}
) {
  // Un fallo al llamar a la acción —no un error que la acción devuelva— sube
  // hasta el límite de error de React y se lleva la pantalla. Acá se
  // convierte en texto, que es lo que el formulario sabe mostrar.
  const protegida = async (previo: E, datos: FormData): Promise<E> => {
    try {
      return await accion(previo, datos)
    } catch (e) {
      // `redirect()` y `notFound()` funcionan lanzando: tienen que seguir.
      const digest = (e as { digest?: string } | null)?.digest
      if (typeof digest === 'string' && digest.startsWith('NEXT_')) throw e
      const texto = e instanceof Error ? e.message : String(e)
      console.error('[formulario] la acción falló:', texto)
      return {
        ...previo,
        ok: undefined,
        error: DE_OTRA_VERSION.test(texto) ? AVISO_VERSION : `No se pudo guardar: ${texto}`
      }
    }
  }

  // Los estados son objetos planos, así que Awaited<E> es E; TypeScript no
  // puede deducirlo solo con un genérico.
  const [estado, enviar, pendiente] = useActionState<E, FormData>(
    protegida as (estado: Awaited<E>, datos: FormData) => Promise<E>,
    inicial as Awaited<E>
  )
  const ref = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (limpiarSiOk && estado.ok) limpiarFilaNueva(ref.current)
  }, [estado, limpiarSiOk])

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    // El botón que se apretó viaja con los datos, igual que en un envío normal.
    const submitter = (e.nativeEvent as SubmitEvent).submitter
    const datos = new FormData(e.currentTarget, submitter)
    startTransition(() => enviar(datos))
  }

  return { estado, pendiente, form: { ref, onSubmit } }
}

/**
 * Vacía solo los campos que están dentro del `<form>`, que son los de la fila
 * nueva. Las tablas de arriba asocian sus campos con `form=` pero viven fuera,
 * y `form.reset()` también los devolvía a su valor de partida: cambiabas quién
 * paga un costo, se guardaba bien y la pantalla mostraba igual el valor viejo.
 */
function limpiarFilaNueva(f: HTMLFormElement | null) {
  if (!f) return
  for (const el of Array.from(f.elements)) {
    if (!f.contains(el)) continue
    if (el instanceof HTMLSelectElement) {
      for (const o of Array.from(el.options)) o.selected = o.defaultSelected
    } else if (el instanceof HTMLTextAreaElement) {
      el.value = el.defaultValue
    } else if (el instanceof HTMLInputElement) {
      if (el.type === 'checkbox' || el.type === 'radio') el.checked = el.defaultChecked
      else if (el.type !== 'submit' && el.type !== 'button') el.value = el.defaultValue
    }
  }
}

export function BotonEnviar({
  pendiente,
  etiqueta = 'Guardar',
  enCurso = 'Guardando…',
  form,
  clase = 'btn btn-primario'
}: {
  pendiente: boolean
  etiqueta?: string
  enCurso?: string
  /** Para un botón que vive fuera de su `<form>`, como en una fila de tabla. */
  form?: string
  clase?: string
}) {
  return (
    <button type="submit" form={form} className={clase} disabled={pendiente}>
      {pendiente ? enCurso : etiqueta}
    </button>
  )
}
