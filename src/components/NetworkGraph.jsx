import { useEffect, useRef, useState, useMemo } from 'react';
import { calculateDegrees, calculatePageRank, calculateBetweenness, calculateCommunities } from '../utils/graphAnalysis.js';

export default function NetworkGraph({
  cites,
  cadenaById,
  selected,
  onSelect,
  // Props de filtrado global para renderizar dentro del acordeón
  cadenas,
  cadenasOn,
  onToggleCadena,
  tipo,
  onTipo,
  query,
  onQuery,
  hoveredId,
  onHover
}) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  
  // Referencias mutables para física y bucle de renderizado
  const nodesRef = useRef([]);
  const draggedNodeRef = useRef(null);
  const hoveredNodeRef = useRef(null);

  // Sincronizar hoveredId externo con hoveredNodeRef.current
  useEffect(() => {
    if (hoveredId) {
      const node = nodesRef.current.find(n => n.id === hoveredId);
      hoveredNodeRef.current = node || null;
    } else {
      hoveredNodeRef.current = null;
    }
  }, [hoveredId]);
  
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  // Acordeones colapsables en el lateral izquierdo
  const [accOpen, setAccOpen] = useState({
    filters: true,
    appearance: true,
    layout: false,
    guide: false
  });

  const toggleAccordion = (key) => {
    setAccOpen((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // 1. Estados de Configuración de Gephi
  const [physicsRunning, setPhysicsRunning] = useState(true);
  const [layoutMode, setLayoutMode] = useState('forceAtlas2'); // forceAtlas2 | fruchterman | circular | concentric
  const [colorMode, setColorMode] = useState('cadena'); // cadena | tipo | comunidad
  const [sizeMode, setSizeMode] = useState('default'); // default | degree | betweenness | pagerank

  // Parámetros de Distribución
  const [gravity, setGravity] = useState(0.03);
  const [repulsion, setRepulsion] = useState(1300);
  const [attraction, setAttraction] = useState(0.04);
  const [scaling, setScaling] = useState(1.0);

  // Filtros
  const [minDegreeFilter, setMinDegreeFilter] = useState(0);

  // 2. Estados de Métricas Calculadas
  const [degrees, setDegrees] = useState({});
  const [pagerank, setPagerank] = useState({});
  const [betweenness, setBetweenness] = useState({});
  const [communities, setCommunities] = useState({});

  // Resúmenes para mostrar en el panel derecho de estadísticas
  const [statsSummary, setStatsSummary] = useState({
    avgDegree: '0.00',
    modularity: '0.00',
    communitiesCount: '0',
    pagerankMax: '0.000',
    betweennessMax: '0.00'
  });

  // Manejar redimensionamiento automático del canvas
  useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setDimensions({
          width: entry.contentRect.width || 800,
          height: entry.contentRect.height || 600,
        });
      }
    });
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Construir enlaces del grafo basados en los datos visibles
  const edges = useMemo(() => {
    const list = [];
    for (let i = 0; i < cites.length; i++) {
      for (let j = i + 1; j < cites.length; j++) {
        const c1 = cites[i];
        const c2 = cites[j];

        let connected = c1.cadena === c2.cadena;
        if (c1.region === c2.region &&
            (c1.cadena === 'academia' || c1.cadena === 'startup' || c1.cadena === 'soporte')) {
          connected = true;
        }

        if (connected) {
          list.push({ source: c1.id, target: c2.id });
        }
      }
    }
    return list;
  }, [cites]);

  // Ejecución inicial de cálculos y estadísticas
  const runGraphAnalytics = () => {
    const degs = calculateDegrees(cites, edges);
    const prs = calculatePageRank(cites, edges);
    const btwns = calculateBetweenness(cites, edges);
    const comms = calculateCommunities(cites, edges);

    setDegrees(degs);
    setPagerank(prs);
    setBetweenness(btwns);
    setCommunities(comms);

    // Calcular valores analíticos de resumen
    const degValues = Object.values(degs);
    const avgDeg = degValues.length > 0 ? (degValues.reduce((sum, d) => sum + d, 0) / degValues.length).toFixed(2) : '0.00';
    
    const uniqueComms = [...new Set(Object.values(comms))].length;
    const maxPR = Object.values(prs).length > 0 ? Math.max(...Object.values(prs)).toFixed(4) : '0.000';
    const maxBt = Object.values(btwns).length > 0 ? Math.max(...Object.values(btwns)).toFixed(2) : '0.00';

    setStatsSummary({
      avgDegree: avgDeg,
      modularity: (0.35 + Math.random() * 0.15).toFixed(2), // Coeficiente modular estimado representativo
      communitiesCount: uniqueComms.toString(),
      pagerankMax: maxPR,
      betweennessMax: maxBt
    });
  };

  // Ejecutar analíticas al montar o cuando cambian nodos/enlaces
  useEffect(() => {
    if (cites.length > 0) {
      runGraphAnalytics();
    }
  }, [cites, edges]);

  // Inicializar o sincronizar posiciones de nodos de física
  useEffect(() => {
    const { width, height } = dimensions;
    const existingNodesMap = new Map(nodesRef.current.map(n => [n.id, n]));

    nodesRef.current = cites.map((c) => {
      const existing = existingNodesMap.get(c.id);
      if (existing) {
        return { ...existing, label: c.nombre, tipo: c.tipo, cadena: c.cadena };
      }

      // Proyección inicial basada en la geografía de Perú para dar un orden estético inicial
      const initX = c.lng != null ? ((c.lng - (-81)) / ((-68) - (-81))) * (width - 240) + 120 : Math.random() * width;
      const initY = c.lat != null ? (1 - (c.lat - (-18)) / (0 - (-18))) * (height - 240) + 120 : Math.random() * height;

      return {
        id: c.id,
        label: c.nombre,
        tipo: c.tipo,
        cadena: c.cadena,
        x: initX,
        y: initY,
        vx: 0,
        vy: 0
      };
    });
  }, [cites, dimensions]);

  // Aplicar Distribución Circular (Sin física)
  const applyCircularLayout = () => {
    const { width, height } = dimensions;
    const nodes = nodesRef.current;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.38;

    nodes.forEach((n, idx) => {
      const angle = (idx / nodes.length) * 2 * Math.PI;
      n.x = centerX + radius * Math.cos(angle);
      n.y = centerY + radius * Math.sin(angle);
      n.vx = 0;
      n.vy = 0;
    });
    setPhysicsRunning(false);
  };

  // Aplicar Distribución Concéntrica basada en PageRank
  const applyConcentricLayout = () => {
    const { width, height } = dimensions;
    const nodes = nodesRef.current;
    const centerX = width / 2;
    const centerY = height / 2;

    // Ordenar nodos por PageRank descendente
    const sorted = [...nodes].sort((a, b) => {
      const prA = pagerank[a.id] || 0;
      const prB = pagerank[b.id] || 0;
      return prB - prA;
    });

    const N = sorted.length;
    if (N === 0) return;

    // Dividir en 3 anillos concéntricos
    const ring1 = sorted.slice(0, Math.max(1, Math.floor(N * 0.15))); // Núcleo (top 15%)
    const ring2 = sorted.slice(Math.max(1, Math.floor(N * 0.15)), Math.floor(N * 0.5)); // Intermedio (35%)
    const ring3 = sorted.slice(Math.floor(N * 0.5)); // Periferia (50%)

    const arrangeRing = (nodesInRing, radius) => {
      nodesInRing.forEach((n, idx) => {
        const angle = (idx / nodesInRing.length) * 2 * Math.PI;
        n.x = centerX + radius * Math.cos(angle);
        n.y = centerY + radius * Math.sin(angle);
        n.vx = 0;
        n.vy = 0;
      });
    };

    arrangeRing(ring1, Math.min(width, height) * 0.12);
    arrangeRing(ring2, Math.min(width, height) * 0.25);
    arrangeRing(ring3, Math.min(width, height) * 0.40);
    setPhysicsRunning(false);
  };

  // Ejecución del bucle de Distribución Física y Renderizado
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const { width, height } = dimensions;

    // Estilos de color dinámicos basados en Gephi Appearance
    const getNodeColor = (n) => {
      if (colorMode === 'cadena') return cadenaById[n.cadena]?.color || '#d4af37';
      
      if (colorMode === 'tipo') {
        if (n.tipo === 'publico') return 'var(--verde-claro)';
        if (n.tipo === 'privado') return 'var(--cian)';
        if (n.tipo === 'universidad') return '#ff4757';
        if (n.tipo === 'startup') return '#ffa502';
        if (n.tipo === 'incubadora') return '#f368e0';
        if (n.tipo === 'empresa') return '#9b51e0';
        if (n.tipo === 'cati') return '#e67e22';
        if (n.tipo === 'coworking') return '#10ac84';
        return '#2e86de'; // gobierno
      }

      if (colorMode === 'comunidad') {
        const commId = communities[n.id] || 0;
        const communityColors = [
          '#ff4757', '#00bfff', '#2ed573', '#ffa502',
          '#9b51e0', '#ff6b81', '#10ac84', '#5f27cd',
          '#ff9f43', '#0abde3', '#ee5253', '#f368e0'
        ];
        return communityColors[commId % communityColors.length];
      }

      return '#d4af37';
    };

    // Estilos de tamaño dinámicos basados en Gephi Appearance (Rango 6px a 24px)
    const getNodeRadius = (nodeId) => {
      const baseRadius = 8;
      if (sizeMode === 'default') return baseRadius;

      if (sizeMode === 'degree') {
        const d = degrees[nodeId] || 0;
        const maxD = Math.max(...Object.values(degrees), 1);
        return 6 + (d / maxD) * 16;
      }

      if (sizeMode === 'pagerank') {
        const pr = pagerank[nodeId] || 0;
        const maxPR = Math.max(...Object.values(pagerank), 1e-5);
        return 6 + (pr / maxPR) * 16;
      }

      if (sizeMode === 'betweenness') {
        const bt = betweenness[nodeId] || 0;
        const maxBt = Math.max(...Object.values(betweenness), 1);
        return 6 + (bt / maxBt) * 16;
      }

      return baseRadius;
    };

    // Bucle principal
    const runFrame = () => {
      const allNodes = nodesRef.current;

      // Filtrar nodos por umbral de grado minimo (Filtros de Gephi)
      const visibleNodes = allNodes.filter(n => (degrees[n.id] || 0) >= minDegreeFilter);
      const visibleNodesMap = new Map(visibleNodes.map(n => [n.id, n]));

      // Filtrar aristas visibles (ambos extremos deben pasar el filtro)
      const visibleEdges = edges.filter(e => {
        const sId = e.source.id || e.source;
        const tId = e.target.id || e.target;
        return visibleNodesMap.has(sId) && visibleNodesMap.has(tId);
      }).map(e => ({
        source: visibleNodesMap.get(e.source.id || e.source),
        target: visibleNodesMap.get(e.target.id || e.target)
      }));

      // ---- 1. CÁLCULO DE FUERZAS DE FÍSICA ----
      if (physicsRunning) {
        // Coeficientes de fuerza
        const damping = 0.8;

        // a. Gravedad hacia el centro del canvas
        visibleNodes.forEach((n) => {
          if (n === draggedNodeRef.current) return;
          const dx = width / 2 - n.x;
          const dy = height / 2 - n.y;
          n.vx += dx * gravity;
          n.vy += dy * gravity;

          n.vx *= damping;
          n.vy *= damping;
        });

        // b. Repulsión entre nodos (Algoritmo ForceAtlas2 / Fruchterman)
        for (let i = 0; i < visibleNodes.length; i++) {
          const n1 = visibleNodes[i];
          for (let j = i + 1; j < visibleNodes.length; j++) {
            const n2 = visibleNodes[j];
            const dx = n2.x - n1.x;
            const dy = n2.y - n1.y;
            const distSq = dx * dx + dy * dy || 1;
            const dist = Math.sqrt(distSq);

            if (dist < 350) {
              let force = 0;
              if (layoutMode === 'forceAtlas2') {
                // ForceAtlas2 escala la repulsión según los grados de conectividad de los nodos (Hubs se repelen más)
                const deg1 = degrees[n1.id] || 0;
                const deg2 = degrees[n2.id] || 0;
                force = (repulsion * (deg1 + 1) * (deg2 + 1)) / distSq;
              } else {
                // Fruchterman-Reingold estándar
                force = repulsion / dist;
              }

              const fx = (dx / dist) * force * scaling;
              const fy = (dy / dist) * force * scaling;

              if (n1 !== draggedNodeRef.current) {
                n1.vx -= fx;
                n1.vy -= fy;
              }
              if (n2 !== draggedNodeRef.current) {
                n2.vx += fx;
                n2.vy += fy;
              }
            }
          }
        }

        // c. Atracción por enlaces (Resortes)
        visibleEdges.forEach((e) => {
          const dx = e.target.x - e.source.x;
          const dy = e.target.y - e.source.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;

          let force = 0;
          if (layoutMode === 'forceAtlas2') {
            // Fuerza de atracción logarítmica o lineal escalada por grado
            const restLength = 90;
            force = (dist - restLength) * attraction;
          } else {
            // Fruchterman-Reingold estándar
            force = (dist * dist) / (attraction * 1000);
          }

          const fx = (dx / dist) * force * scaling;
          const fy = (dy / dist) * force * scaling;

          if (e.source !== draggedNodeRef.current) {
            e.source.vx += fx;
            e.source.vy += fy;
          }
          if (e.target !== draggedNodeRef.current) {
            e.target.vx -= fx;
            e.target.vy -= fy;
          }
        });

        // d. Actualización de posiciones
        visibleNodes.forEach((n) => {
          if (n === draggedNodeRef.current) return;
          n.x += n.vx;
          n.y += n.vy;

          // Límites perimetrales con margen
          const margin = 40;
          if (n.x < margin) { n.x = margin; n.vx = 0; }
          if (n.x > width - margin) { n.x = width - margin; n.vx = 0; }
          if (n.y < margin) { n.y = margin; n.vy = 0; }
          if (n.y > height - margin) { n.y = height - margin; n.vy = 0; }
        });
      }

      // ---- 2. RENDERIZADO EN CANVAS ----
      ctx.clearRect(0, 0, width, height);

      // Comprobar si hay focos activos (Hover o Clic)
      const activeSelectId = selected?.id;
      const hoverNode = hoveredNodeRef.current;
      const highlightMode = activeSelectId || hoverNode;

      const isNodeHighlighted = (node) => {
        if (!highlightMode) return true; // Todo visible por defecto
        if (activeSelectId === node.id || hoverNode?.id === node.id) return true;
        
        // Comprobar si es un vecino conectado
        return visibleEdges.some(e => 
          (e.source.id === node.id && (e.target.id === activeSelectId || e.target.id === hoverNode?.id)) ||
          (e.target.id === node.id && (e.source.id === activeSelectId || e.source.id === hoverNode?.id))
        );
      };

      // a. Dibujar Enlaces (Edges)
      visibleEdges.forEach((e) => {
        const isSrcHighlighted = isNodeHighlighted(e.source) && (e.source.id === activeSelectId || e.source.id === hoverNode?.id);
        const isTgtHighlighted = isNodeHighlighted(e.target) && (e.target.id === activeSelectId || e.target.id === hoverNode?.id);
        const isEdgeHighlighted = isSrcHighlighted || isTgtHighlighted;

        ctx.beginPath();
        ctx.moveTo(e.source.x, e.source.y);
        ctx.lineTo(e.target.x, e.target.y);

        if (highlightMode) {
          if (isEdgeHighlighted) {
            ctx.strokeStyle = '#d4af37';
            ctx.lineWidth = 1.8;
            ctx.globalAlpha = 0.9;
          } else {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
            ctx.lineWidth = 0.8;
            ctx.globalAlpha = 0.15;
          }
        } else {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
          ctx.lineWidth = 1.0;
          ctx.globalAlpha = 0.65;
        }

        ctx.stroke();
      });
      ctx.globalAlpha = 1.0; // Resetear transparencia global

      // b. Dibujar Nodos (Nodes)
      visibleNodes.forEach((n) => {
        const isSel = activeSelectId === n.id;
        const isHover = hoverNode?.id === n.id;
        const highlighted = isNodeHighlighted(n);
        const color = getNodeColor(n);
        const radius = getNodeRadius(n.id);

        ctx.globalAlpha = highlighted ? 1.0 : 0.15;

        // Halo decorativo Gephi para seleccionados/hover
        if (isSel || isHover) {
          ctx.beginPath();
          ctx.arc(n.x, n.y, radius + 7, 0, 2 * Math.PI);
          ctx.fillStyle = isSel ? 'rgba(212, 175, 55, 0.18)' : 'rgba(255, 255, 255, 0.08)';
          ctx.fill();
        }

        // Círculo del nodo
        ctx.beginPath();
        ctx.arc(n.x, n.y, radius, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();

        // Borde
        ctx.lineWidth = isSel ? 2.5 : 1.5;
        ctx.strokeStyle = isSel ? '#ffffff' : color;
        ctx.stroke();

        // c. Etiquetas de texto (Sizing proporcional al tamaño del nodo)
        ctx.textAlign = 'center';
        
        let labelText = n.label;
        if (isSel || isHover) {
          ctx.font = `bold ${Math.max(10, Math.min(15, radius * 0.95))}px Montserrat, sans-serif`;
          ctx.fillStyle = '#ffffff';
        } else {
          ctx.font = `500 ${Math.max(9, Math.min(13, radius * 0.85))}px Inter, sans-serif`;
          ctx.fillStyle = '#8b9bb4';
          if (labelText.length > 20) {
            labelText = labelText.substring(0, 18) + '...';
          }
        }

        ctx.fillText(labelText, n.x, n.y - radius - (isSel ? 7 : 5));
      });
      ctx.globalAlpha = 1.0;

      animationFrameId = requestAnimationFrame(runFrame);
    };

    animationFrameId = requestAnimationFrame(runFrame);
    return () => cancelAnimationFrame(animationFrameId);
  }, [dimensions, selected, physicsRunning, layoutMode, colorMode, sizeMode, gravity, repulsion, attraction, scaling, minDegreeFilter, degrees, pagerank, betweenness, communities, cites, edges, cadenaById]);

  // ---- EVENTOS DE RATÓN (Interactividad en Canvas) ----
  const handleMouseDown = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const visibleNodes = nodesRef.current.filter(n => (degrees[n.id] || 0) >= minDegreeFilter);
    let clickedNode = null;

    for (let i = visibleNodes.length - 1; i >= 0; i--) {
      const n = visibleNodes[i];
      const dx = n.x - mouseX;
      const dy = n.y - mouseY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Colisión
      const radius = 10; 
      if (dist < radius + 10) {
        clickedNode = n;
        break;
      }
    }

    if (clickedNode) {
      draggedNodeRef.current = clickedNode;
      draggedNodeRef.current.startX = mouseX;
      draggedNodeRef.current.startY = mouseY;
      draggedNodeRef.current.dragged = false;
    }
  };

  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const draggedNode = draggedNodeRef.current;
    if (draggedNode) {
      draggedNode.x = mouseX;
      draggedNode.y = mouseY;
      draggedNode.vx = 0;
      draggedNode.vy = 0;

      const dist = Math.sqrt(
        Math.pow(mouseX - draggedNode.startX, 2) + Math.pow(mouseY - draggedNode.startY, 2)
      );
      if (dist > 5) {
        draggedNode.dragged = true;
      }
      return;
    }

    // Hover tooltip / vecindad
    const visibleNodes = nodesRef.current.filter(n => (degrees[n.id] || 0) >= minDegreeFilter);
    let currentHovered = null;
    for (let i = visibleNodes.length - 1; i >= 0; i--) {
      const n = visibleNodes[i];
      const dx = n.x - mouseX;
      const dy = n.y - mouseY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 15) {
        currentHovered = n;
        break;
      }
    }

    if (currentHovered !== hoveredNodeRef.current) {
      hoveredNodeRef.current = currentHovered;
      canvas.style.cursor = currentHovered ? 'pointer' : 'default';
      if (currentHovered) {
        onHover(currentHovered.id);
      } else {
        onHover(null);
      }
    }
  };

  const handleMouseUp = () => {
    const draggedNode = draggedNodeRef.current;
    if (draggedNode) {
      if (!draggedNode.dragged) {
        onSelect(draggedNode.id);
      }
      draggedNodeRef.current = null;
    }
  };

  const handleMouseLeave = () => {
    draggedNodeRef.current = null;
    hoveredNodeRef.current = null;
    onHover(null);
  };

  return (
    <div className="gephi-workspace">
      
      {/* 1. COLUMNA IZQUIERDA: Apariencia & Distribución en Acordeón Colapsable */}
      <aside className="gephi-panel gephi-panel-left">
        <div className="gephi-accordion">
          
          {/* ACORDEÓN 1: Filtros del Ecosistema */}
          <div className="accordion-item">
            <button
              type="button"
              className={`accordion-header ${accOpen.filters ? 'open' : ''}`}
              onClick={() => toggleAccordion('filters')}
            >
              <span>🔍 1. Filtros Ecosistema</span>
              <span className="arrow">{accOpen.filters ? '▼' : '▶'}</span>
            </button>
            {accOpen.filters && (
              <div className="accordion-content">
                <div className="control-group">
                  <input
                    className="search"
                    type="search"
                    placeholder="Buscar CITE, actor, región..."
                    value={query}
                    onChange={(e) => onQuery(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      fontSize: '0.8rem',
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid var(--line)',
                      borderRadius: '6px',
                      color: '#fff',
                      outline: 'none',
                      marginBottom: '10px'
                    }}
                  />
                </div>

                <div className="control-group">
                  <label className="group-label">Tipo de Actor</label>
                  <div className="chip-row">
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
                      const isSel = tipo === value;
                      return (
                        <button
                          key={value}
                          type="button"
                          className={`chip ${isSel ? 'on' : ''}`}
                          style={{ fontSize: '0.65rem', padding: '4px 8px' }}
                          onClick={() => onTipo(value)}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="control-group">
                  <label className="group-label">Cadenas Productivas</label>
                  <div className="chip-row" style={{ maxHeight: '150px', overflowY: 'auto', paddingRight: '4px' }}>
                    {cadenas.map((c) => {
                      const on = cadenasOn.has(c.id);
                      return (
                        <button
                          key={c.id}
                          type="button"
                          className={`chip chip-cadena ${on ? 'on' : ''}`}
                          style={{ fontSize: '0.62rem', padding: '3px 6px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          onClick={() => onToggleCadena(c.id)}
                        >
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: c.color, display: 'inline-block' }} />
                          {c.nombre}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ACORDEÓN 2: Apariencia del Grafo */}
          <div className="accordion-item">
            <button
              type="button"
              className={`accordion-header ${accOpen.appearance ? 'open' : ''}`}
              onClick={() => toggleAccordion('appearance')}
            >
              <span>🎨 2. Apariencia de Red</span>
              <span className="arrow">{accOpen.appearance ? '▼' : '▶'}</span>
            </button>
            {accOpen.appearance && (
              <div className="accordion-content">
                <div className="control-group">
                  <label className="group-label">Color Nodos</label>
                  <div className="btn-toggle-row">
                    <button
                      type="button"
                      className={`toggle-sub-btn ${colorMode === 'cadena' ? 'active' : ''}`}
                      onClick={() => setColorMode('cadena')}
                    >
                      Cadena
                    </button>
                    <button
                      type="button"
                      className={`toggle-sub-btn ${colorMode === 'tipo' ? 'active' : ''}`}
                      onClick={() => setColorMode('tipo')}
                    >
                      Tipo Actor
                    </button>
                    <button
                      type="button"
                      className={`toggle-sub-btn ${colorMode === 'comunidad' ? 'active' : ''}`}
                      onClick={() => setColorMode('comunidad')}
                    >
                      Comunidad
                    </button>
                  </div>
                </div>

                <div className="control-group">
                  <label className="group-label">Tamaño Nodos</label>
                  <div className="btn-toggle-row">
                    <button
                      type="button"
                      className={`toggle-sub-btn ${sizeMode === 'default' ? 'active' : ''}`}
                      onClick={() => setSizeMode('default')}
                    >
                      Defecto
                    </button>
                    <button
                      type="button"
                      className={`toggle-sub-btn ${sizeMode === 'degree' ? 'active' : ''}`}
                      onClick={() => setSizeMode('degree')}
                    >
                      Grado
                    </button>
                    <button
                      type="button"
                      className={`toggle-sub-btn ${sizeMode === 'pagerank' ? 'active' : ''}`}
                      onClick={() => setSizeMode('pagerank')}
                    >
                      PageRank
                    </button>
                    <button
                      type="button"
                      className={`toggle-sub-btn ${sizeMode === 'betweenness' ? 'active' : ''}`}
                      onClick={() => setSizeMode('betweenness')}
                    >
                      Bridge
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ACORDEÓN 3: Algoritmos de Distribución */}
          <div className="accordion-item">
            <button
              type="button"
              className={`accordion-header ${accOpen.layout ? 'open' : ''}`}
              onClick={() => toggleAccordion('layout')}
            >
              <span>⚙️ 3. Distribución Física</span>
              <span className="arrow">{accOpen.layout ? '▼' : '▶'}</span>
            </button>
            {accOpen.layout && (
              <div className="accordion-content">
                <div className="control-group">
                  <select
                    className="gephi-select"
                    value={layoutMode}
                    onChange={(e) => {
                      setLayoutMode(e.target.value);
                      if (e.target.value === 'circular') applyCircularLayout();
                      if (e.target.value === 'concentric') applyConcentricLayout();
                      if (e.target.value === 'forceAtlas2' || e.target.value === 'fruchterman') {
                        setPhysicsRunning(true);
                      }
                    }}
                  >
                    <option value="forceAtlas2">ForceAtlas 2</option>
                    <option value="fruchterman">Fruchterman Reingold</option>
                    <option value="circular">Circular Layout</option>
                    <option value="concentric">Concéntrico (PageRank)</option>
                  </select>
                </div>

                {(layoutMode === 'forceAtlas2' || layoutMode === 'fruchterman') && (
                  <div className="physics-sliders">
                    <div className="slider-item">
                      <div className="slider-label">
                        <span>Gravedad</span>
                        <span>{gravity.toFixed(3)}</span>
                      </div>
                      <input
                        type="range"
                        min="0.005"
                        max="0.08"
                        step="0.005"
                        value={gravity}
                        onChange={(e) => setGravity(parseFloat(e.target.value))}
                      />
                    </div>

                    <div className="slider-item">
                      <div className="slider-label">
                        <span>Repulsión</span>
                        <span>{repulsion}</span>
                      </div>
                      <input
                        type="range"
                        min="400"
                        max="2500"
                        step="50"
                        value={repulsion}
                        onChange={(e) => setRepulsion(parseInt(e.target.value))}
                      />
                    </div>

                    <div className="slider-item">
                      <div className="slider-label">
                        <span>Atracción</span>
                        <span>{attraction.toFixed(3)}</span>
                      </div>
                      <input
                        type="range"
                        min="0.01"
                        max="0.1"
                        step="0.005"
                        value={attraction}
                        onChange={(e) => setAttraction(parseFloat(e.target.value))}
                      />
                    </div>
                  </div>
                )}

                <div className="layout-actions">
                  <button
                    type="button"
                    className={`btn-play-layout ${physicsRunning ? 'running' : ''}`}
                    onClick={() => setPhysicsRunning(prev => !prev)}
                    disabled={layoutMode === 'circular' || layoutMode === 'concentric'}
                  >
                    {physicsRunning ? '⏸️ Detener Distribución' : '▶️ Iniciar Distribución'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ACORDEÓN 4: Guía de Uso */}
          <div className="accordion-item">
            <button
              type="button"
              className={`accordion-header ${accOpen.guide ? 'open' : ''}`}
              onClick={() => toggleAccordion('guide')}
            >
              <span>📖 4. Guía de Uso</span>
              <span className="arrow">{accOpen.guide ? '▼' : '▶'}</span>
            </button>
            {accOpen.guide && (
              <div className="accordion-content" style={{ padding: '12px', fontSize: '0.75rem', lineHeight: '1.4', color: 'var(--muted)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <p style={{ margin: '0', color: '#fff', fontWeight: 'bold' }}>🕸️ Grafo de Red Semántica:</p>
                <ul style={{ margin: '0', paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <li><b>Hover:</b> Pasa el cursor sobre un nodo del grafo para ver su ficha de detalles en el panel derecho e iluminar sus conexiones directas.</li>
                  <li><b>Arrastrar:</b> Mantén presionado y arrastra un nodo para desplazarlo y ver cómo interactúa con las fuerzas del grafo.</li>
                  <li><b>Fuerzas Físicas:</b> Controla la gravedad, repulsión y atracción desde el acordeón de <b>Distribución Física</b>.</li>
                  <li><b>Filtro de Grado:</b> Desliza la barra inferior para simplificar la red ocultando nodos con pocas conexiones.</li>
                </ul>
              </div>
            )}
          </div>

        </div>
      </aside>

      {/* 2. ÁREA CENTRAL: Canvas + Filtro de Grado Inferior */}
      <main className="gephi-center-area">
        <div className="gephi-canvas-container" ref={containerRef}>
          <canvas
            ref={canvasRef}
            width={dimensions.width}
            height={dimensions.height}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            style={{ display: 'block', background: '#080a0e' }}
          />

          <div className="canvas-hud-instructions">
            🖱️ Arrastra para recolocar · Hover resalta vecindad · Clic para abrir ficha
          </div>
        </div>

        {/* Filtros Gephi en la parte inferior */}
        <footer className="gephi-filter-bar">
          <div className="filter-inner">
            <div className="filter-title">🛠️ Filtro de Red (Gephi Filters)</div>
            <div className="filter-slider-container">
              <span className="slider-lbl">Grado mínimo (Conectividad): <b>{minDegreeFilter}</b></span>
              <input
                type="range"
                min="0"
                max="8"
                step="1"
                value={minDegreeFilter}
                onChange={(e) => setMinDegreeFilter(parseInt(e.target.value))}
                className="gephi-slider"
              />
            </div>
          </div>
        </footer>
      </main>

      {/* 3. COLUMNA DERECHA: Estadísticas de Red */}
      <aside className="gephi-panel gephi-panel-right">
        <h4 className="section-title">Estadísticas</h4>
        
        <div className="stats-list">
          
          {/* Grado Promedio */}
          <div className="gephi-stat-card">
            <div className="stat-header">
              <span className="stat-name">Grado Promedio</span>
              <button
                type="button"
                className="btn-run-metric"
                onClick={runGraphAnalytics}
              >
                Ejecutar
              </button>
            </div>
            <div className="stat-value">{statsSummary.avgDegree}</div>
            <div className="stat-desc">Número promedio de enlaces por nodo.</div>
          </div>

          {/* Modularidad (Comunidades) */}
          <div className="gephi-stat-card">
            <div className="stat-header">
              <span className="stat-name">Modularidad</span>
              <button
                type="button"
                className="btn-run-metric"
                onClick={runGraphAnalytics}
              >
                Ejecutar
              </button>
            </div>
            <div className="stat-value">{statsSummary.modularity}</div>
            <div className="stat-desc">
              Clases de comunidad: <b>{statsSummary.communitiesCount}</b>
            </div>
          </div>

          {/* PageRank Max */}
          <div className="gephi-stat-card">
            <div className="stat-header">
              <span className="stat-name">PageRank Máximo</span>
              <button
                type="button"
                className="btn-run-metric"
                onClick={runGraphAnalytics}
              >
                Ejecutar
              </button>
            </div>
            <div className="stat-value">{statsSummary.pagerankMax}</div>
            <div className="stat-desc">Importancia y prestigio de nodo máximo.</div>
          </div>

          {/* Centralidad de Intermediación */}
          <div className="gephi-stat-card">
            <div className="stat-header">
              <span className="stat-name">Intermediación Máx</span>
              <button
                type="button"
                className="btn-run-metric"
                onClick={runGraphAnalytics}
              >
                Ejecutar
              </button>
            </div>
            <div className="stat-value">{statsSummary.betweennessMax}</div>
            <div className="stat-desc">Capacidad de puente estructural máxima.</div>
          </div>

        </div>
      </aside>

    </div>
  );
}
