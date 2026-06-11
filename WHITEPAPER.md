# KhipuNet: Whitepaper Técnico y Estratégico

**Plataforma Nacional de Transferencia Tecnológica para el Ecosistema de Innovación del Perú.**

---

## 1. Resumen Ejecutivo (Abstract)
**KhipuNet** nace como una solución arquitectónica y analítica para mapear, conectar y medir las capacidades del ecosistema de innovación del Perú. Inspirado en los "Quipus" incaicos (sistemas de registro de información a través de cuerdas y nudos), KhipuNet representa a cada institución como un "nodo" interconectado dentro de una gran red topológica nacional. 

El proyecto está diseñado para alinear los esfuerzos de las universidades, los CITEs, las startups y el gobierno, bajo el marco metodológico de las **Iniciativas de Vinculación Academia-Industria (IVAI 2025)** del CONCYTEC.

---

## 2. Características Principales (Core Features)

* **Arquitectura Híbrida de Datos (Estático + Dinámico):** KhipuNet logra tiempos de carga de menos de 100 milisegundos cargando una capa base fundacional estática y fusionándola instantáneamente con una capa dinámica en tiempo real traída desde la nube (Supabase).
* **Taxonomía Alineada al Estado (IVAI):** Estructura de base de datos categorizada rigurosamente en las líneas estratégicas de inversión e innovación del Perú (Agroindustria, Acuicultura, Forestal, Textil, Minería, etc.).
* **Diseño "Glassmorphism" y Microinteracciones:** Una interfaz de usuario (UI) profundamente inmersiva, sin marcos ("frameless"), basada en colores oscuros, desenfoques de fondo (blur) y animaciones fluidas para una experiencia premium.

---

## 3. Funcionalidades de la Plataforma

### A. Cartografía Multimotor (Geo-Mapping)
* **Motor Híbrido:** Permite alternar sin recargas entre visualizaciones de mapas físicos/satelitales (Leaflet/OpenStreetMap).
* **Clusterización Inteligente:** Agrupa nodos que están geográficamente muy cerca para evitar la saturación visual de la pantalla.
* **Geodesia Interactiva:** Incluye una herramienta de regla para calcular distancias exactas en kilómetros entre dos centros tecnológicos.

### B. Simulación Física Topológica (Grafo 2D)
* Visualización alternativa al mapa que obvia la geografía para centrarse puramente en las **Relaciones Ecosistémicas**.
* **Motor D3.js de Fuerzas:** Los nodos se atraen o repelen magnéticamente simulando gravedad en tiempo real para organizar clústeres por tipo de industria o institución.

### C. Analítica y Minería de Datos
* **Estadística Descriptiva Integrada:** En lugar de solo contar actores, agrupa los datos en "Distribuciones de Frecuencias en Datos Agrupados" para descubrir cuellos de botella en la oferta tecnológica nacional.

### D. Gobernanza y Curaduría (Admin Panel)
* **Flujo de Solicitudes:** Los nuevos actores se registran en la web. Estos datos no van al mapa directamente, sino a una sala de espera en la base de datos.
* **Portal Privado (`/admin`):** Pantalla oculta protegida criptográficamente donde un comité evaluador aprueba o rechaza el ingreso de los nodos al sistema nacional mediante un simple clic.

---

## 4. Stack Tecnológico

El proyecto ha sido desarrollado bajo un paradigma moderno de **Single Page Application (SPA)** y servidor sin estado (Serverless).

* **Frontend Framework:** React 18 impulsado por Vite (para compilación y recarga ultra rápida).
* **Styling:** CSS Vanilla de alto rendimiento con animaciones por hardware (GPU) y SVG Rendering dinámico. Se evitó el uso de librerías de componentes pesadas para mantener el paquete (`bundle`) por debajo de los 1MB.
* **Visualización Geográfica:** `Leaflet` y `react-leaflet`.
* **Visualización de Redes:** `D3.js` (Física de Grafos) encapsulado en componentes funcionales de React.
* **Backend y Base de Datos:** **Supabase** (PostgreSQL). Provee operaciones CRUD mediante APIs REST y maneja la autenticación y Row Level Security (RLS).
* **Despliegue y Edge CDN:** **Vercel**, encargado del enrutamiento de SPA y entrega de contenido estático global a baja latencia.

---

## 5. Modo de Uso

### Para el Ciudadano / Funcionario (Modo Exploración)
1. Ingresa al portal web.
2. Utiliza los filtros laterales para encender o apagar visualizaciones (Ej. "Quiero ver solo Universidades del sector Agroindustrial").
3. Pasa el ratón (Hover) sobre un nodo para obtener un resumen rápido sin tiempos de carga (Zero-Lag).
4. Haz clic en el nodo para anclar la información y ver sus datos de contacto y servicios prestados.

### Para las Instituciones (Modo Registro)
1. En la pantalla principal, dirígete a la sección inferior **"Súmate a la Red de Innovación"**.
2. Completa el formulario seleccionando tu rol (CITE, Startup, etc.) y tu cadena productiva (IVAI).
3. Envía la solicitud y espera el correo de confirmación de aprobación.

### Para el Curador de la Red (Modo Administrador)
1. Ingresa a la ruta segura: `misitio.com/admin`
2. Introduce tu correo y contraseña asignados por Supabase Auth.
3. Observa las tarjetas de solicitudes pendientes en el Dashboard y selecciona el botón verde (Aprobar) o rojo (Rechazar). La base de datos y el mapa se actualizarán solos.

---

## 6. Cómo Colaborar

KhipuNet es un proyecto abierto al ecosistema. Buscamos desarrolladores, analistas de datos e investigadores que deseen potenciar esta herramienta.

1. **Fork del Repositorio:** Haz un *Fork* del proyecto original en GitHub (`scientificbroker/khipunet`).
2. **Entorno de Desarrollo:** 
   ```bash
   git clone https://github.com/TU_USUARIO/khipunet.git
   cd khipunet
   npm install
   npm run dev
   ```
3. **Variables de Entorno:** Solicita acceso a un entorno de Supabase de prueba o crea el tuyo guiándote por el archivo `.env.example`.
4. **Reglas de Aporte (Pull Requests):** Todo código nuevo debe priorizar el rendimiento. Evitar agregar dependencias NPM innecesarias. Se fomenta el uso del ecosistema React hooks puro.
5. **Issues:** Puedes colaborar reportando errores de datos cartográficos o proponiendo nuevas herramientas analíticas a través del panel de *Issues* en GitHub.

---
*Documento generado para la versión 0.1.0 (Base IVAI 2025).*
