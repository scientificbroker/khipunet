const fs = require('fs');

const md = fs.readFileSync('KhipuNet_Base_Datos_CITEs.md', 'utf8');

const regex = /### \d+\.\s*(.+?)\n\n\| Campo \| Detalle \|\n\|---\|---\|\n([\s\S]+?)\n\n\*\*Descripción\.\*\* (.+?)\n\n\*\*Servicios:\*\* (.+?)(?=\n\n###|\n\n##|$)/g;

const cites = [];
let match;

while ((match = regex.exec(md)) !== null) {
  const name = match[1].trim();
  const tableRaw = match[2];
  const description = match[3].trim();
  const servicesRaw = match[4].trim();

  const tableRows = tableRaw.split('\n');
  const details = {};
  tableRows.forEach(row => {
    const parts = row.split('|').map(s => s.trim()).filter(s => s);
    if (parts.length === 2) {
      details[parts[0]] = parts[1];
    }
  });

  const coordsRaw = details['Coordenadas (lat, lng)'];
  let coordinates = null;
  if (coordsRaw && coordsRaw !== 'Pendiente') {
    const [lat, lng] = coordsRaw.split(',').map(Number);
    if (!isNaN(lat) && !isNaN(lng)) {
      coordinates = [lat, lng];
    }
  }

  cites.push({
    id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    name: name,
    type: details['Tipo'],
    cadena: details['Cadena productiva'],
    location: details['Región / Ciudad'],
    coordinates: coordinates,
    description: description,
    services: servicesRaw.split('·').map(s => s.trim()).filter(s => s),
    estado: details['Estado']
  });
}

// Generar código para exportar
let output = `export const citesData = ${JSON.stringify(cites, null, 2)};\n`;

// Asignar colores según cadena
const colorMap = {
  'Agroindustrial / Alimentario': '#2E8B00',
  'Pesquero / Acuícola': '#00BFFF',
  'Forestal / Madera': '#8B5A2B',
  'Cuero, Calzado y Textil': '#C0392B',
  'Productivo Multisectorial': '#9B59B6',
  'Materiales / Minería / Energía': '#E67E22',
  'Logística / Marketing / Creativas': '#F1C40F'
};

output += `\nexport const getColorByCadena = (cadena) => {\n  const map = ${JSON.stringify(colorMap, null, 2)};\n  return map[cadena] || '#95a5a6';\n};\n`;

fs.writeFileSync('src/data/citesDataFull.js', output);
console.log(`Parsed ${cites.length} CITEs.`);
