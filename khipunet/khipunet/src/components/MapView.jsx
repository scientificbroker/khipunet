import { MapContainer, TileLayer, CircleMarker, Tooltip, Polyline } from 'react-leaflet';

const PERU_CENTER = [-9.2, -75.0];

export default function MapView({ cites, cadenaById, selected, onSelect }) {
  // Cordones del khipu: hilos desde el nodo seleccionado hacia los demás de su cadena
  const cordones =
    selected && selected.lat != null
      ? cites
          .filter((c) => c.cadena === selected.cadena && c.id !== selected.id)
          .map((c) => [
            [selected.lat, selected.lng],
            [c.lat, c.lng],
          ])
      : [];

  const cadenaColor = (c) => cadenaById[c.cadena]?.color || '#00bfff';

  return (
    <div className="map-root">
      <MapContainer
        center={PERU_CENTER}
        zoom={5.4}
        zoomSnap={0.2}
        minZoom={4}
        maxZoom={15}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          subdomains={['a', 'b', 'c', 'd']}
        />

        {cordones.map((pts, i) => (
          <Polyline
            key={`cordon-${i}`}
            positions={pts}
            pathOptions={{
              color: cadenaColor(selected),
              weight: 1.4,
              opacity: 0.55,
              dashArray: '2 6',
            }}
          />
        ))}

        {cites.map((c) => {
          const isSel = selected?.id === c.id;
          const color = cadenaColor(c);
          return (
            <CircleMarker
              key={c.id}
              center={[c.lat, c.lng]}
              radius={isSel ? 11 : 8}
              pathOptions={{
                color: isSel ? '#ffffff' : color,
                weight: isSel ? 2.5 : 1.5,
                fillColor: color,
                fillOpacity: c.tipo === 'publico' ? 0.9 : 0.45,
              }}
              eventHandlers={{ click: () => onSelect(c.id) }}
            >
              <Tooltip direction="top" offset={[0, -8]} opacity={1}>
                <div className="popup-name">{c.nombre}</div>
                <div className="popup-meta">
                  {c.tipo === 'publico' ? 'CITE público' : 'CITE privado'} · {c.region}
                </div>
              </Tooltip>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}
