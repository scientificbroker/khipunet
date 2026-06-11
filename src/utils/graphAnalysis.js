/**
 * Módulo de Análisis de Grafos y Ciencia de Redes (Gephi Analytica)
 * Contiene implementaciones eficientes en JS de algoritmos clásicos de grafos.
 */

/**
 * Calcula el Grado de Centralidad (Degree) para cada nodo.
 * El grado representa la cantidad de conexiones directas que tiene un actor.
 */
export function calculateDegrees(nodes, edges) {
  const degrees = {};
  nodes.forEach(n => {
    degrees[n.id] = 0;
  });

  edges.forEach(e => {
    const sId = e.source.id || e.source;
    const tId = e.target.id || e.target;
    if (degrees[sId] !== undefined) degrees[sId]++;
    if (degrees[tId] !== undefined) degrees[tId]++;
  });

  return degrees;
}

/**
 * Calcula el PageRank de cada nodo (Medida de prestigio e importancia estructural).
 * Utiliza el método de potencia iterativo.
 */
export function calculatePageRank(nodes, edges, iterations = 20, damping = 0.85) {
  const N = nodes.length;
  if (N === 0) return {};

  let pr = {};
  nodes.forEach(n => {
    pr[n.id] = 1 / N;
  });

  // Construir lista de adyacencia y conteos de grado de salida
  const adj = {};
  const outDegree = {};
  nodes.forEach(n => {
    adj[n.id] = [];
    outDegree[n.id] = 0;
  });

  edges.forEach(e => {
    const sId = e.source.id || e.source;
    const tId = e.target.id || e.target;
    
    // Al ser un grafo no dirigido en KhipuNet, tratamos las conexiones en ambos sentidos
    adj[tId].push(sId);
    outDegree[sId]++;

    adj[sId].push(tId);
    outDegree[tId]++;
  });

  // Bucle iterativo
  for (let iter = 0; iter < iterations; iter++) {
    const nextPr = {};
    let sinkSum = 0;

    nodes.forEach(n => {
      if (outDegree[n.id] === 0) {
        sinkSum += pr[n.id];
      }
    });

    nodes.forEach(n => {
      let sum = 0;
      adj[n.id].forEach(neighbor => {
        if (outDegree[neighbor] > 0) {
          sum += pr[neighbor] / outDegree[neighbor];
        }
      });

      nextPr[n.id] = (1 - damping) / N + damping * (sum + sinkSum / N);
    });

    pr = nextPr;
  }

  return pr;
}

/**
 * Calcula la Centralidad de Intermediación (Betweenness Centrality) usando el algoritmo de Brandes.
 * Mide el grado en que un nodo actúa como puente o intermediario en los caminos más cortos de la red.
 */
export function calculateBetweenness(nodes, edges) {
  const betweenness = {};
  nodes.forEach(n => {
    betweenness[n.id] = 0;
  });

  // Construir lista de adyacencia
  const adj = {};
  nodes.forEach(n => {
    adj[n.id] = [];
  });

  edges.forEach(e => {
    const sId = e.source.id || e.source;
    const tId = e.target.id || e.target;
    if (adj[sId] && adj[tId]) {
      adj[sId].push(tId);
      adj[tId].push(sId); // Red no dirigida
    }
  });

  nodes.forEach(s => {
    const S = []; // Pila para almacenar los nodos en orden de visita BFS inverso
    const P = {}; // Predesores en caminos más cortos
    const sigma = {}; // Contador de caminos más cortos
    const d = {}; // Distancia desde el nodo raíz s
    const Q = []; // Cola para BFS

    nodes.forEach(w => {
      P[w.id] = [];
      sigma[w.id] = 0;
      d[w.id] = -1;
    });

    sigma[s.id] = 1;
    d[s.id] = 0;
    Q.push(s.id);

    while (Q.length > 0) {
      const v = Q.shift();
      S.push(v);

      adj[v].forEach(w => {
        // ¿Es un nodo descubierto por primera vez?
        if (d[w] < 0) {
          d[w] = d[v] + 1;
          Q.push(w);
        }
        // ¿Camino más corto a través de v?
        if (d[w] === d[v] + 1) {
          sigma[w] += sigma[v];
          P[w].push(v);
        }
      });
    }

    const delta = {};
    nodes.forEach(w => {
      delta[w.id] = 0;
    });

    // Retropropagación acumulada de la pila S
    while (S.length > 0) {
      const w = S.pop();
      P[w].forEach(v => {
        delta[v] += (sigma[v] / sigma[w]) * (1 + delta[w]);
      });
      if (w !== s.id) {
        betweenness[w] += delta[w];
      }
    }
  });

  // Dividir entre 2 para grafos no dirigidos (ya que el camino A-B es idéntico a B-A)
  nodes.forEach(n => {
    betweenness[n.id] = betweenness[n.id] / 2;
  });

  return betweenness;
}

/**
 * Agrupa los nodos en comunidades de alta densidad (Modularity Classes)
 * utilizando el algoritmo de propagación de etiquetas (LPA).
 */
export function calculateCommunities(nodes, edges, maxIterations = 15) {
  const communities = {};
  // Inicialización: cada nodo es su propia comunidad
  nodes.forEach(n => {
    communities[n.id] = n.id;
  });

  // Lista de adyacencia
  const adj = {};
  nodes.forEach(n => {
    adj[n.id] = [];
  });

  edges.forEach(e => {
    const sId = e.source.id || e.source;
    const tId = e.target.id || e.target;
    if (adj[sId] && adj[tId]) {
      adj[sId].push(tId);
      adj[tId].push(sId);
    }
  });

  let changed = true;
  let iter = 0;

  while (changed && iter < maxIterations) {
    changed = false;
    iter++;

    // Desordenar los nodos para evitar sesgos de orden de procesamiento
    const shuffled = [...nodes].sort(() => Math.random() - 0.5);

    shuffled.forEach(n => {
      const neighbors = adj[n.id];
      if (neighbors.length === 0) return;

      // Contar frecuencias de etiquetas en el vecindario
      const counts = {};
      neighbors.forEach(neigh => {
        const comm = communities[neigh];
        counts[comm] = (counts[comm] || 0) + 1;
      });

      // Encontrar la etiqueta más frecuente (con desempate aleatorio)
      let maxCount = -1;
      let maxLabels = [];

      for (const label in counts) {
        if (counts[label] > maxCount) {
          maxCount = counts[label];
          maxLabels = [label];
        } else if (counts[label] === maxCount) {
          maxLabels.push(label);
        }
      }

      // Elegir aleatoriamente entre las de mayor frecuencia
      const chosenLabel = maxLabels[Math.floor(Math.random() * maxLabels.length)];

      if (communities[n.id] !== chosenLabel) {
        communities[n.id] = chosenLabel;
        changed = true;
      }
    });
  }

  // Normalizar los IDs de comunidad a índices numéricos consecutivos (0, 1, 2...)
  const uniqueComms = [...new Set(Object.values(communities))];
  const mapping = {};
  uniqueComms.forEach((c, idx) => {
    mapping[c] = idx;
  });

  const normalized = {};
  nodes.forEach(n => {
    normalized[n.id] = mapping[communities[n.id]];
  });

  return normalized;
}
