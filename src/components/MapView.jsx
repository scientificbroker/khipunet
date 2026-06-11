import { useMemo, useState, useEffect, useCallback, useRef, Fragment } from 'react';
import { GoogleMap, useJsApiLoader, MarkerF, Polyline, CircleF, InfoWindowF } from '@react-google-maps/api';
import { MapContainer, TileLayer, Marker, Polyline as LeafletPolyline, Circle, Popup, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const PERU_CENTER = { lat: -9.19, lng: -75.01 };
const GOOGLE_MAPS_LIBRARIES = ['visualization'];

const mapOptionsDark = {
  disableDefaultUI: true,
  zoomControl: false,
  mapTypeControl: false,
  scaleControl: false,
  streetViewControl: false,
  rotateControl: false,
  fullscreenControl: false,
  styles: [
    { elementType: 'geometry', stylers: [{ color: '#090d12' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#090d12' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#8b9bb4' }] },
    {
      featureType: 'administrative.locality',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#cbd5e1' }]
    },
    {
      featureType: 'poi',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#8b9bb4' }]
    },
    {
      featureType: 'poi.park',
      elementType: 'geometry',
      stylers: [{ color: '#0d1620' }]
    },
    {
      featureType: 'poi.park',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#64748b' }]
    },
    {
      featureType: 'road',
      elementType: 'geometry',
      stylers: [{ color: '#131922' }]
    },
    {
      featureType: 'road',
      elementType: 'geometry.stroke',
      stylers: [{ color: '#1e2631' }]
    },
    {
      featureType: 'road',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#64748b' }]
    },
    {
      featureType: 'road.highway',
      elementType: 'geometry',
      stylers: [{ color: '#1c2533' }]
    },
    {
      featureType: 'road.highway',
      elementType: 'geometry.stroke',
      stylers: [{ color: '#2b394a' }]
    },
    {
      featureType: 'road.highway',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#8b9bb4' }]
    },
    {
      featureType: 'water',
      elementType: 'geometry',
      stylers: [{ color: '#040608' }]
    },
    {
      featureType: 'water',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#00bfff' }]
    },
    {
      featureType: 'water',
      elementType: 'labels.text.stroke',
      stylers: [{ color: '#040608' }]
    }
  ]
};

// Fórmula de Haversine para cálculo de distancia geodésica
const getHaversineDistance = (p1, p2) => {
  if (!p1 || !p2) return 0;
  const lat1 = Number(p1.lat);
  const lng1 = Number(p1.lng);
  const lat2 = Number(p2.lat);
  const lng2 = Number(p2.lng);
  if (isNaN(lat1) || isNaN(lng1) || isNaN(lat2) || isNaN(lng2)) return 0;
  const R = 6371; // Radio de la Tierra en km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const formatDistance = (dist) => {
  if (dist < 1) {
    return `${(dist * 1000).toFixed(0)} m`;
  }
  return `${dist.toFixed(2)} km`;
};

// SVG Paths correspondientes a la categoría del actor
const getCategoryIconPath = (tipo) => {
  switch (tipo) {
    case 'publico':
    case 'privado':
      // CITE Público y CITE Privado: Engranaje industrial (cog/gear) bien definido
      return 'M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.488.488 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.48.48 0 0 0-.48-.41h-3.84a.48.48 0 0 0-.48.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.488.488 0 0 0-.59.22L2.74 8.87a.49.49 0 0 0 .12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.48-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z';
    case 'universidad':
      // Universidad / OTT: Birrete académico
      return 'M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.91V17h2V9L12 3z';
    case 'empresa':
      // Empresa Innovadora: Foco (lightbulb)
      return 'M12 2C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7zm-3 18c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1z';
    case 'startup':
      // Startup Tecnológica: Cohete (rocket) con silueta bien definida
      return 'M12 2s-5 4-5 10c0 2 1 3.5 2 4.5V21l3-1 3 1v-4.5c1-1 2-2.5 2-4.5 0-6-5-10-5-10zm0 7.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z';
    case 'incubadora':
      // Incubadora / Aceleradora: Planta / Brote de crecimiento
      return 'M12 10a6 6 0 0 0-6-6H4v2a6 6 0 0 0 6 6h2v10h2v-8h2a6 6 0 0 0 6-6V4h-2a6 6 0 0 0-6 6z';
    case 'cati':
      // Red CATI: Candado abierto (unlocked lock)
      return 'M17 8V7a5 5 0 0 0-9.9-1h2.1A3 3 0 0 1 15 7v1h2zm1 2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2zm-6 7a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z';
    case 'coworking':
      // Espacio de Coworking: Colaboración / Dos personas
      return 'M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 3-1.34 3-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 2 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z';
    case 'gobierno':
      // Soporte / Estado (Gobierno): Templo / Edificio institucional clásico
      return 'M12 2L2 7v2h20V7L12 2zm-6 9v8h3v-8H6zm5 0v8h3v-8h-3zm5 0v8h3v-8h-3zM2 21h20v2H2v-2z';
    default:
      // Nodo genérico: Círculo de soporte
      return 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z';
  }
};

// Generador de Iconos SVG para la Leyenda
const renderLegendIcon = (tipo) => {
  const path = getCategoryIconPath(tipo);
  return (
    <svg viewBox="0 0 24 24" style={{ width: '16px', height: '16px', marginRight: '8px', display: 'inline-block', verticalAlign: 'middle' }}>
      <circle cx="12" cy="12" r="10.5" fill="#ffffff" stroke="#94a3b8" strokeWidth="1.8"/>
      <g transform="scale(0.72) translate(4.7, 4.7)">
        <path d={path} fill="#000000" />
      </g>
    </svg>
  );
};

// Generador de Iconos SVG para Leaflet (L.divIcon)
const createLeafletCustomIcon = (cite, isSelected, getActorColor) => {
  const color = getActorColor(cite);
  const size = isSelected ? 44 : 34;
  const path = getCategoryIconPath(cite.tipo);

  const html = `
    <div class="custom-leaflet-marker ${isSelected ? 'selected' : ''}" style="color: ${color}; width: ${size}px; height: ${size}px;">
      <svg viewBox="0 0 24 24" class="marker-svg">
        <circle cx="12" cy="12" r="10.5" fill="#ffffff" stroke="${isSelected ? '#d4af37' : 'currentColor'}" stroke-width="${isSelected ? 3.5 : 2.5}"/>
        <g transform="scale(0.72) translate(4.7, 4.7)">
          <path d="${path}" fill="#000000" />
        </g>
      </svg>
      <div class="marker-glow" style="background: ${color}"></div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'leaflet-custom-marker-wrapper',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2]
  });
};

// Componente helper para animar el cambio de vista en Leaflet
function ChangeMapView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView([center.lat, center.lng], zoom, { animate: true, duration: 0.75 });
    }
  }, [center, zoom, map]);
  return null;
}

// Handler de eventos del mapa para coordenadas y medidor de distancia en Leaflet
function LeafletMapEvents({ onMapClick, onMouseMove, active }) {
  useMapEvents({
    click: (e) => {
      onMapClick(e);
    },
    mousemove: (e) => {
      if (active) {
        onMouseMove(e);
      }
    }
  });
  return null;
}

export default function MapView({
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
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    libraries: GOOGLE_MAPS_LIBRARIES
  });

  const [mapEngine, setMapEngine] = useState('google'); // google | leaflet
  const [basemap, setBasemap] = useState('dark'); // dark | satellite | terrain | roadmap
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  
  // Acordeones colapsables en la barra lateral izquierda del mapa
  const [accOpen, setAccOpen] = useState({
    filters: true,
    layers: true,
    guide: false,
    legend: false
  });

  const toggleAccordion = (key) => {
    setAccOpen((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Capas del visor
  const [layers, setLayers] = useState({
    nodes: false,
    connections: false,
    influence: false,
    heatmap: false
  });

  // Herramienta de medición
  const [measureActive, setMeasureActive] = useState(false);
  const [measurePoints, setMeasurePoints] = useState([]);
  const [tempPoint, setTempPoint] = useState(null);
  
  // Coordenadas del cursor
  const [mouseCoords, setMouseCoords] = useState(null);

  const [googleMapRef, setGoogleMapRef] = useState(null);
  const isClickingMarkerRef = useRef(false);

  const getActorColor = useCallback((c) => {
    return c ? (cadenaById[c.cadena]?.color || '#d4af37') : '#d4af37';
  }, [cadenaById]);

  // Sincronizar coordenadas en Google Maps
  const handleGoogleMouseMove = (e) => {
    if (e.latLng) {
      setMouseCoords({
        lat: e.latLng.lat().toFixed(4),
        lng: e.latLng.lng().toFixed(4)
      });
      if (measureActive && measurePoints.length === 1) {
        setTempPoint({ lat: e.latLng.lat(), lng: e.latLng.lng() });
      }
    }
  };

  const handleGoogleClick = (e) => {
    if (isClickingMarkerRef.current) return;
    if (measureActive && e.latLng) {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      setMeasurePoints((prev) => {
        if (prev.length >= 2) return [{ lat, lng }];
        return [...prev, { lat, lng }];
      });
    } else {
      onSelect(null);
    }
  };

  // Click en Leaflet
  const handleLeafletClick = (e) => {
    if (isClickingMarkerRef.current) return;
    if (measureActive) {
      const lat = e.latlng.lat;
      const lng = e.latlng.lng;
      setMeasurePoints((prev) => {
        if (prev.length >= 2) return [{ lat, lng }];
        return [...prev, { lat, lng }];
      });
    } else {
      onSelect(null);
    }
  };

  const handleLeafletMouseMove = (e) => {
    setMouseCoords({
      lat: e.latlng.lat.toFixed(4),
      lng: e.latlng.lng.toFixed(4)
    });
    if (measureActive && measurePoints.length === 1) {
      setTempPoint({ lat: e.latlng.lat, lng: e.latlng.lng });
    }
  };

  // Alternar capas
  const toggleLayer = (layerKey) => {
    setLayers((prev) => ({ ...prev, [layerKey]: !prev[layerKey] }));
  };

  // Resetear regla
  const toggleMeasure = () => {
    setMeasureActive((prev) => {
      const next = !prev;
      if (!next) {
        setMeasurePoints([]);
        setTempPoint(null);
      }
      return next;
    });
  };

  // Centrar mapa
  const handleCenterMap = () => {
    if (mapEngine === 'google' && googleMapRef) {
      googleMapRef.panTo(PERU_CENTER);
      googleMapRef.setZoom(6);
    }
  };

  // Calcular las conexiones geográficas del grafo (por similitud de cadena e impacto)
  const todasConexiones = useMemo(() => {
    const lines = [];
    for (let i = 0; i < cites.length; i++) {
      const c1 = cites[i];
      if (c1.lat == null || c1.lng == null) continue;

      for (let j = i + 1; j < cites.length; j++) {
        const c2 = cites[j];
        if (c2.lat == null || c2.lng == null) continue;

        // Comparten la misma cadena de valor (impacto)
        if (c1.cadena === c2.cadena) {
          const s1 = c1.servicios || [];
          const s2 = c2.servicios || [];
          const shared = s1.filter(s => s2.includes(s)).length;

          const isSelectedEdge = selected && (selected.id === c1.id || selected.id === c2.id);
          // Grosor proporcional a la cantidad de servicios compartidos (conexiones fuertes)
          const weight = shared > 0 ? 1 + shared * 0.55 : 1;
          // Opacidad proporcional a la cantidad de servicios compartidos
          const opacity = isSelectedEdge ? 0.95 : (shared > 0 ? Math.min(0.18 + shared * 0.08, 0.75) : 0.08);

          lines.push({
            id: `edge-${c1.id}-${c2.id}`,
            path: [
              { lat: Number(c1.lat), lng: Number(c1.lng) },
              { lat: Number(c2.lat), lng: Number(c2.lng) }
            ],
            color: getActorColor(c1),
            weight: weight,
            opacity: opacity,
            active: isSelectedEdge,
            sharedCount: shared
          });
        }
      }
    }
    return lines;
  }, [cites, selected, getActorColor]);

  // Calcular conexiones de cohesión regional (proximidad en un radio de 100 km)
  // Solo se activa para el nodo seleccionado (al darle click) para evitar sobrelapamientos
  const proximidadConexiones = useMemo(() => {
    const lines = [];
    if (!selected || selected.lat == null || selected.lng == null) return lines;

    for (let i = 0; i < cites.length; i++) {
      const c2 = cites[i];
      if (c2.id === selected.id || c2.lat == null || c2.lng == null) continue;

      const dist = getHaversineDistance(selected, c2);
      if (dist > 0 && dist <= 100) { // Radio de 100 km
        lines.push({
          id: `prox-${selected.id}-${c2.id}`,
          path: [
            { lat: Number(selected.lat), lng: Number(selected.lng) },
            { lat: Number(c2.lat), lng: Number(c2.lng) }
          ],
          distance: dist,
          active: true
        });
      }
    }
    return lines;
  }, [cites, selected]);

  // Obtener el nodo activo para el mapa de calor (glowing halo en hover/click)
  const activeHeatmapNode = useMemo(() => {
    if (!layers.heatmap) return null;
    const activeId = hoveredId || (selected ? selected.id : null);
    if (!activeId) return null;
    return cites.find(c => c.id === activeId) || null;
  }, [cites, layers.heatmap, hoveredId, selected]);

  // Referencias para almacenar los objetos de capa imperativos de Google Maps
  const googleOverlaysRef = useRef({
    connections: [],
    influence: [],
    selectedCircle: null,
    heatmapCircles: []
  });

  // Manejador del ciclo de vida imperativo para capas en Google Maps
  useEffect(() => {
    const overlays = googleOverlaysRef.current;

    // 1. Limpieza de elementos previos
    if (overlays.connections.length > 0) {
      overlays.connections.forEach(o => o.setMap(null));
      overlays.connections = [];
    }
    if (overlays.influence.length > 0) {
      overlays.influence.forEach(o => o.setMap(null));
      overlays.influence = [];
    }
    if (overlays.selectedCircle) {
      overlays.selectedCircle.setMap(null);
      overlays.selectedCircle = null;
    }
    if (overlays.heatmapCircles.length > 0) {
      overlays.heatmapCircles.forEach(o => o.setMap(null));
      overlays.heatmapCircles = [];
    }

    // Si el mapa o las APIs no están listas, salir
    if (!isLoaded || !googleMapRef || !window.google || !window.google.maps) {
      return;
    }

    // 2. Trazar Red de Enlaces (Khipu)
    if (layers.connections && todasConexiones.length > 0) {
      todasConexiones.forEach((line) => {
        const poly = new window.google.maps.Polyline({
          path: line.path,
          strokeColor: line.active ? '#d4af37' : line.color,
          strokeOpacity: line.active ? 0.95 : line.opacity,
          strokeWeight: line.active ? 3.5 : line.weight,
          geodesic: true,
          zIndex: line.active ? 15 : 2,
          icons: line.active ? [
            {
              icon: { path: 'M 0,-1 0,1', strokeOpacity: 1, scale: 2 },
              offset: '0',
              repeat: '12px'
            }
          ] : undefined,
          map: googleMapRef
        });
        overlays.connections.push(poly);
      });
    }

    // 3. Trazar Cohesión Regional (100km) - Blanco Neón (Glow + Core dashed)
    if (layers.influence && proximidadConexiones.length > 0) {
      proximidadConexiones.forEach((line) => {
        // Glow Polyline (wider, semi-transparent, solid)
        const glowPoly = new window.google.maps.Polyline({
          path: line.path,
          strokeColor: '#ffffff',
          strokeOpacity: 0.25,
          strokeWeight: 6.0,
          geodesic: true,
          zIndex: 11,
          map: googleMapRef
        });
        overlays.influence.push(glowPoly);

        // Core Polyline (dashed, bright white)
        const corePoly = new window.google.maps.Polyline({
          path: line.path,
          strokeColor: '#ffffff',
          strokeOpacity: 0,
          geodesic: true,
          zIndex: 12,
          icons: [
            {
              icon: {
                path: 'M 0,-1 0,1',
                strokeOpacity: 1.0,
                scale: 2.5,
                strokeColor: '#ffffff',
                strokeWeight: 2.5
              },
              offset: '0',
              repeat: '12px'
            }
          ],
          map: googleMapRef
        });
        overlays.influence.push(corePoly);
      });
    }

    // 4. Área de Cobertura del Actor Seleccionado (100km) - Blanco Neón (Glow + Core)
    if (layers.influence && selected && selected.lat != null && selected.lng != null) {
      const glowCircle = new window.google.maps.Circle({
        center: { lat: Number(selected.lat), lng: Number(selected.lng) },
        radius: 100000, // 100 km
        strokeColor: '#ffffff',
        strokeOpacity: 0.15,
        strokeWeight: 3.0,
        fillColor: '#ffffff',
        fillOpacity: 0.02,
        clickable: false,
        zIndex: 1,
        map: googleMapRef
      });
      const coreCircle = new window.google.maps.Circle({
        center: { lat: Number(selected.lat), lng: Number(selected.lng) },
        radius: 100000,
        strokeColor: '#ffffff',
        strokeOpacity: 0.7,
        strokeWeight: 1.2,
        fillColor: '#ffffff',
        fillOpacity: 0,
        clickable: false,
        zIndex: 2,
        map: googleMapRef
      });
      overlays.selectedCircle = glowCircle;
      overlays.influence.push(coreCircle);
    }

    // 5. Mapa de Calor (Servicios) - Solo en el actor activo (hover/click)
    if (layers.heatmap && activeHeatmapNode && activeHeatmapNode.lat != null && activeHeatmapNode.lng != null) {
      const weight = Array.isArray(activeHeatmapNode.servicios) ? activeHeatmapNode.servicios.length : 0;

      const outerCircle = new window.google.maps.Circle({
        center: { lat: Number(activeHeatmapNode.lat), lng: Number(activeHeatmapNode.lng) },
        radius: 20000 + weight * 10000,
        strokeColor: '#ff4757',
        strokeOpacity: 0,
        fillColor: '#ff4757',
        fillOpacity: Math.min(0.05 + weight * 0.035, 0.45),
        clickable: false,
        zIndex: 1,
        map: googleMapRef
      });

      const innerCircle = new window.google.maps.Circle({
        center: { lat: Number(activeHeatmapNode.lat), lng: Number(activeHeatmapNode.lng) },
        radius: 8000 + weight * 4000,
        strokeColor: '#ffa502',
        strokeOpacity: 0,
        fillColor: '#ffa502',
        fillOpacity: Math.min(0.10 + weight * 0.05, 0.65),
        clickable: false,
        zIndex: 2,
        map: googleMapRef
      });

      overlays.heatmapCircles.push(outerCircle, innerCircle);
    }

    // Retornar función de limpieza al desmontar
    return () => {
      if (overlays.connections.length > 0) {
        overlays.connections.forEach(o => o.setMap(null));
      }
      if (overlays.influence.length > 0) {
        overlays.influence.forEach(o => o.setMap(null));
      }
      if (overlays.selectedCircle) {
        overlays.selectedCircle.setMap(null);
      }
      if (overlays.heatmapCircles.length > 0) {
        overlays.heatmapCircles.forEach(o => o.setMap(null));
      }
    };
  }, [googleMapRef, layers, todasConexiones, proximidadConexiones, selected, activeHeatmapNode, isLoaded]);

  // Generador de Icono Google Maps
  const getGoogleMarkerIcon = useCallback((c, isSel) => {
    const color = getActorColor(c);
    const size = isSel ? 44 : 34;
    const path = getCategoryIconPath(c.tipo);

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${size}" height="${size}">
        <circle cx="12" cy="12" r="10.5" fill="#ffffff" stroke="${isSel ? '#d4af37' : color}" stroke-width="${isSel ? 3.5 : 2.5}"/>
        <g transform="scale(0.72) translate(4.7, 4.7)">
          <path d="${path}" fill="#000000"/>
        </g>
      </svg>
    `;

    return {
      url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg),
      scaledSize: new window.google.maps.Size(size, size),
      anchor: new window.google.maps.Point(size / 2, size / 2)
    };
  }, [getActorColor]);

  // Estilos del mapa base de Google
  const googleMapOptions = useMemo(() => {
    if (basemap === 'dark') return mapOptionsDark;
    return {
      disableDefaultUI: true,
      zoomControl: false,
      mapTypeControl: false,
      scaleControl: false,
      streetViewControl: false,
      rotateControl: false,
      fullscreenControl: false,
      styles: [] // Estilo estándar por defecto
    };
  }, [basemap]);


  // URLs de los tiles de Leaflet
  const leafletTileUrl = useMemo(() => {
    switch (basemap) {
      case 'satellite':
        return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      case 'terrain':
      case 'topo':
        return 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png';
      case 'roadmap':
        return 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      case 'dark':
      default:
        return 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
    }
  }, [basemap]);

  const leafletTileAttribution = useMemo(() => {
    switch (basemap) {
      case 'satellite':
        return 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community';
      case 'topo':
        return 'Map data: &copy; OpenStreetMap contributors, SRTM | Map style: &copy; OpenTopoMap';
      case 'roadmap':
        return '&copy; OpenStreetMap contributors';
      case 'dark':
      default:
        return '&copy; OpenStreetMap &copy; CARTO';
    }
  }, [basemap]);

  // Centro actual o el del nodo seleccionado
  const activeCenter = selected && selected.lat != null ? { lat: selected.lat, lng: selected.lng } : PERU_CENTER;
  const activeZoom = selected ? 8 : 6;



  return (
    <div className={`gis-container ${selected ? 'side-panel-open' : ''}`}>
      
      {/* 1. Barra de Control de Motores (Top GIS Header) */}
      <div className="gis-top-bar">
        <div className="engine-toggle-group">
          <button
            type="button"
            className={`engine-btn ${mapEngine === 'google' ? 'active' : ''}`}
            onClick={() => setMapEngine('google')}
          >
            🗺️ Google Maps
          </button>
          <button
            type="button"
            className={`engine-btn ${mapEngine === 'leaflet' ? 'active' : ''}`}
            onClick={() => setMapEngine('leaflet')}
          >
            🌎 Leaflet Engine
          </button>
        </div>

        {/* Basemap Switcher */}
        <div className="basemap-group">
          {[
            ['dark', '🌌 Oscuro'],
            ['roadmap', '🏙️ Calles'],
            ['satellite', '📡 Satélite'],
            ['terrain', '🏔️ Relieve']
          ].map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={`basemap-btn ${basemap === id ? 'active' : ''}`}
              onClick={() => setBasemap(id)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Capas Cartográficas & Filtros (Control Panel Lateral Izquierdo en Acordeón) */}
      <div className={`gis-layers-panel ${mobileFiltersOpen ? 'mobile-open' : ''}`}>
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
              <div className="accordion-content" style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '12px' }}>
                <div className="control-group" style={{ marginBottom: '0' }}>
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
                      marginBottom: '8px'
                    }}
                  />
                </div>

                <div className="control-group" style={{ marginBottom: '0' }}>
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

                <div className="control-group" style={{ marginBottom: '0' }}>
                  <label className="group-label">Cadenas Productivas</label>
                  <div className="chip-row" style={{ maxHeight: '140px', overflowY: 'auto', paddingRight: '4px' }}>
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

          {/* ACORDEÓN 2: Capas Cartográficas */}
          <div className="accordion-item">
            <button
              type="button"
              className={`accordion-header ${accOpen.layers ? 'open' : ''}`}
              onClick={() => toggleAccordion('layers')}
            >
              <span>🗺️ 2. Capas Espaciales</span>
              <span className="arrow">{accOpen.layers ? '▼' : '▶'}</span>
            </button>
            {accOpen.layers && (
              <div className="accordion-content" style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div className="layer-item">
                  <input
                    type="checkbox"
                    id="layer-nodes"
                    checked={layers.nodes}
                    onChange={() => toggleLayer('nodes')}
                  />
                  <label htmlFor="layer-nodes">🔴 Nodos Ecosistema</label>
                </div>
                <div className="layer-item">
                  <input
                    type="checkbox"
                    id="layer-connections"
                    checked={layers.connections}
                    onChange={() => toggleLayer('connections')}
                  />
                  <label htmlFor="layer-connections">🕸️ Red de Enlaces (Khipu)</label>
                </div>
                <div className="layer-item">
                  <input
                    type="checkbox"
                    id="layer-influence"
                    checked={layers.influence}
                    onChange={() => toggleLayer('influence')}
                  />
                  <label htmlFor="layer-influence">🔵 Cohesión Regional (100km)</label>
                </div>
                <div className="layer-item">
                  <input
                    type="checkbox"
                    id="layer-heatmap"
                    checked={layers.heatmap}
                    onChange={() => toggleLayer('heatmap')}
                  />
                  <label htmlFor="layer-heatmap">🔥 Mapa de Calor (Servicios)</label>
                </div>
              </div>
            )}
          </div>

          {/* ACORDEÓN 3: Guía de Uso */}
          <div className="accordion-item">
            <button
              type="button"
              className={`accordion-header ${accOpen.guide ? 'open' : ''}`}
              onClick={() => toggleAccordion('guide')}
            >
              <span>📖 3. Guía de Uso</span>
              <span className="arrow">{accOpen.guide ? '▼' : '▶'}</span>
            </button>
            {accOpen.guide && (
              <div className="accordion-content" style={{ padding: '12px', fontSize: '0.75rem', lineHeight: '1.4', color: 'var(--muted)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <p style={{ margin: '0', color: '#fff', fontWeight: 'bold' }}>📍 Visor Cartográfico:</p>
                <ul style={{ margin: '0', paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <li><b>Hover:</b> Pasa el cursor sobre un nodo para ver su ficha de detalles en el panel derecho sin lag ni popups molestos.</li>
                  <li><b>Click:</b> Fija la ficha de información. Haz clic en la <b>✕</b> de la ficha o en el mapa vacío para desfijarla.</li>
                  <li><b>Regla:</b> Actívala en la barra superior y haz clic en dos puntos del mapa para medir distancias en km.</li>
                  <li><b>Motores:</b> Alterna entre Google Maps y Leaflet desde el selector superior.</li>
                </ul>
              </div>
            )}
          </div>

          {/* ACORDEÓN 4: Leyenda Cartográfica */}
          <div className="accordion-item">
            <button
              type="button"
              className={`accordion-header ${accOpen.legend ? 'open' : ''}`}
              onClick={() => toggleAccordion('legend')}
            >
              <span>📊 4. Leyenda</span>
              <span className="arrow">{accOpen.legend ? '▼' : '▶'}</span>
            </button>
            {accOpen.legend && (
              <div className="accordion-content" style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div className="legend-section-title" style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--muted)', fontWeight: 'bold' }}>Tipos de Actor</div>
                <div className="legend-item" style={{ display: 'flex', alignItems: 'center', fontSize: '0.72rem', gap: '8px', color: '#cbd5e1' }}>{renderLegendIcon('publico')} CITE Público</div>
                <div className="legend-item" style={{ display: 'flex', alignItems: 'center', fontSize: '0.72rem', gap: '8px', color: '#cbd5e1' }}>{renderLegendIcon('privado')} CITE Privado</div>
                <div className="legend-item" style={{ display: 'flex', alignItems: 'center', fontSize: '0.72rem', gap: '8px', color: '#cbd5e1' }}>{renderLegendIcon('universidad')} Universidad / OTT</div>
                <div className="legend-item" style={{ display: 'flex', alignItems: 'center', fontSize: '0.72rem', gap: '8px', color: '#cbd5e1' }}>{renderLegendIcon('empresa')} Empresa Innovadora</div>
                <div className="legend-item" style={{ display: 'flex', alignItems: 'center', fontSize: '0.72rem', gap: '8px', color: '#cbd5e1' }}>{renderLegendIcon('startup')} Startup Tecnológica</div>
                <div className="legend-item" style={{ display: 'flex', alignItems: 'center', fontSize: '0.72rem', gap: '8px', color: '#cbd5e1' }}>{renderLegendIcon('incubadora')} Incubadora / Aceleradora</div>
                <div className="legend-item" style={{ display: 'flex', alignItems: 'center', fontSize: '0.72rem', gap: '8px', color: '#cbd5e1' }}>{renderLegendIcon('cati')} Red CATI</div>
                <div className="legend-item" style={{ display: 'flex', alignItems: 'center', fontSize: '0.72rem', gap: '8px', color: '#cbd5e1' }}>{renderLegendIcon('coworking')} Espacio de Coworking</div>
                <div className="legend-item" style={{ display: 'flex', alignItems: 'center', fontSize: '0.72rem', gap: '8px', color: '#cbd5e1' }}>{renderLegendIcon('gobierno')} Soporte / Estado</div>
                
                <div className="legend-section-title" style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--muted)', fontWeight: 'bold', marginTop: '6px' }}>Enlaces</div>
                <div className="legend-item" style={{ display: 'flex', alignItems: 'center', fontSize: '0.72rem', gap: '8px', color: '#cbd5e1' }}>
                  <span className="legend-line active" style={{ width: '18px', height: '2px', background: 'var(--oro)', display: 'inline-block' }} /> Conexión Activa
                </div>
                <div className="legend-item" style={{ display: 'flex', alignItems: 'center', fontSize: '0.72rem', gap: '8px', color: '#cbd5e1' }}>
                  <span className="legend-line" style={{ width: '18px', height: '2px', borderTop: '2px dashed rgba(255,255,255,0.4)', display: 'inline-block' }} /> Enlace Khipu
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* 3. Barra de Herramientas GIS */}
      <div className="gis-tools-bar">
        <button
          type="button"
          className={`tool-btn mobile-only-btn ${mobileFiltersOpen ? 'active' : ''}`}
          title="Filtros y Capas"
          onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
        >
          🔍 {mobileFiltersOpen ? 'Cerrar' : 'Filtros'}
        </button>
        <button
          type="button"
          className="tool-btn"
          title="Centrar en el Perú"
          onClick={handleCenterMap}
        >
          📍 Centrar
        </button>
        <button
          type="button"
          className={`tool-btn ${measureActive ? 'active' : ''}`}
          title="Medidor de Distancia"
          onClick={toggleMeasure}
        >
          📏 {measureActive ? 'Activo' : 'Regla'}
        </button>
      </div>

      {/* 4. Visualizador de Coordenadas y Estado de Regla */}
      {mouseCoords && (
        <div className="gis-coords-hud">
          <span>Lat: {mouseCoords.lat} · Lng: {mouseCoords.lng}</span>
          {measureActive && (
            <span className="measure-status">
              {measurePoints.length === 0 && ' · Regla: Clic en mapa para iniciar'}
              {measurePoints.length === 1 && ' · Regla: Clic para el segundo punto'}
              {measurePoints.length === 2 && ' · Regla activa (Medición hecha)'}
            </span>
          )}
        </div>
      )}

      {/* 5. Leyenda Cartográfica */}
      <div className="gis-legend-card">
        <h4 className="legend-title">Leyenda</h4>
        <div className="legend-items">
          <div className="legend-section-title">Tipos de Actor</div>
          <div className="legend-item">{renderLegendIcon('publico')} CITE Público</div>
          <div className="legend-item">{renderLegendIcon('privado')} CITE Privado</div>
          <div className="legend-item">{renderLegendIcon('universidad')} Universidad / OTT</div>
          <div className="legend-item">{renderLegendIcon('empresa')} Empresa Innovadora</div>
          <div className="legend-item">{renderLegendIcon('startup')} Startup Tecnológica</div>
          <div className="legend-item">{renderLegendIcon('incubadora')} Incubadora / Aceleradora</div>
          <div className="legend-item">{renderLegendIcon('cati')} Red CATI</div>
          <div className="legend-item">{renderLegendIcon('coworking')} Espacio de Coworking</div>
          <div className="legend-item">{renderLegendIcon('gobierno')} Soporte / Estado</div>
          
          <div className="legend-section-title">Enlaces</div>
          <div className="legend-item">
            <span className="legend-line active" /> Conexión Activa (Actor Sel.)
          </div>
          <div className="legend-item">
            <span className="legend-line passive" style={{ borderTop: '2px solid rgba(255,255,255,0.4)' }} /> Enlace Khipu (Similitud)
          </div>
          <div className="legend-item">
            <span className="legend-line passive" style={{ borderTop: '2.5px dashed #00bcff' }} /> Cohesión Regional (100km)
          </div>
        </div>
      </div>

      {/* 6. renderizador del Motor Seleccionado */}
      <div className="map-view-canvas-wrapper" style={{ width: '100%', height: '100%' }}>
        {mapEngine === 'google' ? (
          /* Google Maps Engine */
          loadError ? (
            <div className="map-fallback-err">
              <h3>Error de carga de Google Maps</h3>
              <p>Por favor verifique su conexión o intente cambiar al motor Leaflet.</p>
            </div>
          ) : !isLoaded ? (
            <div className="map-fallback-err">
              <h3>Iniciando motor de Google Maps...</h3>
            </div>
          ) : (
            <GoogleMap
              mapContainerStyle={{ height: '100%', width: '100%' }}
              center={activeCenter}
              zoom={activeZoom}
              options={googleMapOptions}
              onLoad={(map) => setGoogleMapRef(map)}
              onMouseMove={handleGoogleMouseMove}
              onClick={handleGoogleClick}
            >
              {/* Marcadores de Actores */}
              {layers.nodes && cites.map((c) => {
                if (c.lat == null || c.lng == null) return null;
                const isSel = selected?.id === c.id;
                const isHovered = hoveredId === c.id;
                return (
                  <MarkerF
                    key={c.id}
                    position={{ lat: c.lat, lng: c.lng }}
                    onClick={() => {
                      isClickingMarkerRef.current = true;
                      onSelect(c.id);
                      setTimeout(() => { isClickingMarkerRef.current = false; }, 50);
                    }}
                    onMouseOver={() => onHover(c.id)}
                    onMouseOut={() => onHover(null)}
                    icon={getGoogleMarkerIcon(c, isSel || isHovered)}
                    visible={layers.nodes}
                  />
                );
              })}

              {/* Herramienta Regla en Google Maps */}
              <Polyline
                path={
                  measurePoints.length > 0
                    ? (measurePoints.length === 1 && tempPoint
                        ? [measurePoints[0], tempPoint]
                        : measurePoints)
                    : []
                }
                options={{
                  visible: measureActive && measurePoints.length > 0,
                  strokeColor: '#00bfff',
                  strokeOpacity: 0.85,
                  strokeWeight: 2,
                  geodesic: true
                }}
              />
              {measureActive && measurePoints.map((p, idx) => (
                <MarkerF
                  key={`google-measure-pin-${idx}`}
                  position={p}
                  icon={{
                     path: window.google.maps.SymbolPath.CIRCLE,
                     fillColor: '#00bfff',
                     fillOpacity: 1,
                     strokeColor: '#ffffff',
                     strokeWeight: 1.5,
                     scale: 6
                  }}
                  visible={measureActive}
                />
              ))}
              {measureActive && measurePoints.length === 2 && (
                <InfoWindowF
                  position={measurePoints[1]}
                  options={{ disableAutoPan: true, closeButton: false }}
                >
                  <div className="ruler-tooltip">
                    📏 {formatDistance(getHaversineDistance(measurePoints[0], measurePoints[1]))}
                  </div>
                </InfoWindowF>
              )}
              {measureActive && measurePoints.length === 1 && tempPoint && (
                <InfoWindowF
                  position={tempPoint}
                  options={{ disableAutoPan: true, closeButton: false }}
                >
                  <div className="ruler-tooltip">
                    📏 {formatDistance(getHaversineDistance(measurePoints[0], tempPoint))}
                  </div>
                </InfoWindowF>
              )}

            </GoogleMap>
          )
        ) : (
          /* Leaflet Engine */
          <MapContainer
            center={[activeCenter.lat, activeCenter.lng]}
            zoom={activeZoom}
            style={{ width: '100%', height: '100%', background: '#090d12' }}
            zoomControl={false}
          >
            {/* Lógica de cambio de vista reactiva */}
            <ChangeMapView center={activeCenter} zoom={activeZoom} />
            
            {/* Controladores de eventos del mapa */}
            <LeafletMapEvents
              onMapClick={handleLeafletClick}
              onMouseMove={handleLeafletMouseMove}
              active={measureActive}
            />

            {/* Tile Layer del Mapa Base */}
            <TileLayer
              url={leafletTileUrl}
              attribution={leafletTileAttribution}
            />

            {/* Capa de Enlaces / Conexiones (Similitud Khipu) */}
            {layers.connections && todasConexiones.map((line) => (
              <LeafletPolyline
                key={line.id}
                positions={line.path.map((p) => [p.lat, p.lng])}
                pathOptions={{
                  color: line.active ? '#d4af37' : line.color,
                  weight: line.active ? 3.5 : line.weight,
                  opacity: line.opacity
                }}
              />
            ))}

            {/* Capa Cohesión Regional (100km) - Red de Proximidad en Leaflet (Glow + Core dashed) */}
            {layers.influence && proximidadConexiones.map((line) => (
              <Fragment key={`group-prox-${line.id}`}>
                {/* Glow Line */}
                <LeafletPolyline
                  positions={line.path.map((p) => [Number(p.lat), Number(p.lng)])}
                  pathOptions={{
                    color: '#ffffff',
                    weight: 6.0,
                    opacity: 0.25,
                    lineCap: 'round'
                  }}
                />
                {/* Core Dashed Line */}
                <LeafletPolyline
                  positions={line.path.map((p) => [Number(p.lat), Number(p.lng)])}
                  pathOptions={{
                    color: '#ffffff',
                    weight: 2.5,
                    opacity: 1.0,
                    dashArray: '6, 8',
                    lineCap: 'round'
                  }}
                />
              </Fragment>
            ))}

            {/* Área de influencia del actor seleccionado a 100km (Glow + Core) */}
            {layers.influence && selected && selected.lat != null && (
              <Fragment key={`influence-circle-group-${selected.id}`}>
                {/* Circle Glow */}
                <Circle
                  center={[Number(selected.lat), Number(selected.lng)]}
                  radius={100000} // 100 km
                  pathOptions={{
                    color: '#ffffff',
                    weight: 3.0,
                    opacity: 0.15,
                    fillColor: '#ffffff',
                    fillOpacity: 0.02
                  }}
                />
                {/* Circle Core */}
                <Circle
                  center={[Number(selected.lat), Number(selected.lng)]}
                  radius={100000} // 100 km
                  pathOptions={{
                    color: '#ffffff',
                    weight: 1.2,
                    opacity: 0.7,
                    dashArray: '5, 10',
                    fill: false
                  }}
                />
              </Fragment>
            )}

            {/* Nodos de Innovación */}
            {layers.nodes && cites.map((c) => {
              if (c.lat == null || c.lng == null) return null;
              const isSel = selected?.id === c.id;
              const isHovered = hoveredId === c.id;
              return (
                <Marker
                  key={c.id}
                  position={[c.lat, c.lng]}
                  icon={createLeafletCustomIcon(c, isSel || isHovered, getActorColor)}
                  eventHandlers={{
                    click: () => {
                      isClickingMarkerRef.current = true;
                      onSelect(c.id);
                      setTimeout(() => { isClickingMarkerRef.current = false; }, 50);
                    },
                    mouseover: () => onHover(c.id),
                    mouseout: () => onHover(null)
                  }}
                />
              );
            })}

            {/* Capa de Mapa de Calor de Capacidades (Servicios) en Leaflet (Halo del actor activo en hover/click) */}
            {layers.heatmap && activeHeatmapNode && (
              <Circle
                key={`leaflet-heat-outer-${activeHeatmapNode.id}`}
                center={[Number(activeHeatmapNode.lat), Number(activeHeatmapNode.lng)]}
                radius={20000 + (Array.isArray(activeHeatmapNode.servicios) ? activeHeatmapNode.servicios.length : 0) * 10000} // 20km a 120km
                pathOptions={{
                  stroke: false,
                  fillColor: '#ff4757',
                  fillOpacity: Math.min(0.05 + (Array.isArray(activeHeatmapNode.servicios) ? activeHeatmapNode.servicios.length : 0) * 0.035, 0.45)
                }}
              />
            )}
            {layers.heatmap && activeHeatmapNode && (
              <Circle
                key={`leaflet-heat-inner-${activeHeatmapNode.id}`}
                center={[Number(activeHeatmapNode.lat), Number(activeHeatmapNode.lng)]}
                radius={8000 + (Array.isArray(activeHeatmapNode.servicios) ? activeHeatmapNode.servicios.length : 0) * 4000} // 8km a 48km
                pathOptions={{
                  stroke: false,
                  fillColor: '#ffa502',
                  fillOpacity: Math.min(0.10 + (Array.isArray(activeHeatmapNode.servicios) ? activeHeatmapNode.servicios.length : 0) * 0.05, 0.65)
                }}
              />
            )}

            {/* Herramienta de Regla en Leaflet */}
            {measurePoints.length > 0 && (
              <>
                <LeafletPolyline
                  positions={
                    measurePoints.length === 1 && tempPoint
                      ? [measurePoints[0], tempPoint]
                      : measurePoints
                  }
                  pathOptions={{
                    color: '#00bfff',
                    weight: 2,
                    dashArray: '5, 8'
                  }}
                />
                {measurePoints.map((p, idx) => (
                  <Circle
                    key={`leaflet-measure-pin-${idx}`}
                    center={[p.lat, p.lng]}
                    radius={100}
                    pathOptions={{
                      color: '#ffffff',
                      weight: 1.5,
                      fillColor: '#00bfff',
                      fillOpacity: 1
                    }}
                  />
                ))}
                {measurePoints.length === 2 && (
                  <Popup
                    position={[measurePoints[1].lat, measurePoints[1].lng]}
                    closeButton={false}
                    autoPan={false}
                  >
                    <div className="ruler-tooltip">
                      📏 {formatDistance(getHaversineDistance(measurePoints[0], measurePoints[1]))}
                    </div>
                  </Popup>
                )}
                {measurePoints.length === 1 && tempPoint && (
                  <Popup
                    position={[tempPoint.lat, tempPoint.lng]}
                    closeButton={false}
                    autoPan={false}
                  >
                    <div className="ruler-tooltip">
                      📏 {formatDistance(getHaversineDistance(measurePoints[0], tempPoint))}
                    </div>
                  </Popup>
                )}
              </>
            )}
          </MapContainer>
        )}
      </div>

    </div>
  );
}


