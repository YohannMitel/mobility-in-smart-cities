// === Construction de la matrice d’adjacence ===
export function buildMatrix(nodes, edges, key = "time") {
  const n = nodes.length;

  // Crée une matrice n×n initialisée à -1
  const matrix = Array.from({ length: n }, () => Array(n).fill(-1));
  for (let i = 0; i < n; i++) matrix[i][i] = 0;

  for (const e of edges) {
    // Conversion pour éviter les problèmes "string" vs "number"
    const i = nodes.findIndex(n => Number(n.id) === Number(e.id_from));
    const j = nodes.findIndex(n => Number(n.id) === Number(e.id_to));

    if (i !== -1 && j !== -1) {
      // Relation dans les deux sens (bidirectionnelle)
      matrix[i][j] = e[key];
      matrix[j][i] = e[key];
    }
  }

  return matrix;
}

// === Algorithme f₁ : fermeture transitive (Canalda style) ===
export function transitiveClosure(matrix) {
  const n = matrix.length;
  const res = matrix.map(row => [...row]);
  let improved = true;

  while (improved) {
    improved = false;
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (res[i][j] > 0) {
          for (let k = 0; k < n; k++) {
            if (res[j][k] > 0) {
              const newCost = res[i][j] + res[j][k];
              if (res[i][k] === -1 || newCost < res[i][k]) {
                res[i][k] = newCost;
                improved = true;
              }
            }
          }
        }
      }
    }
  }
  return res;
}


/////////////////////////////////////////////////////
/////////////////////////////////////////////////////
/////////////////////////////////////////////////////
/////////////////////////////////////////////////////
/////////////////////////////////////////////////////
/////////////////////////////////////////////////////

export function graphMedianNode(nodes, closureMatrix) {
  // On ne garde que les personnes (Lucas, Dodi, Yohann…)
  const peopleIdx = nodes
    .map((n, i) => (n.type === "person" ? i : -1))
    .filter(i => i !== -1);

  let bestIdx = null;
  let bestCost = Infinity;

  for (let j = 0; j < nodes.length; j++) {
    let total = 0;
    let valid = true;
    for (const i of peopleIdx) {
      const cost = closureMatrix[i][j];
      if (cost < 0) { // non connecté
        valid = false;
        break;
      }
      total += cost;
    }
    if (valid && total < bestCost) {
      bestCost = total;
      bestIdx = j;
    }
  }

  if (bestIdx === null) return null;
  return { node: nodes[bestIdx], cost: bestCost };
}

///////////////////////////////////////////

// === Reconstruct minimal path using closure matrix ===
function findPath(fromId, toId, nodes, matrixClosure) {
  nodes;
  const closure = matrixClosure;
  const idToIndex = new Map(nodes.map((n, i) => [n.id, i]));

  const start = idToIndex.get(fromId);
  const end = idToIndex.get(toId);
  if (start === undefined || end === undefined) return null;

  const visited = new Set();
  const queue = [[start, [start]]];

  while (queue.length > 0) {
    const [current, path] = queue.shift();
    if (current === end) {
      return path.map(i => nodes[i]);
    }

    for (let j = 0; j < closure.length; j++) {
      if (closure[current][j] > 0 && !visited.has(j)) {
        const possibleDist = closure[current][j] + closure[j][end];
        if (possibleDist === closure[current][end]) {
          visited.add(j);
          queue.push([j, [...path, j]]);
        }
      }
    }
  }

  return null;
}

// === Compute directions for all persons ===
export function computeDirections(nodes,matrixClosure,bestNode) {
  if (!bestNode) return;
  const people = nodes.filter(n => n.type === "person");
  const medianId = bestNode.node.id;
  const results = [];

  people.forEach(person => {
    const path = findPath(person.id, medianId, nodes, matrixClosure);
    if (path) {
      const totalCost =
        matrixClosure[
          nodes.findIndex(n => n.id === person.id)
        ][
          nodes.findIndex(n => n.id === medianId)
        ];

      results.push({
        person: person.id,
        path: path.map(n => n.id),
        cost: totalCost
      });
    }
  });

  return results;
}
