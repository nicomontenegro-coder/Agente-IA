/** Los campos de un proveedor, iguales al crear y al editar. */
export default function CamposProveedor({
  p,
  familias
}: {
  p?: { nombre: string; pais: string | null; contacto: string | null; email: string | null; telefono: string | null; canal: string; aceptaCartaCredito: boolean | null; notas: string | null; familias: string[] }
  familias: { id: string; nombre: string }[]
}) {
  const lc = p?.aceptaCartaCredito
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm space-y-1">
          <span className="font-medium">Nombre</span>
          <input name="nombre" className="campo" required defaultValue={p?.nombre ?? ''} />
        </label>
        <label className="text-sm space-y-1">
          <span className="font-medium">País</span>
          <input name="pais" className="campo" defaultValue={p?.pais ?? ''} />
        </label>
        <label className="text-sm space-y-1">
          <span className="font-medium">Contacto</span>
          <input name="contacto" className="campo" defaultValue={p?.contacto ?? ''} placeholder="A quién se le escribe" />
        </label>
        <label className="text-sm space-y-1">
          <span className="font-medium">Se le escribe por</span>
          <select name="canal" className="campo" defaultValue={p?.canal ?? 'CORREO'}>
            <option value="CORREO">Correo</option>
            <option value="WHATSAPP">WhatsApp</option>
            <option value="ALIBABA">Chat de Alibaba</option>
          </select>
        </label>
        <label className="text-sm space-y-1">
          <span className="font-medium">Correo</span>
          <input name="email" type="email" className="campo" defaultValue={p?.email ?? ''} />
        </label>
        <label className="text-sm space-y-1">
          <span className="font-medium">Teléfono o WhatsApp</span>
          <input name="telefono" className="campo" defaultValue={p?.telefono ?? ''} />
        </label>
        <label className="text-sm space-y-1">
          <span className="font-medium">¿Acepta carta de crédito?</span>
          <select name="aceptaCartaCredito" className="campo" defaultValue={lc === true ? 'SI' : lc === false ? 'NO' : ''}>
            <option value="">No lo sé todavía</option>
            <option value="SI">Sí</option>
            <option value="NO">No: queda eliminado en el primer embarque</option>
          </select>
        </label>
        <label className="text-sm space-y-1">
          <span className="font-medium">Notas</span>
          <input name="notas" className="campo" defaultValue={p?.notas ?? ''} />
        </label>
      </div>
      <fieldset className="text-sm space-y-2">
        <legend className="font-medium mb-1">Familias de productos que trabaja</legend>
        <div className="flex flex-wrap gap-3">
          {familias.map((f) => (
            <label key={f.id} className="flex items-center gap-1.5">
              <input type="checkbox" name="familiaId" value={f.id} defaultChecked={p?.familias.includes(f.id)} />
              {f.nombre}
            </label>
          ))}
        </div>
        <input name="familiasNuevas" className="campo" placeholder="Agregar familias nuevas, separadas por coma" />
      </fieldset>
    </>
  )
}
