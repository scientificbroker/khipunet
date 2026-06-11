# KhipuNet CITEs — Mapa Interactivo de Innovación

Prototipo de la **Red Nacional de Transferencia Tecnológica** (inspirado en Kumu): mapa
georreferenciado de los Centros de Innovación Productiva y Transferencia Tecnológica (CITE)
del Perú, con ficha completa por nodo y "cordones del khipu" que conectan los CITEs de una
misma cadena productiva.

## Requisitos

- Node.js 18 o superior (`node -v` para verificar)
- npm (incluido con Node)

## Levantar en localhost

```bash
cd khipunet
npm install
npm run dev
```

Vite abrirá automáticamente `http://localhost:5173`.

Para generar la versión de producción:

```bash
npm run build
npm run preview
```

## Estructura

```
khipunet/
├── index.html                 # Raíz HTML + fuentes Montserrat/Lato
├── package.json
├── vite.config.js
├── generate_md.py             # Regenera la base de datos en formato .md
└── src/
    ├── main.jsx
    ├── App.jsx                # Estado global: filtros, búsqueda, selección
    ├── styles.css             # Identidad visual (paleta carbono + verde/cian)
    ├── data/
    │   └── cites.json         # ÚNICA fuente de verdad de los nodos
    └── components/
        ├── MapView.jsx        # Leaflet + marcadores + cordones del khipu
        ├── FilterBar.jsx      # Búsqueda, tipo (público/privado), cadenas
        └── SidePanel.jsx      # Ficha completa del CITE
```

## Cómo agregar o editar nodos

Toda la información vive en `src/data/cites.json`. Cada CITE es un objeto con:

| Campo | Descripción |
|---|---|
| `id` | identificador único en kebab-case |
| `nombre`, `tipo` | nombre oficial; `publico` o `privado` |
| `cadena` | id de cadena productiva (ver bloque `cadenas`) |
| `region`, `ciudad`, `direccion` | localización administrativa |
| `lat`, `lng` | coordenadas decimales (usar `null` si están pendientes) |
| `contacto` | teléfono, correo, web |
| `descripcion`, `servicios`, `ambito` | contenido de la ficha |
| `fuente`, `estado` | trazabilidad del dato |

Tras editar el JSON, el mapa se actualiza solo (hot reload). Para regenerar el
documento `.md` de la base de datos:

```bash
python3 generate_md.py
```

## Hoja de ruta (capas del grafo tipo Kumu)

1. **Capa 1 (esta versión):** nodos CITE públicos y privados.
2. **Capa 2:** gestores de innovación, OTT universitarias, incubadoras.
3. **Capa 3:** empresas y startups vinculadas (clientes CITE, beneficiarios
   ProInnóvate/Prociencia).
4. **Relaciones:** aristas CITE—empresa (servicio), CITE—gestor (asistencia),
   CITE—fondo (financiamiento), con grafo de fuerza (d3-force) como vista alterna al mapa.

## Fuentes

- ITP red CITE: https://www.itp.gob.pe
- Datos abiertos ITP: https://data-peru.itp.gob.pe
- Directorio oficial: https://www.gob.pe/itp
- Marco legal: DL 1228 y DS 004-2016-PRODUCE
