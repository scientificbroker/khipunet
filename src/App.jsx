import { useMemo, useState } from 'react';
import db from './data/cites.json';
import MapView from './components/MapView.jsx';
import NetworkGraph from './components/NetworkGraph.jsx';
import MetricsView from './components/MetricsView.jsx';
import DirectoryView from './components/DirectoryView.jsx';
import FilterBar from './components/FilterBar.jsx';
import SidePanel from './components/SidePanel.jsx';
import LandingPage from './components/LandingPage.jsx';

const norm = (s) =>
  (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

export default function App() {
  const [showLanding, setShowLanding] = useState(true);
  const [activeTab, setActiveTab] = useState('mapa'); // mapa | red | metricas | directorio
  const [tipo, setTipo] = useState('todos'); // todos | publico | privado | universidad | incubadora | gobierno
  const [cadenasOn, setCadenasOn] = useState(() => new Set(db.cadenas.map((c) => c.id)));
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);

  const activeCite = useMemo(() => {
    return db.cites.find((c) => c.id === (hoveredId || selectedId)) || null;
  }, [hoveredId, selectedId]);

  const cadenaById = useMemo(
    () => Object.fromEntries(db.cadenas.map((c) => [c.id, c])),
    []
  );

  // Filtrado global coordinado que afecta a todas las vistas
  const visibles = useMemo(() => {
    const q = norm(query);
    return db.cites.filter((c) => {
      // Filtrar nodos sin georreferenciación en la pestaña de mapa,
      // pero en las demás vistas sí los mostraremos (en el grafo flotan libres)
      if (activeTab === 'mapa' && (c.lat == null || c.lng == null)) return false;

      // Filtro por tipo de actor
      if (tipo !== 'todos') {
        if (tipo === 'cite') {
          if (c.tipo !== 'publico' && c.tipo !== 'privado') return false;
        } else if (c.tipo !== tipo) {
          return false;
        }
      }

      // Filtro por cadena / red
      if (!cadenasOn.has(c.cadena)) return false;

      // Filtro por texto libre
      if (q) {
        const hay = norm(`${c.nombre} ${c.region} ${c.ciudad || ''} ${c.descripcion}`);
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [tipo, cadenasOn, query, activeTab]);

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

  // Renderizar la Landing Page de entrada si el estado lo indica
  if (showLanding) {
    return <LandingPage onEnter={() => setShowLanding(false)} />;
  }

  return (
    <div className="app">
      {/* Navbar Superior de Pestañas */}
      <nav className="nav-tabs" aria-label="Navegación principal">
        {[
          ['mapa', '🗺️ Mapa Geo'],
          ['red', '🕸️ Grafo Red'],
          ['metricas', '📊 Métricas'],
          ['directorio', '🗂️ Directorio']
        ].map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={`tab-btn ${activeTab === id ? 'active' : ''}`}
            onClick={() => {
              setActiveTab(id);
              // Deseleccionar al cambiar de pestaña para evitar ruidos visuales
              setSelectedId(null);
            }}
          >
            {label}
          </button>
        ))}
      </nav>

      {/* Renderizado Condicional del Contenido Principal */}
      {activeTab === 'mapa' && (
        <MapView
          cites={visibles}
          cadenaById={cadenaById}
          selected={selected}
          onSelect={setSelectedId}
          cadenas={db.cadenas}
          cadenasOn={cadenasOn}
          onToggleCadena={toggleCadena}
          tipo={tipo}
          onTipo={setTipo}
          query={query}
          onQuery={setQuery}
          hoveredId={hoveredId}
          onHover={setHoveredId}
        />
      )}

      {activeTab === 'red' && (
        <NetworkGraph
          cites={visibles}
          cadenaById={cadenaById}
          selected={selected}
          onSelect={setSelectedId}
          cadenas={db.cadenas}
          cadenasOn={cadenasOn}
          onToggleCadena={toggleCadena}
          tipo={tipo}
          onTipo={setTipo}
          query={query}
          onQuery={setQuery}
          hoveredId={hoveredId}
          onHover={setHoveredId}
        />
      )}

      {activeTab === 'metricas' && (
        <MetricsView
          cites={db.cites}
          activeType={tipo}
          onTypeChange={setTipo}
          cadenas={db.cadenas}
          cadenaById={cadenaById}
        />
      )}

      {activeTab === 'directorio' && (
        <DirectoryView
          cites={visibles}
          cadenaById={cadenaById}
          selected={selected}
          onSelect={setSelectedId}
        />
      )}

      {/* Cabecera / Marca del Ecosistema */}
      <header className="brand-card">
        <h1>
          Khipu<span className="net">Net</span>
        </h1>
        <p>Red Nacional de Transferencia Tecnológica · Innovación y Ecosistema Peruano</p>
        <div className="khipu-threads" aria-hidden="true" />
        
        {/* Botón premium institucional de retorno a la Landing */}
        <button
          type="button"
          className="btn-back-landing"
          onClick={() => {
            setShowLanding(true);
            setSelectedId(null);
          }}
        >
          ℹ️ Información del Proyecto
        </button>
      </header>

      {/* Panel de Filtros Globales (Barra Lateral Izquierda) - Oculto en Grafo Red */}
      {activeTab !== 'red' && activeTab !== 'mapa' && (
        <FilterBar
          cadenas={db.cadenas}
          cadenasOn={cadenasOn}
          onToggleCadena={toggleCadena}
          tipo={tipo}
          onTipo={setTipo}
          query={query}
          onQuery={setQuery}
        />
      )}

      {/* Estadísticas de conteo inferiores (Ocultas en dashboard para evitar traslapes) */}
      {activeTab !== 'metricas' && activeTab !== 'directorio' && (
        <div className="stats">
          Mostrando <b>{visibles.length}</b> de {db.cites.length} nodos · corte{' '}
          {db.meta.fecha_corte}
        </div>
      )}

      {/* Panel Detallado Derecho */}
      <SidePanel
        cite={activeCite}
        cadena={activeCite ? cadenaById[activeCite.cadena] : null}
        onClose={() => {
          setSelectedId(null);
          setHoveredId(null);
        }}
      />
    </div>
  );
}
