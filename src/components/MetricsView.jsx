import { useMemo, useState } from 'react';

// Helper function to calculate descriptive statistics for grouped data (Services offered)
function calculateDescriptiveStats(nodes) {
  const servicios = nodes.map((c) => (c.servicios && c.servicios.length > 0 ? c.servicios.length : 1));
  const N_val = servicios.length;

  // Define uniform class intervals (amplitude a = 2)
  const clasesDef = [
    { min: 1, max: 2, label: '[1 - 2]', Xi: 1.5 },
    { min: 3, max: 4, label: '[3 - 4]', Xi: 3.5 },
    { min: 5, max: 6, label: '[5 - 6]', Xi: 5.5 },
    { min: 7, max: 8, label: '[7 - 8]', Xi: 7.5 },
  ];

  // Count absolute frequencies per interval
  const tableBase = clasesDef.map((c) => {
    const fi = N_val > 0 ? servicios.filter((s) => s >= c.min && s <= c.max).length : 0;
    return { ...c, fi };
  });

  const divisorN = N_val || 1;

  // Calculate cumulative and relative frequencies
  let acumuladaF = 0;
  const table = tableBase.map((item) => {
    acumuladaF += item.fi;
    const hi = item.fi / divisorN;
    const Hi = acumuladaF / divisorN;
    return {
      ...item,
      Fi: acumuladaF,
      hi,
      Hi,
      XiFi: item.Xi * item.fi,
    };
  });

  // A. Mean (X̄) = Σ(Xi * fi) / N
  const sumaXiFi = table.reduce((sum, item) => sum + item.XiFi, 0);
  const media = N_val > 0 ? (sumaXiFi / N_val) : 0;

  // B. Variance (S²) and Standard Deviation (S)
  // S² = Σ(fi * (Xi - X̄)²) / N
  const sumaDesvSqFi = table.reduce((sum, item) => sum + item.fi * Math.pow(item.Xi - media, 2), 0);
  const varianza = N_val > 0 ? (sumaDesvSqFi / N_val) : 0;
  const desviacionEstandar = Math.sqrt(varianza);

  // C. Median (Me) = Li + [((N/2) - Fi-1) / fi] * a
  const medioN = N_val / 2;
  let claseMedianaIdx = table.findIndex((c) => c.Fi >= medioN);
  if (claseMedianaIdx === -1) claseMedianaIdx = 0;

  const claseMediana = table[claseMedianaIdx];
  const Li_med = claseMediana.min;
  const Fi_prev = claseMedianaIdx > 0 ? table[claseMedianaIdx - 1].Fi : 0;
  const fi_med = claseMediana.fi || 1;
  const a = 2; // amplitude

  const mediana = N_val > 0 ? (Li_med + ((medioN - Fi_prev) / fi_med) * a) : 0;

  // D. Mode (Mo) = Li + [d1 / (d1 + d2)] * a
  // Find modal class (maximum absolute frequency fi)
  let claseModalIdx = 0;
  let maxFi = -1;
  table.forEach((item, idx) => {
    if (item.fi > maxFi) {
      maxFi = item.fi;
      claseModalIdx = idx;
    }
  });

  const claseModal = table[claseModalIdx];
  const Li_mod = claseModal.min;
  const fi_mod = claseModal.fi;
  const fi_prev = claseModalIdx > 0 ? table[claseModalIdx - 1].fi : 0;
  const fi_next = claseModalIdx < table.length - 1 ? table[claseModalIdx + 1].fi : 0;

  const d1 = fi_mod - fi_prev;
  const d2 = fi_mod - fi_next;
  const divisor = d1 + d2;
  const moda = N_val > 0 ? (divisor === 0 ? Li_mod : Li_mod + (d1 / divisor) * a) : 0;

  return {
    table,
    N: N_val,
    media,
    mediana,
    moda,
    varianza,
    desviacionEstandar,
  };
}

// Custom interactive Bezier Line/Area Chart Component
function AreaLineChart({ table, color, id }) {
  const maxFi = Math.max(...table.map((t) => t.fi), 1);

  // SVG Size & Grid margins
  const width = 500;
  const height = 180;
  const padLeft = 40;
  const padRight = 20;
  const padTop = 20;
  const padBottom = 30;

  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;
  const baselineY = height - padBottom;

  // Generate coordinates for points
  const points = table.map((item, idx) => {
    const x = padLeft + (idx * plotW) / (table.length - 1);
    const y = baselineY - (item.fi / maxFi) * (plotH - 10);
    return { x, y, label: item.label, fi: item.fi };
  });

  // Calculate Cubic Bezier paths
  let linePath = `M ${points[0].x} ${points[0].y}`;
  let areaPath = `M ${points[0].x} ${baselineY} L ${points[0].x} ${points[0].y}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const dx = p1.x - p0.x;
    const segment = ` C ${p0.x + dx / 2} ${p0.y}, ${p1.x - dx / 2} ${p1.y}, ${p1.x} ${p1.y}`;
    linePath += segment;
    areaPath += segment;
  }
  areaPath += ` L ${points[points.length - 1].x} ${baselineY} Z`;

  const [hoveredIdx, setHoveredIdx] = useState(null);

  return (
    <div style={{ position: 'relative', width: '100%', padding: '10px 0' }}>
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%" style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id={`area-grad-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.45" />
            <stop offset="100%" stopColor={color} stopOpacity="0.00" />
          </linearGradient>
          <filter id="glow-line" x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Grid lines and tick numbers */}
        {[0, 0.33, 0.66, 1].map((ratio, idx) => {
          const y = padTop + ratio * plotH;
          const val = Math.round(maxFi - ratio * maxFi);
          return (
            <g key={idx}>
              <line x1={padLeft} y1={y} x2={width - padRight} y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="0.8" />
              <text x={padLeft - 10} y={y + 3} fill="var(--muted)" fontSize="8.5" fontFamily="var(--font-body)" textAnchor="end">{val}</text>
            </g>
          );
        })}

        {/* Faded Area */}
        <path d={areaPath} fill={`url(#area-grad-${id})`} style={{ transition: 'all 0.5s ease-in-out' }} />

        {/* Glowing bezier line */}
        <path
          d={linePath}
          fill="none"
          stroke={color}
          strokeWidth="3.5"
          strokeLinecap="round"
          filter="url(#glow-line)"
          style={{ transition: 'all 0.5s ease-in-out' }}
        />

        {/* Interactive nodes */}
        {points.map((pt, idx) => {
          const isHovered = hoveredIdx === idx;
          return (
            <g
              key={idx}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              style={{ cursor: 'pointer' }}
            >
              {/* Hover guide */}
              {isHovered && (
                <line x1={pt.x} y1={padTop} x2={pt.x} y2={baselineY} stroke={color} strokeWidth="1" strokeDasharray="3 3" strokeOpacity="0.4" />
              )}
              {/* Glow ring */}
              <circle
                cx={pt.x}
                cy={pt.y}
                r={isHovered ? 9 : 6}
                fill={color}
                fillOpacity={isHovered ? 0.35 : 0.15}
                style={{ transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)' }}
              />
              {/* White center circle */}
              <circle cx={pt.x} cy={pt.y} r="3" fill="#fff" stroke={color} strokeWidth="2.5" />
              
              {/* X-Axis labels */}
              <text
                x={pt.x}
                y={baselineY + 18}
                fill={isHovered ? '#fff' : 'var(--muted)'}
                fontSize="9"
                fontFamily="var(--font-body)"
                textAnchor="middle"
                fontWeight={isHovered ? '700' : '500'}
                style={{ transition: 'fill 0.15s' }}
              >
                {pt.label}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Tooltip Card Overlay */}
      {hoveredIdx !== null && (
        <div style={{
          position: 'absolute',
          top: `${points[hoveredIdx].y - 42}px`,
          left: `${(points[hoveredIdx].x / width) * 100}%`,
          transform: 'translateX(-50%)',
          background: 'rgba(15, 22, 30, 0.96)',
          border: `1px solid ${color}80`,
          borderRadius: '8px',
          padding: '6px 12px',
          fontSize: '0.68rem',
          boxShadow: '0 8px 25px rgba(0,0,0,0.5)',
          pointerEvents: 'none',
          whiteSpace: 'nowrap',
          color: '#fff',
          zIndex: 10
        }}>
          <b>Rango:</b> {points[hoveredIdx].label} <br />
          <b>Frecuencia (f<sub>i</sub>):</b> {points[hoveredIdx].fi} actores
        </div>
      )}
    </div>
  );
}

// Custom interactive Donut Chart Component
function DonutChart({ data, width = 170, height = 170 }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const total = data.reduce((sum, d) => sum + d.value, 0) || 1;
  const radius = 55;
  const strokeWidth = 16;
  const circumference = 2 * Math.PI * radius;
  
  let accumulatedPercent = 0;
  const activeItem = hoveredIdx !== null ? data[hoveredIdx] : null;
  const activePercent = activeItem ? (activeItem.value / total) * 100 : 0;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '30px', flexWrap: 'wrap', justifyContent: 'center' }}>
      <div style={{ position: 'relative', width: `${width}px`, height: `${height}px` }}>
        <svg width={width} height={height} viewBox="0 0 160 160" style={{ transform: 'rotate(-90deg)', overflow: 'visible' }}>
          <defs>
            <filter id="soft-donut-shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="4" stdDeviation="5" floodColor="#000" floodOpacity="0.25" />
            </filter>
          </defs>
          {/* Background circle track */}
          <circle cx="80" cy="80" r={radius} fill="transparent" stroke="rgba(255,255,255,0.03)" strokeWidth={strokeWidth} />
          
          {data.map((item, idx) => {
            const percent = item.value / total;
            const strokeLength = percent * circumference;
            const strokeLengthGap = Math.max(strokeLength - 1.5, 0.5);
            const strokeOffset = circumference - (accumulatedPercent * circumference);
            accumulatedPercent += percent;

            const isHovered = hoveredIdx === idx;

            return (
              <circle
                key={idx}
                cx="80"
                cy="80"
                r={radius}
                fill="transparent"
                stroke={item.color}
                strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                strokeDasharray={`${strokeLengthGap} ${circumference}`}
                strokeDashoffset={strokeOffset}
                strokeLinecap="round"
                filter="url(#soft-donut-shadow)"
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                style={{
                  transition: 'stroke-width 0.25s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.2s',
                  cursor: 'pointer',
                }}
              />
            );
          })}
        </svg>
        
        {/* Soft UI Center Stats Overlay */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
          textAlign: 'center',
          padding: '16px'
        }}>
          {activeItem ? (
            <>
              <div style={{ fontSize: '0.62rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap', width: '85px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {activeItem.label}
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', margin: '2px 0', fontFamily: 'var(--font-display)' }}>
                {activeItem.value}
              </div>
              <div style={{ fontSize: '0.65rem', color: activeItem.color, fontWeight: '700' }}>
                {activePercent.toFixed(1)}%
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize: '0.62rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Total
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', fontFamily: 'var(--font-display)', margin: '1px 0' }}>
                {total}
              </div>
              <div style={{ fontSize: '0.58rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                nodos
              </div>
            </>
          )}
        </div>
      </div>
      
      {/* Soft UI Legend List with custom hover animations */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '180px', flex: '1 1 200px' }}>
        {data.map((item, idx) => {
          const percent = (item.value / total) * 100;
          const isHovered = hoveredIdx === idx;
          return (
            <div 
              key={idx}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px', 
                fontSize: '0.74rem', 
                color: isHovered ? '#fff' : '#cbd5e1',
                padding: '5px 10px',
                borderRadius: '8px',
                background: isHovered ? 'rgba(255,255,255,0.03)' : 'transparent',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: item.color, display: 'inline-block', flexShrink: 0, boxShadow: isHovered ? `0 0 10px ${item.color}` : 'none', transition: 'box-shadow 0.2s' }} />
              <div style={{ flex: 1, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', fontWeight: isHovered ? '600' : '400' }} title={item.label}>
                {item.label}
              </div>
              <div style={{ fontWeight: '700', color: isHovered ? item.color : '#fff' }}>
                {item.value} <span style={{ color: 'var(--muted)', fontWeight: '400', fontSize: '0.65rem' }}>({percent.toFixed(1)}%)</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Custom interactive Horizontal Bar Chart Component with Background tracks
function BarChart({ data, maxVal = null }) {
  const max = maxVal || Math.max(...data.map((d) => d.value), 1);
  const [hoveredIdx, setHoveredIdx] = useState(null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {data.map((item, idx) => {
        const pctWidth = (item.value / max) * 100;
        const isHovered = hoveredIdx === idx;

        return (
          <div 
            key={idx} 
            onMouseEnter={() => setHoveredIdx(idx)}
            onMouseLeave={() => setHoveredIdx(null)}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              fontSize: '0.72rem',
              padding: '6px 10px',
              borderRadius: '8px',
              background: isHovered ? 'rgba(255,255,255,0.03)' : 'transparent',
              transition: 'all 0.15s',
              cursor: 'pointer'
            }}
          >
            <div style={{ width: '150px', color: isHovered ? '#fff' : '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: isHovered ? '600' : '400' }} title={item.label}>
              {item.label}
            </div>
            <div style={{ flex: 1, height: '8px', background: 'rgba(255,255,255,0.04)', borderRadius: '4px', overflow: 'hidden', margin: '0 12px', position: 'relative' }}>
              <div 
                style={{ 
                  height: '100%', 
                  background: `linear-gradient(90deg, ${item.color || 'var(--cian)'}bb, ${item.color || 'var(--cian)'})`,
                  width: `${pctWidth}%`, 
                  borderRadius: '4px',
                  boxShadow: isHovered ? `0 0 12px ${item.color || 'var(--cian)'}` : 'none',
                  transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
                }} 
              />
            </div>
            <div style={{ width: '32px', textAlign: 'right', fontWeight: 700, color: isHovered ? (item.color || 'var(--cian)') : '#e2e8f0' }}>
              {item.value}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Helper function to extract 3 highlighted nodes to display as real human references
function getHighlightedNodes(nodes) {
  return nodes
    .filter((n) => n.nombre && n.descripcion && n.servicios && n.servicios.length > 0)
    .slice(0, 3);
}

export default function MetricsView({ cites, activeType, onTypeChange, cadenas }) {
  // 1. ISOLATE ACTORS BASED ON THE SELECTED TYPE
  const filteredCites = useMemo(() => {
    if (activeType === 'todos') return cites;
    if (activeType === 'cite') {
      return cites.filter((c) => c.tipo === 'publico' || c.tipo === 'privado');
    }
    return cites.filter((c) => c.tipo === activeType);
  }, [cites, activeType]);

  const N_total = filteredCites.length;

  // 2. COMPUTE QUANTITATIVE STATS DYNAMICALLY FOR THE SEGMENTED GROUP
  const cuantitativeStats = useMemo(() => {
    return calculateDescriptiveStats(filteredCites);
  }, [filteredCites]);

  // Extract up to 3 highlighted nodes to humanize the interface
  const highlightedNodes = useMemo(() => {
    return getHighlightedNodes(filteredCites);
  }, [filteredCites]);

  // Soft UI Gradient and Shadow configurations for each actor type
  const actorGradients = {
    todos: { grad: 'linear-gradient(135deg, #f1c40f 0%, #d4af37 100%)', glow: 'rgba(241, 196, 15, 0.35)', color: '#d4af37' },
    cite: { grad: 'linear-gradient(135deg, #4cd137 0%, #2e8b00 100%)', glow: 'rgba(76, 209, 55, 0.35)', color: '#4cd137' },
    universidad: { grad: 'linear-gradient(135deg, #ff4757 0%, #c0392b 100%)', glow: 'rgba(255, 71, 87, 0.35)', color: '#ff4757' },
    empresa: { grad: 'linear-gradient(135deg, #a855f7 0%, #701a75 100%)', glow: 'rgba(168, 85, 247, 0.35)', color: '#9b51e0' },
    startup: { grad: 'linear-gradient(135deg, #ffa502 0%, #e67e22 100%)', glow: 'rgba(255, 165, 2, 0.35)', color: '#ffa502' },
    incubadora: { grad: 'linear-gradient(135deg, #f368e0 0%, #a55eea 100%)', glow: 'rgba(243, 104, 224, 0.35)', color: '#f368e0' },
    cati: { grad: 'linear-gradient(135deg, #e67e22 0%, #d35400 100%)', glow: 'rgba(230, 126, 34, 0.35)', color: '#e67e22' },
    coworking: { grad: 'linear-gradient(135deg, #10ac84 0%, #019031 100%)', glow: 'rgba(16, 172, 132, 0.35)', color: '#10ac84' },
    gobierno: { grad: 'linear-gradient(135deg, #2e86de 0%, #1b3a4b 100%)', glow: 'rgba(46, 134, 222, 0.35)', color: '#2e86de' }
  };

  // Realistic banner image mapping representing each actor
  const bannerImages = {
    todos: '/banner_global.png',
    cite: '/banner_cite.png',
    universidad: '/banner_academia.png',
    empresa: '/banner_global.png',
    startup: '/banner_startup.png',
    incubadora: '/banner_startup.png',
    cati: '/banner_soporte.png',
    coworking: '/banner_startup.png',
    gobierno: '/banner_soporte.png',
  };

  const activeBannerImg = useMemo(() => {
    return bannerImages[activeType] || '/banner_global.png';
  }, [activeType]);

  // Metadata for the selected actor
  const actorMetadata = useMemo(() => {
    const map = {
      todos: {
        title: 'Tablero Global del Ecosistema',
        description: 'Análisis cuantitativo agregado de la Red Nacional de Transferencia Tecnológica, Innovación y Emprendimiento del Perú.',
        icon: '🌌',
        badgeText: 'Vista Agregada'
      },
      cite: {
        title: 'Red Nacional de CITEs',
        description: 'Estadísticas e indicadores de los Centros de Innovación Productiva y Transferencia Tecnológica (públicos y privados) calificados por el ITP.',
        icon: '⚙️',
        badgeText: 'CITE Público & Privado'
      },
      universidad: {
        title: 'Universidades & OTTs',
        description: 'Análisis de Oficinas de Transferencia Tecnológica y centros académicos con mayor incidencia en investigación y patentes.',
        icon: '🏛️',
        badgeText: 'Academia'
      },
      empresa: {
        title: 'Empresas Innovadoras',
        description: 'Empresas peruanas líderes en inversión en I+D+i, escalado tecnológico y articulación comercial en el mercado productivo.',
        icon: '🏢',
        badgeText: 'Sector Privado'
      },
      startup: {
        title: 'Startups Tecnológicas',
        description: 'Emprendimientos dinámicos peruanos orientados a software, fintech y agrotech con financiamiento privado y estatal.',
        icon: '🚀',
        badgeText: 'Startups'
      },
      incubadora: {
        title: 'Incubadoras & Aceleradoras',
        description: 'Organizaciones clave para la mentoría, incubación de base científica y soporte estratégico de ideas de negocio.',
        icon: '🌱',
        badgeText: 'Incubadoras'
      },
      cati: {
        title: 'Red CATI (INDECOPI)',
        description: 'Centros de Apoyo a la Tecnología y la Innovación especializados en búsquedas tecnológicas y propiedad intelectual.',
        icon: '🔍',
        badgeText: 'Red CATI'
      },
      coworking: {
        title: 'Espacios de Coworking',
        description: 'Hubs de colaboración, infraestructura flexible y espacios de trabajo compartido para la comunidad innovadora.',
        icon: '🤝',
        badgeText: 'Coworking'
      },
      gobierno: {
        title: 'Entidades de Soporte y Estado',
        description: 'Instituciones públicas encargadas de financiar la innovación (ej. ProInnóvate) y formular lineamientos de políticas de CTI.',
        icon: '⚖️',
        badgeText: 'Soporte Gubernamental'
      }
    };
    
    const base = map[activeType] || map.todos;
    const colors = actorGradients[activeType] || actorGradients.todos;
    return { ...base, ...colors };
  }, [activeType]);

  // Qualitative distribution for the global view
  const globalActorBreakdown = useMemo(() => {
    const counts = {
      publico: 0,
      privado: 0,
      universidad: 0,
      empresa: 0,
      startup: 0,
      incubadora: 0,
      cati: 0,
      coworking: 0,
      gobierno: 0,
    };

    filteredCites.forEach((c) => {
      if (counts[c.tipo] !== undefined) {
        counts[c.tipo]++;
      }
    });

    const labels = {
      publico: 'CITE Público',
      privado: 'CITE Privado',
      universidad: 'Universidad / OTT',
      empresa: 'Empresa Innovadora',
      startup: 'Startup Tecnológica',
      incubadora: 'Incubadora / Aceleradora',
      cati: 'Red CATI (INDECOPI)',
      coworking: 'Espacio de Coworking',
      gobierno: 'Soporte / Estado',
    };

    const colors = {
      publico: 'var(--verde-claro)',
      privado: 'var(--cian)',
      universidad: '#ff4757',
      empresa: '#9b51e0',
      startup: '#ffa502',
      incubadora: '#f368e0',
      cati: '#e67e22',
      coworking: '#10ac84',
      gobierno: '#2e86de',
    };

    return Object.entries(counts)
      .map(([key, value]) => ({
        label: labels[key],
        value,
        color: colors[key],
      }))
      .filter(d => d.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [filteredCites]);

  // CITE public vs private breakdown
  const citeTypeBreakdown = useMemo(() => {
    const publico = filteredCites.filter(c => c.tipo === 'publico').length;
    const privado = filteredCites.filter(c => c.tipo === 'privado').length;
    return [
      { label: 'CITE Público', value: publico, color: 'var(--verde-claro)' },
      { label: 'CITE Privado', value: privado, color: 'var(--cian)' }
    ];
  }, [filteredCites]);

  // Cadenas distribution for nodes
  const cadenasBreakdown = useMemo(() => {
    const counts = {};
    filteredCites.forEach((c) => {
      counts[c.cadena] = (counts[c.cadena] || 0) + 1;
    });

    return cadenas.map((cad) => ({
      label: cad.nombre,
      value: counts[cad.id] || 0,
      color: cad.color,
    })).filter(d => d.value > 0)
       .sort((a, b) => b.value - a.value);
  }, [filteredCites, cadenas]);

  // Top regions breakdown
  const regionsBreakdown = useMemo(() => {
    const counts = {};
    filteredCites.forEach((c) => {
      const reg = c.region || 'Por confirmar';
      const parts = reg.split('/').map(p => p.trim());
      parts.forEach(p => {
        counts[p] = (counts[p] || 0) + 1;
      });
    });

    return Object.entries(counts)
      .map(([label, value]) => ({
        label,
        value,
        color: actorMetadata.color || 'var(--cian)',
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [filteredCites, actorMetadata]);

  // Top services for specific actor groups
  const servicesBreakdown = useMemo(() => {
    const counts = {};
    filteredCites.forEach((c) => {
      if (c.servicios && Array.isArray(c.servicios)) {
        c.servicios.forEach((s) => {
          counts[s] = (counts[s] || 0) + 1;
        });
      }
    });

    return Object.entries(counts)
      .map(([label, value]) => ({
        label,
        value,
        color: actorMetadata.color || 'var(--cian)',
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [filteredCites, actorMetadata]);

  // Qualitative description highlights
  const highlights = useMemo(() => {
    const sample = filteredCites.slice(0, 5).map(n => n.nombre);
    const listStr = sample.length > 0 ? sample.join(', ') : '';

    const map = {
      universidad: {
        role: 'Generación de conocimiento y patentes de invención',
        impact: 'Las universidades lideran la producción científica y la postulación de patentes ante INDECOPI. Sus Oficinas de Transferencia Tecnológica (OTT) actúan como puentes para licenciar estas innovaciones a las empresas.',
        nodesLabel: 'Universidades destacadas en la red:',
        nodesList: listStr
      },
      empresa: {
        role: 'Absorción tecnológica y desarrollo comercial',
        impact: 'Las empresas innovadoras invierten en I+D+i para escalar tecnologías, optimizar procesos de producción y lanzar nuevos productos al mercado, colaborando estrechamente con la academia y los CITEs.',
        nodesLabel: 'Empresas destacadas en la red:',
        nodesList: listStr
      },
      startup: {
        role: 'Disrupción digital y modelos de negocio escalables',
        impact: 'Las startups dinamizan el ecosistema mediante tecnologías digitales (Fintech, EdTech, Agrotech) y rondas de inversión privada (Venture Capital), acelerando la digitalización de la economía peruana.',
        nodesLabel: 'Startups destacadas en la red:',
        nodesList: listStr
      },
      incubadora: {
        role: 'Soporte al emprendimiento dinámico y mentoría',
        impact: 'Las incubadoras y aceleradoras guían a los emprendedores desde la validación de la idea de negocio (etapa pre-semilla) hasta el levantamiento de capital y la internacionalización comercial.',
        nodesLabel: 'Incubadoras y aceleradoras destacadas:',
        nodesList: listStr
      },
      cati: {
        role: 'Fomento de la propiedad intelectual y patentes',
        impact: 'La Red CATI (INDECOPI/OMPI) provee servicios críticos de búsquedas tecnológicas de patentes en bases de datos internacionales, ayudando a investigadores a verificar la novedad de sus invenciones.',
        nodesLabel: 'Centros CATI activos en la red:',
        nodesList: listStr
      },
      coworking: {
        role: 'Infraestructura flexible y redes de contacto (Networking)',
        impact: 'Los espacios de coworking ofrecen a las pymes y startups la flexibilidad de oficinas compartidas, salas de reuniones y una comunidad activa para intercambiar ideas y generar alianzas de negocio.',
        nodesLabel: 'Coworkings destacados en la red:',
        nodesList: listStr
      },
      gobierno: {
        role: 'Financiamiento no reembolsable y políticas públicas',
        impact: 'El Estado, a través de fondos como ProInnóvate (PRODUCE) y ProCiencia (CONCYTEC), subsidia proyectos de innovación, digitalización y transferencia tecnológica, reduciendo el riesgo financiero de innovar.',
        nodesLabel: 'Instituciones de soporte destacadas:',
        nodesList: listStr
      }
    };
    return map[activeType] || null;
  }, [activeType, filteredCites]);

  return (
    <div className="map-root" style={{ position: 'absolute', padding: '30px', overflowY: 'auto', background: 'var(--bg)', width: '100%', height: '100%' }}>
      {/* Soft Dark UI custom style rules */}
      <style>{`
        .metrics-card {
          background: rgba(17, 24, 39, 0.45);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: var(--radius);
          padding: 24px;
          box-shadow: 0 20px 27px 0 rgba(0, 0, 0, 0.12), inset 0 1px 1px rgba(255, 255, 255, 0.04);
          backdrop-filter: blur(20px);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }
        .metrics-card:hover {
          transform: translateY(-3px);
          border-color: rgba(255, 255, 255, 0.14);
          box-shadow: 0 25px 35px 0 rgba(0, 0, 0, 0.22);
        }
        .table-row-highlight {
          transition: background-color 0.2s;
        }
        .table-row-highlight:hover {
          background: rgba(255, 255, 255, 0.02) !important;
        }
        .soft-tab-container {
          display: inline-flex;
          background: rgba(0, 0, 0, 0.25);
          border: 1px solid rgba(255, 255, 255, 0.04);
          border-radius: 30px;
          padding: 4px;
          gap: 4px;
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.3);
          flex-wrap: wrap;
        }
        .soft-pill-tab {
          background: transparent;
          border: none;
          color: var(--muted);
          padding: 8px 16px;
          border-radius: 25px;
          font-size: 0.72rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          align-items: center;
          gap: 6px;
          user-select: none;
          outline: none;
        }
        .soft-pill-tab:hover {
          color: #fff;
          background: rgba(255, 255, 255, 0.03);
        }
        .icon-shape {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justifyContent: center;
          color: #fff;
          font-size: 1rem;
          flex-shrink: 0;
        }
        .btn-reset-filter {
          background: rgba(0, 0, 0, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: #fff;
          padding: 7px 14px;
          border-radius: 20px;
          font-size: 0.72rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          backdrop-filter: blur(10px);
        }
        .btn-reset-filter:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.25);
          transform: scale(1.02);
        }
      `}</style>

      <div className="dashboard-wrapper">
        {/* Soft UI Alert Style Legend */}
        <div style={{
          background: 'rgba(212, 175, 55, 0.03)',
          border: '1px dashed rgba(212, 175, 55, 0.18)',
          borderRadius: '16px',
          padding: '16px 20px',
          marginBottom: '25px',
          fontSize: '0.74rem',
          lineHeight: '1.5',
          color: '#e2e8f0',
          display: 'flex',
          gap: '16px',
          alignItems: 'flex-start',
          boxShadow: '0 10px 20px rgba(0,0,0,0.05)'
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #f1c40f 0%, #d4af37 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(212,175,55,0.25)',
            fontSize: '1rem',
            color: '#fff',
            flexShrink: 0
          }}>
            💡
          </div>
          <div>
            <h4 style={{ margin: '0 0 4px 0', color: 'var(--oro)', fontSize: '0.8rem', fontWeight: 800, fontFamily: 'var(--font-display)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Guía de Navegación de KhipuNet
            </h4>
            <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.72rem' }}>
              • <b>Exploración Integral</b>: Alterna las pestañas superiores para ver el 🗺️ Mapa Geo, 🕸️ Grafo Red, 📊 Métricas o 🗂️ Directorio.<br />
              • <b>Control de Filtros</b>: Usa la barra lateral izquierda para restringir los nodos por actor o cadenas productivas en todo el sitio.<br />
              • <b>Métricas Aisladas por Actor</b>: El panel inferior e izquierdo sincronizan el dashboard. Al hacer clic en un actor específico (ej. CITEs), esta sección mostrará <b>únicamente</b> los datos, gráficos y medidas de tendencia central calculados para ese grupo, evitando la mezcla de datos.<br />
              • <b>Detalles Técnicos</b>: Selecciona cualquier actor para ver las fórmulas matemáticas de datos agrupados y sus marcas de clase (X<sub>i</sub>).
            </p>
          </div>
        </div>

        {/* Horizontal Actor Tab Buttons inside the Dashboard (Soft UI Container style) */}
        <div style={{ marginBottom: '25px', borderBottom: '1px solid var(--line)', paddingBottom: '18px' }}>
          <div className="soft-tab-container">
            {[
              ['todos', '🌌 Todos'],
              ['cite', '⚙️ CITEs'],
              ['universidad', '🏛️ Universidades'],
              ['empresa', '🏢 Empresas'],
              ['startup', '🚀 Startups'],
              ['incubadora', '🌱 Incubadoras'],
              ['cati', '🔍 Red CATI'],
              ['coworking', '🤝 Coworking'],
              ['gobierno', '⚖️ Soporte'],
            ].map(([val, label]) => {
              const isActive = activeType === val;
              const grad = actorGradients[val].grad;
              const glow = actorGradients[val].glow;
              return (
                <button
                  key={val}
                  type="button"
                  className="soft-pill-tab"
                  style={isActive ? {
                    background: grad,
                    color: '#fff',
                    boxShadow: `0 4px 15px ${glow}`
                  } : {}}
                  onClick={() => onTypeChange(val)}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {N_total === 0 ? (
          <div className="metrics-card" style={{ padding: '60px 20px', textAlign: 'center' }}>
            <span style={{ fontSize: '3rem' }}>🔍</span>
            <h3 style={{ margin: '15px 0 8px', color: '#fff', fontFamily: 'var(--font-display)' }}>No se encontraron nodos</h3>
            <p style={{ color: 'var(--muted)', fontSize: '0.85rem', maxWidth: '400px', margin: '0 auto' }}>
              Actualmente no existen entidades catalogadas bajo este tipo de actor. Prueba a seleccionar una categoría distinta o restablece los filtros.
            </p>
          </div>
        ) : (
          <>
            {/* 2. PREMIUM PHOTO-REALISTIC HERO BANNER */}
            <div style={{
              position: 'relative',
              width: '100%',
              height: '240px',
              borderRadius: '20px',
              overflow: 'hidden',
              marginBottom: '35px',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
              backgroundImage: `linear-gradient(to bottom, rgba(7, 10, 14, 0.1) 0%, rgba(7, 10, 14, 0.95) 100%), url(${activeBannerImg})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              display: 'flex',
              alignItems: 'flex-end',
              padding: '30px',
              boxSizing: 'border-box'
            }}>
              {/* Reset button inside banner */}
              {activeType !== 'todos' && (
                <div style={{ position: 'absolute', top: '24px', right: '24px', zIndex: 10 }}>
                  <button 
                    type="button" 
                    className="btn-reset-filter"
                    onClick={() => onTypeChange('todos')}
                  >
                    🌌 Ver todos los actores
                  </button>
                </div>
              )}

              {/* Banner content */}
              <div style={{ zIndex: 2, display: 'flex', gap: '24px', alignItems: 'center', width: '100%', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flex: '1 1 500px' }}>
                  <div className="icon-shape" style={{
                    background: actorMetadata.grad,
                    boxShadow: `0 8px 25px ${actorMetadata.glow}`,
                    width: '52px',
                    height: '52px',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.7rem'
                  }}>
                    {actorMetadata.icon}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 800, margin: 0, color: '#fff', letterSpacing: '-0.5px' }}>
                        {actorMetadata.title}
                      </h1>
                      <span style={{
                        background: `${actorMetadata.color}25`,
                        border: `1px solid ${actorMetadata.color}50`,
                        color: actorMetadata.color,
                        fontSize: '0.62rem',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        letterSpacing: '0.05em'
                      }}>
                        {actorMetadata.badgeText}
                      </span>
                    </div>
                    <p style={{ color: '#cbd5e1', fontSize: '0.85rem', margin: '6px 0 0 0', maxWidth: '750px', lineHeight: '1.4', textShadow: '0 2px 5px rgba(0,0,0,0.8)' }}>
                      {actorMetadata.description}
                    </p>
                  </div>
                </div>

                {/* KPI Bubble representing Peruvian presence */}
                <div style={{
                  background: 'rgba(15, 22, 30, 0.75)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '14px',
                  padding: '12px 20px',
                  backdropFilter: 'blur(10px)',
                  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.35)',
                  textAlign: 'center',
                  minWidth: '150px'
                }}>
                  <div style={{ fontSize: '0.58rem', color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Presencia Nacional
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: actorMetadata.color, fontFamily: 'var(--font-display)', margin: '2px 0' }}>
                    {N_total} Nodos
                  </div>
                  <div style={{ fontSize: '0.58rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Ecosistema Activo
                  </div>
                </div>
              </div>
            </div>

            {/* 3. SOFT UI STYLE KPI SUMMARY CARDS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '35px' }}>
              
              {/* Card 1: Sample N */}
              <div className="metrics-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.62rem', color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Muestra Poblacional (N)
                  </div>
                  <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#fff', marginTop: '4px', fontFamily: 'var(--font-display)' }}>
                    {N_total} <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--muted)' }}>nodos</span>
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--muted)', marginTop: '4px' }}>
                    Entidades en este segmento
                  </div>
                </div>
                <div className="icon-shape" style={{
                  background: actorMetadata.grad,
                  boxShadow: `0 4px 15px ${actorMetadata.glow}`,
                  fontSize: '1.1rem'
                }}>
                  📊
                </div>
              </div>

              {/* Card 2: Mean Services */}
              <div className="metrics-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.62rem', color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Media de Servicios (X̄)
                  </div>
                  <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#fff', marginTop: '4px', fontFamily: 'var(--font-display)' }}>
                    {cuantitativeStats.media.toFixed(2)} <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--muted)' }}>por actor</span>
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--muted)', marginTop: '4px' }}>
                    Promedio de cartera tecnológica
                  </div>
                </div>
                <div className="icon-shape" style={{
                  background: 'linear-gradient(135deg, #4cd137 0%, #2e8b00 100%)',
                  boxShadow: '0 4px 15px rgba(76,209,55,0.25)',
                  fontSize: '1.1rem'
                }}>
                  ⚡
                </div>
              </div>

              {/* Card 3: Standard Deviation */}
              <div className="metrics-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.62rem', color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Desviación Estándar (S)
                  </div>
                  <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#fff', marginTop: '4px', fontFamily: 'var(--font-display)' }}>
                    ±{cuantitativeStats.desviacionEstandar.toFixed(2)} <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--muted)' }}>servicios</span>
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--muted)', marginTop: '4px' }}>
                    Dispersión de la oferta tecnológica
                  </div>
                </div>
                <div className="icon-shape" style={{
                  background: 'linear-gradient(135deg, #00bfff 0%, #0077b6 100%)',
                  boxShadow: '0 4px 15px rgba(0,191,255,0.25)',
                  fontSize: '1.1rem'
                }}>
                  📐
                </div>
              </div>

              {/* Card 4: Predominant Category/Interval */}
              <div className="metrics-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.62rem', color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Moda de Servicios (Mo)
                  </div>
                  <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#fff', marginTop: '4px', fontFamily: 'var(--font-display)' }}>
                    {cuantitativeStats.moda.toFixed(1)} <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--muted)' }}>servicios</span>
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--muted)', marginTop: '4px' }}>
                    Rango con mayor frecuencia
                  </div>
                </div>
                <div className="icon-shape" style={{
                  background: 'linear-gradient(135deg, #ffa502 0%, #e67e22 100%)',
                  boxShadow: '0 4px 15px rgba(255,165,2,0.25)',
                  fontSize: '1.1rem'
                }}>
                  🎯
                </div>
              </div>

            </div>

            {/* 4. CORE VISUAL CHARTS GRID */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '24px', marginBottom: '35px' }}>
              
              {/* Chart Pane 1: Donut breakdown or Regions */}
              <div className="metrics-card">
                {activeType === 'todos' && (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px', borderBottom: '1px solid var(--line)', paddingBottom: '12px' }}>
                      <div className="icon-shape" style={{
                        background: 'linear-gradient(135deg, #9b51e0 0%, #701a75 100%)',
                        boxShadow: '0 4px 15px rgba(155,81,224,0.25)'
                      }}>
                        🎭
                      </div>
                      <div>
                        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '0.85rem', fontWeight: 800, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                          Distribución de Actores en la Red
                        </h3>
                        <span style={{ fontSize: '0.62rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Frecuencia Relativa Agregada
                        </span>
                      </div>
                    </div>
                    <DonutChart data={globalActorBreakdown} />
                  </>
                )}

                {activeType === 'cite' && (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px', borderBottom: '1px solid var(--line)', paddingBottom: '12px' }}>
                      <div className="icon-shape" style={{
                        background: 'linear-gradient(135deg, #10ac84 0%, #019031 100%)',
                        boxShadow: '0 4px 15px rgba(16,172,132,0.25)'
                      }}>
                        ⚖️
                      </div>
                      <div>
                        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '0.85rem', fontWeight: 800, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                          Naturaleza del CITE (Público vs Privado)
                        </h3>
                        <span style={{ fontSize: '0.62rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Distribución de Dependencia de Gestión
                        </span>
                      </div>
                    </div>
                    <DonutChart data={citeTypeBreakdown} />
                  </>
                )}

                {activeType !== 'todos' && activeType !== 'cite' && (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px', borderBottom: '1px solid var(--line)', paddingBottom: '12px' }}>
                      <div className="icon-shape" style={{
                        background: actorMetadata.grad,
                        boxShadow: `0 4px 15px ${actorMetadata.glow}`
                      }}>
                        📍
                      </div>
                      <div>
                        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '0.85rem', fontWeight: 800, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                          Descentralización Regional
                        </h3>
                        <span style={{ fontSize: '0.62rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Concentración de Nodos por Región
                        </span>
                      </div>
                    </div>
                    <BarChart data={regionsBreakdown} />
                  </>
                )}
              </div>

              {/* Chart Pane 2: Chain or Services distribution */}
              <div className="metrics-card">
                {activeType === 'todos' && (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px', borderBottom: '1px solid var(--line)', paddingBottom: '12px' }}>
                      <div className="icon-shape" style={{
                        background: 'linear-gradient(135deg, #2e8b00 0%, #1a4d00 100%)',
                        boxShadow: '0 4px 15px rgba(46,139,0,0.25)'
                      }}>
                        🌲
                      </div>
                      <div>
                        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '0.85rem', fontWeight: 800, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                          Concentración por Cadenas Productivas
                        </h3>
                        <span style={{ fontSize: '0.62rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Cobertura del Ecosistema Nacional
                        </span>
                      </div>
                    </div>
                    <BarChart data={cadenasBreakdown} />
                  </>
                )}

                {activeType === 'cite' && (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px', borderBottom: '1px solid var(--line)', paddingBottom: '12px' }}>
                      <div className="icon-shape" style={{
                        background: 'linear-gradient(135deg, #e67e22 0%, #b33939 100%)',
                        boxShadow: '0 4px 15px rgba(230,126,34,0.25)'
                      }}>
                        💼
                      </div>
                      <div>
                        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '0.85rem', fontWeight: 800, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                          Cadenas Productivas de Atención CITE
                        </h3>
                        <span style={{ fontSize: '0.62rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Especialización Industrial
                        </span>
                      </div>
                    </div>
                    <BarChart data={cadenasBreakdown} />
                  </>
                )}

                {activeType !== 'todos' && activeType !== 'cite' && (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px', borderBottom: '1px solid var(--line)', paddingBottom: '12px' }}>
                      <div className="icon-shape" style={{
                        background: actorMetadata.grad,
                        boxShadow: `0 4px 15px ${actorMetadata.glow}`
                      }}>
                        🛠️
                      </div>
                      <div>
                        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '0.85rem', fontWeight: 800, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                          Servicios Tecnológicos Frecuentes
                        </h3>
                        <span style={{ fontSize: '0.62rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Principales capacidades del catálogo
                        </span>
                      </div>
                    </div>
                    {servicesBreakdown.length > 0 ? (
                      <BarChart data={servicesBreakdown} />
                    ) : (
                      <div style={{ padding: '40px 10px', textAlign: 'center', color: 'var(--muted)', fontSize: '0.75rem' }}>
                        No se detallan catálogos cuantitativos de servicios estructurados para este grupo.
                      </div>
                    )}
                  </>
                )}
              </div>

            </div>

            {/* 5. DUAL-ROW FOR QUANTITATIVE STATISTICS TABLE & BEZIER AREA LINE CHART */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '24px', marginBottom: '35px' }}>
              
              {/* Soft UI Bezier Area Line Chart (Services Frequencies) */}
              <div className="metrics-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px', borderBottom: '1px solid var(--line)', paddingBottom: '12px' }}>
                  <div className="icon-shape" style={{
                    background: actorMetadata.grad,
                    boxShadow: `0 4px 15px ${actorMetadata.glow}`
                  }}>
                    📈
                  </div>
                  <div>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '0.85rem', fontWeight: 800, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                      Curva de Oferta de Servicios
                    </h3>
                    <span style={{ fontSize: '0.62rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Frecuencia por número de servicios (Bezier Interpolation)
                    </span>
                  </div>
                </div>
                
                <AreaLineChart
                  table={cuantitativeStats.table}
                  color={actorMetadata.color}
                  id={activeType}
                />
              </div>

              {/* Central Tendency Math & Highlights */}
              <div className="metrics-card" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '0px', borderBottom: '1px solid var(--line)', paddingBottom: '12px' }}>
                  <div className="icon-shape" style={{
                    background: 'linear-gradient(135deg, #e67e22 0%, #d35400 100%)',
                    boxShadow: '0 4px 15px rgba(230,126,34,0.25)'
                  }}>
                    📐
                  </div>
                  <div>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '0.85rem', fontWeight: 800, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                      Tendencia Central y Dispersión
                    </h3>
                    <span style={{ fontSize: '0.62rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Fórmulas analíticas para datos agrupados
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'rgba(0,0,0,0.15)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '12px', padding: '14px' }}>
                  
                  {/* Media */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem' }}>
                    <div>
                      <span style={{ color: '#fff', fontWeight: 'bold' }}>Media Aritmética (X̄)</span>
                      <div style={{ fontSize: '0.62rem', color: 'var(--muted)', fontFamily: 'monospace', marginTop: '1px' }}>
                        X̄ = Σ(Xi · fi) / N
                      </div>
                    </div>
                    <div style={{ fontSize: '1rem', fontWeight: 800, color: '#4cd137', fontFamily: 'var(--font-display)' }}>
                      {cuantitativeStats.media.toFixed(3)}
                    </div>
                  </div>

                  {/* Mediana */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '8px' }}>
                    <div>
                      <span style={{ color: '#fff', fontWeight: 'bold' }}>Mediana (Me)</span>
                      <div style={{ fontSize: '0.62rem', color: 'var(--muted)', fontFamily: 'monospace', marginTop: '1px' }}>
                        Me = Li + [((N/2) - Fi-1) / fi] · a
                      </div>
                    </div>
                    <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--cian)', fontFamily: 'var(--font-display)' }}>
                      {cuantitativeStats.mediana.toFixed(3)}
                    </div>
                  </div>

                  {/* Moda */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '8px' }}>
                    <div>
                      <span style={{ color: '#fff', fontWeight: 'bold' }}>Moda (Mo)</span>
                      <div style={{ fontSize: '0.62rem', color: 'var(--muted)', fontFamily: 'monospace', marginTop: '1px' }}>
                        Mo = Li + [d1 / (d1 + d2)] · a
                      </div>
                    </div>
                    <div style={{ fontSize: '1rem', fontWeight: 800, color: '#ffa502', fontFamily: 'var(--font-display)' }}>
                      {cuantitativeStats.moda.toFixed(3)}
                    </div>
                  </div>

                  {/* Varianza */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '8px' }}>
                    <div>
                      <span style={{ color: '#fff', fontWeight: 'bold' }}>Varianza de Muestra (S²)</span>
                      <div style={{ fontSize: '0.62rem', color: 'var(--muted)', fontFamily: 'monospace', marginTop: '1px' }}>
                        S² = Σ(fi · (Xi - X̄)²) / N
                      </div>
                    </div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--muted)' }}>
                      {cuantitativeStats.varianza.toFixed(3)}
                    </div>
                  </div>

                </div>

                {highlights ? (
                  <div style={{ fontSize: '0.72rem', background: 'rgba(255,255,255,0.02)', padding: '12px 16px', borderRadius: '12px', borderLeft: `4px solid ${actorMetadata.color}`, lineHeight: '1.45', borderTop: '1px solid rgba(255,255,255,0.03)' }}>
                    <div style={{ fontWeight: '800', color: '#fff', marginBottom: '4px', textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: '0.05em' }}>
                      ⚡ Rol: {highlights.role}
                    </div>
                    <p style={{ margin: '0 0 8px 0', color: 'var(--muted)' }}>{highlights.impact}</p>
                    {highlights.nodesList && (
                      <div style={{ color: '#e2e8f0', fontSize: '0.68rem' }}>
                        <b>{highlights.nodesLabel}</b> <span style={{ color: 'var(--muted)' }}>{highlights.nodesList}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ fontSize: '0.7rem', color: 'var(--muted)', lineHeight: '1.4' }}>
                    📌 <b>Coherencia Estadística</b>: Al evaluar los actores de forma agrupada por el volumen de sus servicios, la cercanía relativa entre la Media ({cuantitativeStats.media.toFixed(2)}) y la Mediana ({cuantitativeStats.mediana.toFixed(2)}) provee un indicador del grado de simetría en el portafolio de servicios.
                  </div>
                )}
              </div>

            </div>

            {/* 6. GEOGRAPHICAL CONCENTRATION OR QUANTITATIVE FREQUENCY TABLE */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '24px', marginBottom: '35px' }}>
              
              {/* Detailed Frequency Table */}
              <div className="metrics-card" style={{ gridColumn: 'span 2' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px', borderBottom: '1px solid var(--line)', paddingBottom: '12px' }}>
                  <div className="icon-shape" style={{
                    background: 'linear-gradient(135deg, #10ac84 0%, #019031 100%)',
                    boxShadow: '0 4px 15px rgba(16,172,132,0.25)'
                  }}>
                    🔢
                  </div>
                  <div>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '0.85rem', fontWeight: 800, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                      Tabla de Distribución de Frecuencia de Servicios
                    </h3>
                    <span style={{ fontSize: '0.62rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Datos Agrupados Cuantitativos (Intervalo Amplitud a = 2)
                    </span>
                  </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.74rem', textAlign: 'left', color: '#cbd5e1' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                        <th style={{ padding: '10px 8px', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted)', letterSpacing: '0.08em' }}>Clase / Servicios</th>
                        <th style={{ padding: '10px 8px', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted)', letterSpacing: '0.08em', textAlign: 'center' }}>X<sub>i</sub> (Marca Clase)</th>
                        <th style={{ padding: '10px 8px', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted)', letterSpacing: '0.08em', textAlign: 'center' }}>f<sub>i</sub> (Absoluta)</th>
                        <th style={{ padding: '10px 8px', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted)', letterSpacing: '0.08em', textAlign: 'center' }}>h<sub>i</sub> (Relativa)</th>
                        <th style={{ padding: '10px 8px', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted)', letterSpacing: '0.08em', textAlign: 'center' }}>F<sub>i</sub> (Acumulada)</th>
                        <th style={{ padding: '10px 8px', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted)', letterSpacing: '0.08em', textAlign: 'center' }}>H<sub>i</sub> (Rel. Acum.)</th>
                        <th style={{ padding: '10px 8px', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted)', letterSpacing: '0.08em', textAlign: 'center' }}>X<sub>i</sub> · f<sub>i</sub></th>
                      </tr>
                    </thead>
                    <tbody>
                      {cuantitativeStats.table.map((row) => (
                        <tr key={row.label} className="table-row-highlight" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <td style={{ padding: '12px 8px', fontWeight: '700', color: '#fff' }}>{row.label}</td>
                          <td style={{ padding: '12px 8px', textAlign: 'center', color: 'var(--oro)', fontWeight: '600' }}>{row.Xi.toFixed(1)}</td>
                          <td style={{ padding: '12px 8px', textAlign: 'center', color: '#fff', fontWeight: '700' }}>{row.fi}</td>
                          <td style={{ padding: '12px 8px', textAlign: 'center' }}>{row.hi.toFixed(3)}</td>
                          <td style={{ padding: '12px 8px', textAlign: 'center', color: 'var(--muted)' }}>{row.Fi}</td>
                          <td style={{ padding: '12px 8px', textAlign: 'center', color: 'var(--muted)' }}>{row.Hi.toFixed(3)}</td>
                          <td style={{ padding: '12px 8px', textAlign: 'center', color: '#4cd137', fontWeight: '700' }}>{row.XiFi.toFixed(1)}</td>
                        </tr>
                      ))}
                      <tr style={{ fontWeight: 'bold', background: 'rgba(255,255,255,0.01)', borderTop: '2px solid rgba(255,255,255,0.1)' }}>
                        <td style={{ padding: '14px 8px', color: '#fff' }}>Total (Σ)</td>
                        <td style={{ padding: '14px 8px', textAlign: 'center' }}>-</td>
                        <td style={{ padding: '14px 8px', textAlign: 'center', color: '#fff' }}>{cuantitativeStats.N}</td>
                        <td style={{ padding: '14px 8px', textAlign: 'center' }}>1.000</td>
                        <td style={{ padding: '14px 8px', textAlign: 'center' }}>-</td>
                        <td style={{ padding: '14px 8px', textAlign: 'center' }}>-</td>
                        <td style={{ padding: '14px 8px', textAlign: 'center', color: '#4cd137' }}>
                          {cuantitativeStats.table.reduce((sum, r) => sum + r.XiFi, 0).toFixed(1)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

            {/* 7. DYNAMIC HIGHLIGHTED ENTITIES FEED (Humanizing the Ecosystem) */}
            {highlightedNodes.length > 0 && (
              <div style={{ marginTop: '10px', marginBottom: '35px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px', borderBottom: '1px solid var(--line)', paddingBottom: '12px' }}>
                  <div className="icon-shape" style={{
                    background: 'linear-gradient(135deg, #ffa502 0%, #e67e22 100%)',
                    boxShadow: '0 4px 15px rgba(255,165,2,0.25)'
                  }}>
                    👥
                  </div>
                  <div>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '0.85rem', fontWeight: 800, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                      Entidades Destacadas del Segmento
                    </h3>
                    <span style={{ fontSize: '0.62rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Humanizando la Red — Organizaciones, servicios y cobertura territorial real
                    </span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
                  {highlightedNodes.map((node, idx) => (
                    <div key={node.id || idx} className="metrics-card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: actorMetadata.grad,
                          boxShadow: `0 4px 10px ${actorMetadata.glow}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                          fontWeight: 800,
                          fontSize: '0.75rem',
                          flexShrink: 0
                        }}>
                          {node.nombre.substring(0, 2).toUpperCase()}
                        </div>
                        <div style={{ flex: 1, overflow: 'hidden' }}>
                          <h4 style={{ margin: 0, fontSize: '0.8rem', color: '#fff', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={node.nombre}>
                            {node.nombre}
                          </h4>
                          <div style={{ display: 'flex', gap: '6px', marginTop: '2px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.58rem', background: 'rgba(255,255,255,0.04)', padding: '1px 6px', borderRadius: '4px', color: 'var(--muted)' }}>
                              📍 {node.region}
                            </span>
                            {node.ciudad && (
                              <span style={{ fontSize: '0.58rem', background: 'rgba(255,255,255,0.04)', padding: '1px 6px', borderRadius: '4px', color: 'var(--muted)' }}>
                                {node.ciudad}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <p style={{ fontSize: '0.7rem', color: 'var(--muted)', lineHeight: '1.45', margin: '0 0 16px 0', flex: 1, fontStyle: 'italic' }}>
                        "{node.descripcion.length > 150 ? `${node.descripcion.substring(0, 145)}...` : node.descripcion}"
                      </p>

                      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '12px' }}>
                        <div style={{ fontSize: '0.6rem', color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                          Servicios Destacados
                        </div>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          {node.servicios.slice(0, 3).map((s, sIdx) => (
                            <span key={sIdx} style={{
                              fontSize: '0.58rem',
                              background: `${actorMetadata.color}12`,
                              border: `1px solid ${actorMetadata.color}25`,
                              color: actorMetadata.color,
                              padding: '2px 6px',
                              borderRadius: '6px',
                              whiteSpace: 'nowrap'
                            }}>
                              {s}
                            </span>
                          ))}
                          {node.servicios.length > 3 && (
                            <span style={{ fontSize: '0.58rem', color: 'var(--muted)', padding: '2px 4px' }}>
                              +{node.servicios.length - 3} más
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 8. GEOGRAPHICAL CONCENTRATION FOR CITEs (ONLY SHOWN FOR CITE CATEGORY) */}
            {activeType === 'cite' && (
              <div className="metrics-card" style={{ marginBottom: '35px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px', borderBottom: '1px solid var(--line)', paddingBottom: '12px' }}>
                  <div className="icon-shape" style={{
                    background: actorMetadata.grad,
                    boxShadow: `0 4px 15px ${actorMetadata.glow}`
                  }}>
                    📍
                  </div>
                  <div>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '0.85rem', fontWeight: 800, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                      Descentralización Regional del CITE
                    </h3>
                    <span style={{ fontSize: '0.62rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Distribución por región geográfica
                    </span>
                  </div>
                </div>
                <BarChart data={regionsBreakdown} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
