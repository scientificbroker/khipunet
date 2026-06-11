const tipoLabels = {
  publico: 'CITE Público',
  privado: 'CITE Privado',
  universidad: 'Universidad / OTT',
  empresa: 'Empresa Innovadora',
  startup: 'Startup Tecnológica',
  incubadora: 'Incubadora / Aceleradora',
  cati: 'Red CATI (INDECOPI)',
  coworking: 'Espacio de Coworking',
  gobierno: 'Soporte / Estado'
};

export default function SidePanel({ cite, cadena, onClose }) {
  const getBadgeLabel = (tipo) => {
    return tipoLabels[tipo] || tipo;
  };

  const getServicesHeader = (tipo) => {
    if (tipo === 'universidad') return 'Líneas de Investigación / I+D';
    if (tipo === 'startup') return 'Soluciones y Productos';
    if (tipo === 'gobierno') return 'Instrumentos y Áreas de Apoyo';
    if (tipo === 'cati') return 'Servicios CATI y Propiedad Intelectual';
    if (tipo === 'coworking') return 'Servicios y Facilidades';
    if (tipo === 'empresa') return 'Áreas de Innovación y Desarrollo';
    return 'Servicios Tecnológicos';
  };

  return (
    <aside className={`side-panel ${cite ? 'open' : ''}`} aria-hidden={!cite}>
      {cite && (
        <>
          <button type="button" className="close" onClick={onClose} aria-label="Cerrar ficha">
            ✕
          </button>

          <div>
            <span className={`badge ${cite.tipo}`}>
              {getBadgeLabel(cite.tipo)}
            </span>
            {cadena && (
              <span className="badge cadena" style={{ color: cadena.color }}>
                {cadena.nombre}
              </span>
            )}
          </div>

          <h2>{cite.nombre}</h2>
          <p className="sub">
            {cite.region} {cite.ciudad ? `· ${cite.ciudad}` : ''}
          </p>

          <p className="desc">{cite.descripcion}</p>

          <div className="section-label">Datos del actor</div>
          <div className="kv">
            <div className="row">
              <div className="k">Dirección</div>
              <div className="v">{cite.direccion || 'Dirección referencial'}</div>
            </div>
            <div className="row">
              <div className="k">Coordenadas</div>
              <div className="v">
                {cite.lat != null ? `${cite.lat}, ${cite.lng}` : 'Pendiente de georreferenciación'}
              </div>
            </div>
            {cite.contacto?.telefono && cite.contacto.telefono !== 'Ver ITP' && (
              <div className="row">
                <div className="k">Teléfono</div>
                <div className="v">{cite.contacto.telefono}</div>
              </div>
            )}
            {cite.contacto?.email && cite.contacto.email !== 'Ver ITP' && (
              <div className="row">
                <div className="k">Correo</div>
                <div className="v">{cite.contacto.email}</div>
              </div>
            )}
            {cite.contacto?.web && (
              <div className="row">
                <div className="k">Web oficial</div>
                <div className="v">
                  <a href={cite.contacto.web} target="_blank" rel="noreferrer">
                    {cite.contacto.web.replace(/^https?:\/\/(www\.)?/, '')}
                  </a>
                </div>
              </div>
            )}
            {cite.ambito && cite.ambito.length > 0 && (
              <div className="row">
                <div className="k">Ámbito</div>
                <div className="v">{Array.isArray(cite.ambito) ? cite.ambito.join(', ') : cite.ambito}</div>
              </div>
            )}
            <div className="row">
              <div className="k">Estado</div>
              <div className="v" style={{ textTransform: 'capitalize' }}>{cite.estado || 'operativo'}</div>
            </div>
            {cite.fuente && (
              <div className="row">
                <div className="k">Fuente</div>
                <div className="v">{cite.fuente}</div>
              </div>
            )}
          </div>

          {cite.servicios && cite.servicios.length > 0 && (
            <>
              <div className="section-label">{getServicesHeader(cite.tipo)}</div>
              <div className="tags">
                {cite.servicios.map((s) => (
                  <span key={s}>{s}</span>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </aside>
  );
}
