export default function FilterBar({
  cadenas,
  cadenasOn,
  onToggleCadena,
  tipo,
  onTipo,
  query,
  onQuery,
}) {
  return (
    <nav className="filters" aria-label="Filtros del mapa">
      <input
        className="search"
        type="search"
        placeholder="Buscar CITE, actor, región o palabra clave…"
        value={query}
        onChange={(e) => onQuery(e.target.value)}
      />

      <div className="chip-row" role="group" aria-label="Tipo de Actor">
        {[
          ['todos', 'Todos'],
          ['cite', 'CITEs'],
          ['universidad', 'Universidades / OTT'],
          ['empresa', 'Empresas'],
          ['startup', 'Startups'],
          ['incubadora', 'Incubadoras'],
          ['cati', 'Red CATI'],
          ['coworking', 'Coworking'],
          ['gobierno', 'Soporte / Estado'],
        ].map(([value, label]) => {
          let extraClass = '';
          if (tipo === value) {
            extraClass = 'on';
            if (value === 'todos' || value === 'cite') extraClass += ' verde';
          }
          return (
            <button
              key={value}
              type="button"
              className={`chip ${extraClass}`}
              onClick={() => onTipo(value)}
            >
              {label}
            </button>
          );
        })}
      </div>

      <div className="chip-row" role="group" aria-label="Cadenas productivas">
        {cadenas.map((c) => {
          const on = cadenasOn.has(c.id);
          return (
            <button
              key={c.id}
              type="button"
              className={`chip chip-cadena ${on ? 'on' : ''}`}
              style={on ? { color: c.color } : undefined}
              onClick={() => onToggleCadena(c.id)}
              title={on ? 'Ocultar categoría' : 'Mostrar categoría'}
            >
              <span className="dot" style={{ background: c.color, opacity: on ? 1 : 0.35 }} />
              {c.nombre}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
