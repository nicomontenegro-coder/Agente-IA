'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSyncExternalStore } from 'react'

/** El menú sigue el proceso: primero comprar, después los datos que se reutilizan. */
const ENLACES = [
  { href: '/compras', label: 'Compras' },
  { href: '/proveedores', label: 'Proveedores' },
  { href: '/productos', label: 'Productos' },
  { href: '/precios', label: 'Precios' },
  { href: '/clientes', label: 'Clientes' },
  { href: '/ajustes', label: 'Ajustes' }
]

/** Vuelta a Importa, según la dirección en que se abrió la app. */
const sinSuscripcion = () => () => {}
function useUrlImporta(): string | null {
  return useSyncExternalStore(
    sinSuscripcion,
    () => {
      const { protocol, host } = window.location
      // compras.gesi.cl → importa.gesi.cl; en la dirección sslip.io, sin el «gesi.» del comienzo.
      if (host.startsWith('compras.')) return `${protocol}//importa.${host.slice('compras.'.length)}/`
      if (host.startsWith('gesi.')) return `${protocol}//${host.slice('gesi.'.length)}/`
      return null
    },
    () => null
  )
}

export default function Nav() {
  const pathname = usePathname()
  const urlImporta = useUrlImporta()
  return (
    <header className="bg-[var(--panel)] border-b border-[var(--borde)] sticky top-0 z-20">
      <div className="max-w-[1200px] mx-auto px-5 flex items-center gap-4 h-14 overflow-x-auto">
        <Link href="/compras" className="font-bold tracking-tight shrink-0">
          GESI
        </Link>
        <nav className="flex items-center gap-0.5">
          {ENLACES.map((e) => {
            const activo = pathname.startsWith(e.href)
            return (
              <Link
                key={e.href}
                href={e.href}
                className={`px-2.5 py-1.5 rounded-md text-sm whitespace-nowrap ${
                  activo ? 'bg-[var(--acento-suave)] text-[var(--acento)] font-semibold' : 'text-[var(--texto-suave)] hover:bg-[var(--panel-alt)]'
                }`}
              >
                {e.label}
              </Link>
            )
          })}
          {urlImporta && (
            <a href={urlImporta} className="px-2.5 py-1.5 rounded-md text-sm whitespace-nowrap text-[var(--texto-suave)] hover:bg-[var(--panel-alt)]">
              Importa ↗
            </a>
          )}
        </nav>
      </div>
    </header>
  )
}
