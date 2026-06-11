import { useState, useMemo } from 'react';

const tipoLabels = {
  publico: 'CITE Público',
  privado: 'CITE Privado',
  universidad: 'Universidad / OTT',
  incubadora: 'Incubadora / Aceleradora',
  gobierno: 'Entidad de Soporte',
  startup: 'Startup Tecnológica',
  cati: 'Red CATI (INDECOPI)',
  coworking: 'Espacio de Coworking',
  empresa: 'Empresa Innovadora'
};

export default function DirectoryView({ cites, cadenaById, selected, onSelect }) {
  const [localSearch, setLocalSearch] = useState('');
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState('nombre'); // nombre | region | tipo | cadena
  const [sortOrder, setSortOrder] = useState('asc'); // asc | desc

  // 1. FILTER CITES LOCALLY IN THE TABLE
  const filteredCites = useMemo(() => {
    const q = localSearch.toLowerCase().trim();
    if (!q) return cites;
    return cites.filter((c) => {
      const nameMatch = (c.nombre || '').toLowerCase().includes(q);
      const regionMatch = (c.region || '').toLowerCase().includes(q);
      const cityMatch = (c.ciudad || '').toLowerCase().includes(q);
      const typeLabel = tipoLabels[c.tipo] || c.tipo || '';
      const typeMatch = typeLabel.toLowerCase().includes(q);
      const chainLabel = cadenaById[c.cadena]?.nombre || '';
      const chainMatch = chainLabel.toLowerCase().includes(q);
      return nameMatch || regionMatch || cityMatch || typeMatch || chainMatch;
    });
  }, [cites, localSearch, cadenaById]);

  // 2. MANAGE SORTING
  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  // 3. SORT ACTORS
  const sortedActors = useMemo(() => {
    const data = [...filteredCites];
    data.sort((a, b) => {
      let valA = a[sortField] || '';
      let valB = b[sortField] || '';

      if (sortField === 'cadena') {
        valA = cadenaById[a.cadena]?.nombre || '';
        valB = cadenaById[b.cadena]?.nombre || '';
      } else if (sortField === 'tipo') {
        valA = tipoLabels[a.tipo] || a.tipo || '';
        valB = tipoLabels[b.tipo] || b.tipo || '';
      }

      if (typeof valA === 'string') {
        return sortOrder === 'asc'
          ? valA.localeCompare(valB, 'es', { sensitivity: 'base' })
          : valB.localeCompare(valA, 'es', { sensitivity: 'base' });
      } else {
        return sortOrder === 'asc' ? valA - valB : valB - valA;
      }
    });
    return data;
  }, [filteredCites, sortField, sortOrder, cadenaById]);

  // 4. PAGINATION CALCULATIONS
  const totalPages = Math.ceil(sortedActors.length / itemsPerPage) || 1;
  const paginatedActors = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedActors.slice(start, start + itemsPerPage);
  }, [sortedActors, currentPage, itemsPerPage]);

  const getActorColor = (c) => {
    return cadenaById[c.cadena]?.color || '#d4af37';
  };

  // 5. CSV EXPORT FUNCTION (Safe local download using Blob)
  const exportCSV = () => {
    const headers = ['Nombre', 'Tipo de Actor', 'Cadena / Red', 'Región', 'Ciudad', 'Dirección', 'Enlace Web'];
    const rows = sortedActors.map((c) => [
      `"${(c.nombre || '').replace(/"/g, '""')}"`,
      `"${tipoLabels[c.tipo] || c.tipo || ''}"`,
      `"${cadenaById[c.cadena]?.nombre || c.cadena || ''}"`,
      `"${c.region || ''}"`,
      `"${c.ciudad || ''}"`,
      `"${(c.direccion || '').replace(/"/g, '""')}"`,
      `"${c.contacto?.web || ''}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `directorio_khipunet.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Generate numbered pages for pagination
  const pageNumbers = useMemo(() => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 4) {
        pages.push(1, 2, 3, 4, 5, '...', totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  }, [currentPage, totalPages]);

  return (
    <div className="map-root" style={{ position: 'absolute', padding: '30px', overflowY: 'auto', background: 'var(--bg)', width: '100%', height: '100%' }}>
      {/* Dynamic Directory Style rules */}
      <style>{`
        .directory-card {
          background: rgba(17, 24, 39, 0.45);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: var(--radius);
          box-shadow: 0 20px 27px 0 rgba(0, 0, 0, 0.12), inset 0 1px 1px rgba(255, 255, 255, 0.04);
          backdrop-filter: blur(20px);
          margin-bottom: 30px;
          overflow: hidden;
        }
        .directory-input {
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #fff;
          padding: 8px 14px;
          border-radius: 20px;
          font-size: 0.75rem;
          width: 250px;
          outline: none;
          transition: all 0.2s;
        }
        .directory-input:focus {
          border-color: var(--oro);
          background: rgba(0, 0, 0, 0.45);
          box-shadow: 0 0 10px rgba(212, 175, 55, 0.15);
        }
        .directory-select {
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #fff;
          padding: 7px 12px;
          border-radius: 20px;
          font-size: 0.72rem;
          outline: none;
          cursor: pointer;
          transition: all 0.2s;
        }
        .directory-select:focus {
          border-color: var(--oro);
        }
        .btn-action-csv {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: var(--text);
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 0.72rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .btn-action-csv:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.2);
          transform: translateY(-1px);
        }
        .sortable-th {
          cursor: pointer;
          user-select: none;
          transition: all 0.2s;
        }
        .sortable-th:hover {
          color: #fff !important;
          background: rgba(255, 255, 255, 0.01);
        }
        .dir-row {
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          transition: all 0.2s ease;
        }
        .dir-row:hover {
          background: rgba(255, 255, 255, 0.02) !important;
        }
        .dir-row.selected {
          background: rgba(212, 175, 55, 0.04) !important;
          border-left: 3px solid var(--oro);
        }
        .page-pill {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(255, 255, 255, 0.03);
          color: var(--muted);
          display: flex;
          align-items: center;
          justifyContent: center;
          font-size: 0.72rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          outline: none;
        }
        .page-pill:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.08);
          color: #fff;
          border-color: rgba(255, 255, 255, 0.2);
        }
        .page-pill.active {
          background: linear-gradient(135deg, #f1c40f 0%, #d4af37 100%);
          color: #000;
          border-color: var(--oro);
          box-shadow: 0 4px 12px rgba(212, 175, 55, 0.3);
        }
        .page-pill:disabled {
          opacity: 0.35;
          cursor: not-allowed;
        }
        .btn-table-ver {
          background: rgba(255, 255, 255, 0.04);
          color: var(--text);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 20px;
          padding: 5px 12px;
          font-size: 0.68rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          outline: none;
        }
        .btn-table-ver:hover {
          background: linear-gradient(135deg, #f1c40f 0%, #d4af37 100%);
          color: #000;
          border-color: var(--oro);
          box-shadow: 0 4px 10px rgba(212, 175, 55, 0.2);
        }
      `}</style>

      {/* Expanded directory container matching metrics widescreen */}
      <div className="dashboard-wrapper">
        <div className="directory-card">
          
          {/* Card Header (Controls: title, search input, row counts, export CSV) */}
          <div style={{
            padding: '24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div className="icon-shape" style={{
                background: 'linear-gradient(135deg, #f1c40f 0%, #d4af37 100%)',
                boxShadow: '0 4px 15px rgba(212,175,55,0.25)',
                width: '38px',
                height: '38px'
              }}>
                🗂️
              </div>
              <div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 800, margin: 0, color: '#ffffff', letterSpacing: '-0.3px' }}>
                  Directorio de Actores
                </h2>
                <p style={{ margin: '3px 0 0', fontSize: '0.68rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Mostrando {sortedActors.length} instituciones encontradas en el segmento actual
                </p>
              </div>
            </div>

            {/* Interactive Filters Panel */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              {/* Rows count selector */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.72rem', color: 'var(--muted)' }}>
                <span>Filas:</span>
                <select 
                  className="directory-select"
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>

              {/* Local Instant Search Bar */}
              <input
                className="directory-input"
                type="search"
                placeholder="Filtrar en esta tabla..."
                value={localSearch}
                onChange={(e) => {
                  setLocalSearch(e.target.value);
                  setCurrentPage(1);
                }}
              />

              {/* Download CSV button */}
              <button 
                type="button" 
                className="btn-action-csv"
                onClick={exportCSV}
                title="Descargar base de datos filtrada en Excel/CSV"
              >
                📥 Exportar CSV
              </button>
            </div>
          </div>

          {/* Directory Table View */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.76rem' }}>
              <thead>
                <tr style={{ background: 'rgba(255, 255, 255, 0.015)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  {[
                    ['nombre', 'Institución / Nombre'],
                    ['tipo', 'Tipo de Actor'],
                    ['cadena', 'Cadena / Red'],
                    ['region', 'Ubicación / Región'],
                  ].map(([field, label]) => (
                    <th 
                      key={field}
                      onClick={() => handleSort(field)}
                      style={{
                        padding: '14px 18px',
                        fontWeight: 700,
                        color: 'var(--muted)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        fontSize: '0.62rem'
                      }}
                      className="sortable-th"
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {label}
                        <span style={{ color: sortField === field ? 'var(--oro)' : 'rgba(255,255,255,0.1)', fontSize: '0.6rem', display: 'inline-block', transform: sortField === field && sortOrder === 'desc' ? 'rotate(180deg)' : 'none', transition: 'all 0.2s' }}>
                          ▲
                        </span>
                      </div>
                    </th>
                  ))}
                  {/* Web column is not sortable */}
                  <th style={{ padding: '14px 18px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.62rem' }}>
                    Enlace Web
                  </th>
                  <th style={{ padding: '14px 18px', textAlign: 'right', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.62rem' }}>
                    Ficha
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedActors.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ padding: '40px 18px', textAlign: 'center', color: 'var(--muted)', fontSize: '0.8rem' }}>
                      🔍 No se encontraron actores que coincidan con la búsqueda actual.
                    </td>
                  </tr>
                ) : (
                  paginatedActors.map((actor) => {
                    const isSel = selected?.id === actor.id;
                    const chainColor = getActorColor(actor);

                    return (
                      <tr 
                        key={actor.id}
                        className={`dir-row ${isSel ? 'selected' : ''}`}
                        style={isSel ? { borderLeft: `3px solid ${chainColor}` } : {}}
                      >
                        {/* Name Column */}
                        <td style={{ padding: '12px 18px', fontWeight: 700, color: isSel ? 'var(--oro)' : '#ffffff' }}>
                          <span 
                            style={{ cursor: 'pointer', transition: 'color 0.15s' }}
                            onClick={() => onSelect(actor.id)}
                            onMouseEnter={(e) => { if(!isSel) e.target.style.color = 'var(--oro)'; }}
                            onMouseLeave={(e) => { if(!isSel) e.target.style.color = '#ffffff'; }}
                          >
                            {actor.nombre}
                          </span>
                        </td>

                        {/* Actor Type Column */}
                        <td style={{ padding: '12px 18px' }}>
                          <span className={`badge ${actor.tipo}`} style={{
                            fontSize: '0.62rem',
                            padding: '3px 8px',
                            fontWeight: 700
                          }}>
                            {tipoLabels[actor.tipo] || actor.tipo}
                          </span>
                        </td>

                        {/* Chain/Red Column */}
                        <td style={{ padding: '12px 18px', color: '#cbd5e1' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: chainColor, display: 'inline-block', boxShadow: `0 0 8px ${chainColor}` }} />
                            {cadenaById[actor.cadena]?.nombre || 'Transversal'}
                          </div>
                        </td>

                        {/* Region/City Column */}
                        <td style={{ padding: '12px 18px', color: '#cbd5e1' }}>
                          {actor.region} {actor.ciudad ? `(${actor.ciudad})` : ''}
                        </td>

                        {/* Web link Column */}
                        <td style={{ padding: '12px 18px' }}>
                          {actor.contacto?.web && actor.contacto.web !== 'Ver ITP' ? (
                            <a 
                              href={actor.contacto.web} 
                              target="_blank" 
                              rel="noreferrer" 
                              style={{ color: 'var(--cian)', textDecoration: 'none', fontWeight: 600, fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center', gap: '2px' }}
                            >
                              Visitar Web ↗
                            </a>
                          ) : (
                            <span style={{ color: 'var(--muted)', fontSize: '0.7rem' }}>-</span>
                          )}
                        </td>

                        {/* Action details Column */}
                        <td style={{ padding: '12px 18px', textAlign: 'right' }}>
                          <button 
                            type="button"
                            onClick={() => onSelect(actor.id)}
                            className="btn-table-ver"
                          >
                            {isSel ? 'Ficha Abierta' : 'Ver Ficha'}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Soft UI Dynamic Numbered Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', marginTop: '10px' }}>
            {/* Previous page button */}
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="page-pill"
              title="Página Anterior"
            >
              ‹
            </button>

            {/* Page number buttons */}
            {pageNumbers.map((num, idx) => {
              if (num === '...') {
                return (
                  <span key={idx} style={{ color: 'var(--muted)', padding: '0 4px', fontSize: '0.8rem', userSelect: 'none' }}>
                    ...
                  </span>
                );
              }
              const isActive = currentPage === num;
              return (
                <button
                  key={idx}
                  onClick={() => setCurrentPage(num)}
                  className={`page-pill ${isActive ? 'active' : ''}`}
                >
                  {num}
                </button>
              );
            })}

            {/* Next page button */}
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="page-pill"
              title="Siguiente Página"
            >
              ›
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
