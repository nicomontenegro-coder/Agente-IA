import Nav from './nav'

export default function LayoutApp({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-screen flex flex-col">
      {process.env.GESI_DEMO && (
        <div className="bg-[var(--alerta)] text-white text-xs font-semibold text-center py-1.5 px-4">
          DEMO · datos ficticios en una base aparte.
        </div>
      )}
      <Nav />
      <main className="flex-1 w-full max-w-[1200px] mx-auto px-5 py-7">{children}</main>
    </div>
  )
}
