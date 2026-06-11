export default function SidePanel({ cite, cadena, onClose }) {
  return (
    <aside className={`side-panel ${cite ? 'open' : ''}`} aria-hidden={!cite}>
      {cite && (
        <>
          <button type="button" className="close" onClick={onClose} aria-label="Cerrar ficha">
            ✕
          </button>

          <div>
            <span className={`badge ${cite.tipo}`}>
              {cite.tipo === 'publico' ? 'CITE público' : 'CITE privado'}
            </span>
            {cadena && (
              <span className="badge cadena" style={{ color: cadena.color }}>
                {cadena.nombre}
              </span>
            )}
          </div>

          <h2>{cite.nombre}</h2>
          <p className="sub">
            {cite.region} · {cite.ciudad}
          </p>

          <p className="desc">{cite.descripcion}</p>

          <div className="section-label">Datos del nodo</div>
          <div className="kv">
            <div className="row">
              <div className="k">Dirección</div>
              <div className="v">{cite.direccion}</div>
            </div>
            <div className="row">
              <div className="k">Coordenadas</div>
              <div className="v">
                {cite.lat != null ? `${cite.lat}, ${cite.lng}` : 'Pendiente de georreferenciación'}
              </div>
            </div>
            <div className="row">
              <div className="k">Teléfono</div>
              <div className="v">{cite.contacto.telefono}</div>
            </div>
            <div className="row">
              <div className="k">Correo</div>
              <div className="v">{cite.contacto.email}</div>
            </div>
            <div className="row">
              <div className="k">Web</div>
              <div className="v">
                <a href={cite.contacto.web} target="_blank" rel="noreferrer">
                  {cite.contacto.web.replace(/^https?:\/\//, '')}
                </a>
              </div>
            </div>
            <div className="row">
              <div className="k">Ámbito</div>
              <div className="v">{cite.ambito.join(', ')}</div>
            </div>
            <div className="row">
              <div className="k">Estado</div>
              <div className="v">{cite.estado}</div>
            </div>
            <div className="row">
              <div className="k">Fuente</div>
              <div className="v">{cite.fuente}</div>
            </div>
          </div>

          <div className="section-label">Servicios tecnológicos</div>
          <div className="tags">
            {cite.servicios.map((s) => (
              <span key={s}>{s}</span>
            ))}
          </div>
        </>
      )}
    </aside>
  );
}
