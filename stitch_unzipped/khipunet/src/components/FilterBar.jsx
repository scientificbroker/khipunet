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
        placeholder="Buscar CITE, región o palabra clave…"
        value={query}
        onChange={(e) => onQuery(e.target.value)}
      />

      <div className="chip-row" role="group" aria-label="Tipo de CITE">
        {[
          ['todos', 'Todos'],
          ['publico', 'Públicos'],
          ['privado', 'Privados'],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            className={`chip ${tipo === value ? 'on verde' : ''}`}
            onClick={() => onTipo(value)}
          >
            {label}
          </button>
        ))}
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
              title={on ? 'Ocultar cadena' : 'Mostrar cadena'}
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
