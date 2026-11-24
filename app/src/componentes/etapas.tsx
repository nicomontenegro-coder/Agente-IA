import { Chip } from './ui'
import { ETIQUETA_ETAPA, esEtapa, etapasDelCamino } from '@/lib/compra'
import { ETIQUETA_INVITACION, type EstadoInvitacion } from '@/lib/proveedores'

const tono = (e: string) =>
  e === 'CANCELADA' ? 'malo' : e === 'CERRADA' ? 'ok' : ['NECESIDAD', 'BUSCANDO'].includes(e) ? 'neutro' : ['COTIZANDO', 'EVALUANDO', 'MUESTRAS', 'NEGOCIANDO'].includes(e) ? 'alerta' : 'acento'

export function EtapaCompra({ etapa }: { etapa: string }) {
  return <Chip tono={tono(etapa)}>{esEtapa(etapa) ? ETIQUETA_ETAPA[etapa] : etapa}</Chip>
}

const TONO_INV = { POR_ENVIAR: 'neutro', ENVIADA: 'acento', RESPONDIDA: 'ok', SIN_RESPUESTA: 'alerta', DECLINO: 'malo' } as const

export function EstadoInv({ estado }: { estado: EstadoInvitacion }) {
  return <Chip tono={TONO_INV[estado]}>{ETIQUETA_INVITACION[estado]}</Chip>
}

/** Las etapas como una fila de pasos: lo hecho, lo actual y lo que falta. */
export function Camino({ etapa }: { etapa: string }) {
  const actual = etapasDelCamino.indexOf(etapa as (typeof etapasDelCamino)[number])
  return (
    <ol className="flex flex-wrap items-center gap-1.5 text-xs" aria-label="Etapas de la compra">
      {etapasDelCamino.map((e, i) => (
        <li key={e} className="flex items-center gap-1.5">
          <span
            aria-current={e === etapa ? 'step' : undefined}
            className={`px-2.5 py-1 rounded-full border ${
              e === etapa
                ? 'bg-[var(--acento)] border-[var(--acento)] text-white font-semibold'
                : etapa !== 'CANCELADA' && i < actual
                  ? 'border-[var(--acento)] text-[var(--acento)]'
                  : 'border-[var(--borde)] text-[var(--texto-tenue)]'
            }`}
          >
            {ETIQUETA_ETAPA[e]}
          </span>
          {i < etapasDelCamino.length - 1 && <span className="text-[var(--texto-tenue)]">→</span>}
        </li>
      ))}
      {etapa === 'CANCELADA' && (
        <li>
          <EtapaCompra etapa="CANCELADA" />
        </li>
      )}
    </ol>
  )
}
