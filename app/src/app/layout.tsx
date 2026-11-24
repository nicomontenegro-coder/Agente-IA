import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'GESI · Compras',
  description: 'El proceso de compra de GESI: de la necesidad a la orden de compra.'
}

export const viewport = { themeColor: '#1E2557' }

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es-CL">
      <body>{children}</body>
    </html>
  )
}
