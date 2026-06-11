import { useMemo, useState } from 'react';
import db from './data/cites.json';
import MapView from './components/MapView.jsx';
import FilterBar from './components/FilterBar.jsx';
import SidePanel from './components/SidePanel.jsx';

const norm = (s) =>
  (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

export default function App() {
  const [tipo, setTipo] = useState('todos'); // todos | publico | privado
  const [cadenasOn, setCadenasOn] = useState(() => new Set(db.cadenas.map((c) => c.id)));
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState(null);

  const cadenaById = useMemo(
    () => Object.fromEntries(db.cadenas.map((c) => [c.id, c])),
    []
  );

  const visibles = useMemo(() => {
    const q = norm(query);
    return db.cites.filter((c) => {
      if (c.lat == null || c.lng == null) return false;
      if (tipo !== 'todos' && c.tipo !== tipo) return false;
      if (!cadenasOn.has(c.cadena)) return false;
      if (q) {
        const hay = norm(`${c.nombre} ${c.region} ${c.ciudad} ${c.descripcion}`);
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [tipo, cadenasOn, query]);

  const selected = useMemo(
    () => db.cites.find((c) => c.id === selectedId) || null,
    [selectedId]
  );

  const toggleCadena = (id) => {
    setCadenasOn((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="app">
      <MapView
        cites={visibles}
        cadenaById={cadenaById}
        selected={selected}
        onSelect={setSelectedId}
      />

      <header className="brand-card">
        <h1>
          Khipu<span className="net">Net</span> CITEs
        </h1>
        <p>Mapa interactivo de innovación · Red Nacional de Transferencia Tecnológica</p>
        <div className="khipu-threads" aria-hidden="true">
          {db.cadenas.map((c) => (
            <i key={c.id} style={{ background: c.color }} title={c.nombre} />
          ))}
        </div>
      </header>

      <FilterBar
        cadenas={db.cadenas}
        cadenasOn={cadenasOn}
        onToggleCadena={toggleCadena}
        tipo={tipo}
        onTipo={setTipo}
        query={query}
        onQuery={setQuery}
      />

      <div className="stats">
        Mostrando <b>{visibles.length}</b> de {db.cites.length} nodos · corte{' '}
        {db.meta.fecha_corte}
      </div>

      <SidePanel
        cite={selected}
        cadena={selected ? cadenaById[selected.cadena] : null}
        onClose={() => setSelectedId(null)}
      />
    </div>
  );
}
