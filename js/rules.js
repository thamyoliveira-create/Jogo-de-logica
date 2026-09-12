const key = (row, col) => `${row}:${col}`;

export function isTree(puzzle, row, col) {
  return puzzle.trees.some(([treeRow, treeCol]) => treeRow === row && treeCol === col);
}

export function tentsHavePerfectMatching(puzzle, tents) {
  if (tents.length !== puzzle.trees.length) return false;
  const treeMatches = new Array(puzzle.trees.length).fill(-1);

  function assignTent(tentIndex, seen) {
    const [row, col] = tents[tentIndex];
    for (let treeIndex = 0; treeIndex < puzzle.trees.length; treeIndex += 1) {
      const [treeRow, treeCol] = puzzle.trees[treeIndex];
      if (Math.abs(row - treeRow) + Math.abs(col - treeCol) !== 1 || seen.has(treeIndex)) continue;
      seen.add(treeIndex);
      if (treeMatches[treeIndex] === -1 || assignTent(treeMatches[treeIndex], seen)) {
        treeMatches[treeIndex] = tentIndex;
        return true;
      }
    }
    return false;
  }

  return tents.every((_, tentIndex) => assignTent(tentIndex, new Set()));
}

export function validateTents(puzzle, grid) {
  if (!Array.isArray(grid) || grid.length !== puzzle.size
    || grid.some(row => !Array.isArray(row) || row.length !== puzzle.size)) {
    return { valid: false, code: 'invalid-grid' };
  }

  const tents = [];
  for (let row = 0; row < puzzle.size; row += 1) {
    for (let col = 0; col < puzzle.size; col += 1) {
      if (grid[row][col] === 1) {
        if (isTree(puzzle, row, col)) return { valid: false, code: 'tree' };
        tents.push([row, col]);
      }
    }
  }

  for (let row = 0; row < puzzle.size; row += 1) {
    const count = tents.filter(([tentRow]) => tentRow === row).length;
    if (count !== puzzle.rowClues[row]) return { valid: false, code: 'row', index: row, expected: puzzle.rowClues[row], actual: count };
  }
  for (let col = 0; col < puzzle.size; col += 1) {
    const count = tents.filter(([, tentCol]) => tentCol === col).length;
    if (count !== puzzle.colClues[col]) return { valid: false, code: 'column', index: col, expected: puzzle.colClues[col], actual: count };
  }

  for (let first = 0; first < tents.length; first += 1) {
    for (let second = first + 1; second < tents.length; second += 1) {
      const rowDistance = Math.abs(tents[first][0] - tents[second][0]);
      const colDistance = Math.abs(tents[first][1] - tents[second][1]);
      if (rowDistance <= 1 && colDistance <= 1) return { valid: false, code: 'touching' };
    }
  }

  if (!tentsHavePerfectMatching(puzzle, tents)) return { valid: false, code: 'pairing' };
  return { valid: true, code: 'complete' };
}

function seededRandom(seed) {
  let value = seed >>> 0;
  return () => {
    value += 0x6D2B79F5;
    let result = value;
    result = Math.imul(result ^ (result >>> 15), result | 1);
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}

export function generateWordGrid(level) {
  const directions = [[0, 1], [1, 0], [0, -1], [-1, 0], [1, 1], [1, -1], [-1, 1], [-1, -1]];

  for (let retry = 0; retry < 80; retry += 1) {
    const random = seededRandom(level.seed + retry * 997);
    const grid = Array.from({ length: level.size }, () => Array(level.size).fill(''));
    const placements = [];
    const words = [...level.words].sort((a, b) => b.word.length - a.word.length);
    let failed = false;

    for (const entry of words) {
      const candidates = [];
      for (let row = 0; row < level.size; row += 1) {
        for (let col = 0; col < level.size; col += 1) {
          for (const [rowStep, colStep] of directions) {
            const endRow = row + rowStep * (entry.word.length - 1);
            const endCol = col + colStep * (entry.word.length - 1);
            if (endRow < 0 || endRow >= level.size || endCol < 0 || endCol >= level.size) continue;

            const path = [];
            let overlap = 0;
            let fits = true;
            for (let index = 0; index < entry.word.length; index += 1) {
              const nextRow = row + rowStep * index;
              const nextCol = col + colStep * index;
              const existing = grid[nextRow][nextCol];
              if (existing && existing !== entry.word[index]) {
                fits = false;
                break;
              }
              if (existing === entry.word[index]) overlap += 1;
              path.push([nextRow, nextCol]);
            }
            if (fits) candidates.push({ path, overlap, tie: random() });
          }
        }
      }

      if (candidates.length === 0) {
        failed = true;
        break;
      }
      candidates.sort((a, b) => b.overlap - a.overlap || a.tie - b.tie);
      const preferred = candidates.filter(candidate => candidate.overlap === candidates[0].overlap);
      const chosen = preferred[Math.floor(random() * preferred.length)];
      chosen.path.forEach(([row, col], index) => { grid[row][col] = entry.word[index]; });
      placements.push({ ...entry, path: chosen.path });
    }

    if (failed) continue;
    const alphabet = 'AAAAAAAAABCDEEEEEEEEEIIIIIIOOOOOUUUUUBCDFGHJLMNPQRSTVXZ';
    for (let row = 0; row < level.size; row += 1) {
      for (let col = 0; col < level.size; col += 1) {
        if (!grid[row][col]) grid[row][col] = alphabet[Math.floor(random() * alphabet.length)];
      }
    }
    return { grid, placements };
  }
  throw new Error(`Não foi possível montar o nível de caça-palavras: ${level.id}`);
}

export function deriveBridgeEdges(puzzle) {
  const edges = [];
  puzzle.islands.forEach((island, index) => {
    const right = puzzle.islands
      .map((candidate, candidateIndex) => ({ ...candidate, candidateIndex }))
      .filter(candidate => candidate.row === island.row && candidate.col > island.col)
      .sort((a, b) => a.col - b.col)[0];
    const below = puzzle.islands
      .map((candidate, candidateIndex) => ({ ...candidate, candidateIndex }))
      .filter(candidate => candidate.col === island.col && candidate.row > island.row)
      .sort((a, b) => a.row - b.row)[0];
    if (right) edges.push([index, right.candidateIndex]);
    if (below) edges.push([index, below.candidateIndex]);
  });
  return edges;
}

export function bridgeKey(first, second) {
  return first < second ? `${first}-${second}` : `${second}-${first}`;
}

export function bridgeTotal(puzzle, bridges, islandIndex, edges = deriveBridgeEdges(puzzle)) {
  return edges.reduce((total, [first, second]) => {
    return total + (first === islandIndex || second === islandIndex ? Number(bridges[bridgeKey(first, second)] || 0) : 0);
  }, 0);
}

export function bridgesCross(puzzle, firstEdge, secondEdge) {
  if (firstEdge.some(island => secondEdge.includes(island))) return false;
  const [firstA, firstB] = firstEdge.map(index => puzzle.islands[index]);
  const [secondA, secondB] = secondEdge.map(index => puzzle.islands[index]);
  const firstHorizontal = firstA.row === firstB.row;
  const secondHorizontal = secondA.row === secondB.row;
  if (firstHorizontal === secondHorizontal) return false;

  const horizontal = firstHorizontal ? [firstA, firstB] : [secondA, secondB];
  const vertical = firstHorizontal ? [secondA, secondB] : [firstA, firstB];
  const minCol = Math.min(horizontal[0].col, horizontal[1].col);
  const maxCol = Math.max(horizontal[0].col, horizontal[1].col);
  const minRow = Math.min(vertical[0].row, vertical[1].row);
  const maxRow = Math.max(vertical[0].row, vertical[1].row);
  return vertical[0].col > minCol && vertical[0].col < maxCol
    && horizontal[0].row > minRow && horizontal[0].row < maxRow;
}

export function validateBridges(puzzle, bridges) {
  const edges = deriveBridgeEdges(puzzle);
  const allowed = new Set(edges.map(([first, second]) => bridgeKey(first, second)));
  for (const [storedKey, count] of Object.entries(bridges)) {
    if (!allowed.has(storedKey) || !Number.isInteger(count) || count < 0 || count > 2) {
      return { valid: false, code: 'invalid-edge' };
    }
  }

  for (let island = 0; island < puzzle.islands.length; island += 1) {
    const actual = bridgeTotal(puzzle, bridges, island, edges);
    const expected = puzzle.islands[island].value;
    if (actual !== expected) return { valid: false, code: 'degree', index: island, expected, actual };
  }

  const activeEdges = edges.filter(([first, second]) => (bridges[bridgeKey(first, second)] || 0) > 0);
  for (let first = 0; first < activeEdges.length; first += 1) {
    for (let second = first + 1; second < activeEdges.length; second += 1) {
      if (bridgesCross(puzzle, activeEdges[first], activeEdges[second])) return { valid: false, code: 'crossing' };
    }
  }

  const adjacency = Array.from({ length: puzzle.islands.length }, () => []);
  activeEdges.forEach(([first, second]) => {
    adjacency[first].push(second);
    adjacency[second].push(first);
  });
  const visited = new Set([0]);
  const pending = [0];
  while (pending.length) {
    const current = pending.pop();
    adjacency[current].forEach(next => {
      if (!visited.has(next)) {
        visited.add(next);
        pending.push(next);
      }
    });
  }
  if (visited.size !== puzzle.islands.length) return { valid: false, code: 'disconnected' };
  return { valid: true, code: 'complete' };
}

function duplicateCoordinates(grid) {
  const conflicts = new Set();
  const size = grid.length;
  for (let row = 0; row < size; row += 1) {
    const positions = new Map();
    grid[row].forEach((value, col) => {
      if (!value) return;
      if (!positions.has(value)) positions.set(value, []);
      positions.get(value).push([row, col]);
    });
    positions.forEach(cells => {
      if (cells.length > 1) cells.forEach(([cellRow, cellCol]) => conflicts.add(key(cellRow, cellCol)));
    });
  }
  for (let col = 0; col < size; col += 1) {
    const positions = new Map();
    grid.forEach((row, rowIndex) => {
      const value = row[col];
      if (!value) return;
      if (!positions.has(value)) positions.set(value, []);
      positions.get(value).push([rowIndex, col]);
    });
    positions.forEach(cells => {
      if (cells.length > 1) cells.forEach(([cellRow, cellCol]) => conflicts.add(key(cellRow, cellCol)));
    });
  }
  return conflicts;
}

export function futoshikiConflicts(puzzle, grid) {
  const conflicts = duplicateCoordinates(grid);
  puzzle.constraints.forEach(constraint => {
    const [aRow, aCol] = constraint.a;
    const [bRow, bCol] = constraint.b;
    const first = grid[aRow]?.[aCol] || 0;
    const second = grid[bRow]?.[bCol] || 0;
    if (!first || !second) return;
    const valid = constraint.relation === '<' ? first < second : first > second;
    if (!valid) {
      conflicts.add(key(aRow, aCol));
      conflicts.add(key(bRow, bCol));
    }
  });
  return conflicts;
}

export function validateFutoshiki(puzzle, grid) {
  if (!Array.isArray(grid) || grid.length !== puzzle.size
    || grid.some(row => !Array.isArray(row) || row.length !== puzzle.size
      || row.some(value => !Number.isInteger(value) || value < 1 || value > puzzle.size))) {
    return { valid: false, code: 'incomplete' };
  }
  const conflicts = futoshikiConflicts(puzzle, grid);
  if (conflicts.size > 0) return { valid: false, code: 'conflict', conflicts };
  return { valid: true, code: 'complete' };
}

export function cageResultIsValid(cage, values) {
  if (values.some(value => !value)) return false;
  if (cage.operation === null) return values.length === 1 && values[0] === cage.target;
  if (cage.operation === '+') return values.reduce((sum, value) => sum + value, 0) === cage.target;
  if (cage.operation === '×') return values.reduce((product, value) => product * value, 1) === cage.target;
  if (cage.operation === '−') return values.length === 2 && Math.abs(values[0] - values[1]) === cage.target;
  if (cage.operation === '÷') {
    if (values.length !== 2) return false;
    const high = Math.max(...values);
    const low = Math.min(...values);
    return low !== 0 && high / low === cage.target;
  }
  return false;
}

export function kenkenConflicts(puzzle, grid) {
  const conflicts = duplicateCoordinates(grid);
  puzzle.cages.forEach(cage => {
    const values = cage.cells.map(([row, col]) => grid[row]?.[col] || 0);
    if (values.every(Boolean) && !cageResultIsValid(cage, values)) {
      cage.cells.forEach(([row, col]) => conflicts.add(key(row, col)));
    }
  });
  return conflicts;
}

export function validateKenKen(puzzle, grid) {
  if (!Array.isArray(grid) || grid.length !== puzzle.size
    || grid.some(row => !Array.isArray(row) || row.length !== puzzle.size
      || row.some(value => !Number.isInteger(value) || value < 1 || value > puzzle.size))) {
    return { valid: false, code: 'incomplete' };
  }
  const conflicts = kenkenConflicts(puzzle, grid);
  if (conflicts.size > 0) return { valid: false, code: 'conflict', conflicts };
  return { valid: true, code: 'complete' };
}

export function validateKenKenDefinition(puzzle) {
  const cells = puzzle.cages.flatMap(cage => cage.cells.map(([row, col]) => key(row, col)));
  const expected = puzzle.size * puzzle.size;
  if (cells.length !== expected || new Set(cells).size !== expected) return false;
  return cells.every(cell => {
    const [row, col] = cell.split(':').map(Number);
    return row >= 0 && col >= 0 && row < puzzle.size && col < puzzle.size;
  });
}

// ----------------------------------------------------
// Travessia do Rio (River Crossing Rules)
// ----------------------------------------------------

export function checkRiverBankSafety(levelId, bankCharacters) {
  const present = new Set(bankCharacters.map(c => typeof c === 'string' ? c : c.id));
  const has = id => present.has(id);

  if (levelId === 'fazendeiro') {
    if (!has('farmer')) {
      if (has('wolf') && has('sheep')) {
        return { safe: false, reason: 'O Lobo comeu a Ovelha na margem!' };
      }
      if (has('sheep') && has('cabbage')) {
        return { safe: false, reason: 'A Ovelha comeu a Couve na margem!' };
      }
    }
  } else if (levelId === 'familia') {
    const fatherPresent = has('father');
    const motherPresent = has('mother');

    if (!motherPresent && fatherPresent && has('daughter')) {
      return { safe: false, reason: 'O Pai não pode ficar com a Filha sem a presença da Mãe!' };
    }
    if (!fatherPresent && motherPresent && has('son')) {
      return { safe: false, reason: 'A Mãe não pode ficar com o Filho sem a presença do Pai!' };
    }
    if (!fatherPresent && !motherPresent && has('dog') && (has('son') || has('daughter'))) {
      return { safe: false, reason: 'O Cachorro não pode ficar com as crianças sem um adulto por perto!' };
    }
  } else if (levelId === 'japones') {
    const policePresent = has('police');
    const thiefPresent = has('thief');
    const fatherPresent = has('father');
    const motherPresent = has('mother');
    const hasAnyBoy = has('boy1') || has('boy2');
    const hasAnyGirl = has('girl1') || has('girl2');

    if (thiefPresent && !policePresent) {
      const familyPresent = fatherPresent || motherPresent || hasAnyBoy || hasAnyGirl;
      if (familyPresent) {
        return { safe: false, reason: 'O Ladrão atacou a família sem a guarda do Policial!' };
      }
    }
    if (fatherPresent && !motherPresent && hasAnyGirl) {
      return { safe: false, reason: 'O Pai não pode ficar com nenhuma das filhas sem a presença da Mãe!' };
    }
    if (motherPresent && !fatherPresent && hasAnyBoy) {
      return { safe: false, reason: 'A Mãe não pode ficar com nenhum dos filhos sem a presença do Pai!' };
    }
  }

  return { safe: true };
}

export function validateRiverRaft(level, raftCharacters) {
  if (!Array.isArray(raftCharacters) || raftCharacters.length === 0) {
    return { canSail: false, reason: 'O barco está vazio! Embarque pelo menos 1 piloto.' };
  }
  if (raftCharacters.length > level.capacity) {
    return { canSail: false, reason: `O barco comporta no máximo ${level.capacity} tripulantes.` };
  }
  const hasPilot = raftCharacters.some(c => c.isPilot);
  if (!hasPilot) {
    return { canSail: false, reason: 'O barco precisa de pelo menos 1 piloto para navegar!' };
  }
  const raftSafety = checkRiverBankSafety(level.id, raftCharacters);
  if (!raftSafety.safe) {
    return { canSail: false, reason: `No barco: ${raftSafety.reason}` };
  }
  return { canSail: true };
}

export function isRiverComplete(level, state) {
  if (!state || state.raftPosition !== 'right') return false;
  const leftCount = state.left ? state.left.length : 0;
  if (leftCount > 0) return false;
  const rightCount = state.right ? state.right.length : 0;
  const raftCount = state.raft ? state.raft.length : 0;
  return (rightCount + raftCount) === level.characters.length;
}

// ----------------------------------------------------
// Enigma de Einstein (Einstein's Riddle Rules)
// ----------------------------------------------------

export function checkEinsteinClue(clue, houses) {
  const { check } = clue;
  if (!check) return { status: 'unknown' };

  const getHouseWith = (category, value) => {
    return houses.findIndex(h => h && h[category] === value);
  };

  if (check.type === 'house-value') {
    const house = houses[check.house];
    if (!house || !house[check.category]) return { status: 'pending' };
    return house[check.category] === check.value
      ? { status: 'satisfied' }
      : { status: 'violated' };
  }

  if (check.type === 'same-house') {
    const h1 = getHouseWith(check.cat1, check.val1);
    const h2 = getHouseWith(check.cat2, check.val2);
    if (h1 === -1 && h2 === -1) return { status: 'pending' };
    if (h1 !== -1 && h2 !== -1) {
      return h1 === h2 ? { status: 'satisfied' } : { status: 'violated' };
    }
    if (h1 !== -1) {
      const val = houses[h1][check.cat2];
      return val && val !== check.val2 ? { status: 'violated' } : { status: 'pending' };
    }
    if (h2 !== -1) {
      const val = houses[h2][check.cat1];
      return val && val !== check.val1 ? { status: 'violated' } : { status: 'pending' };
    }
  }

  if (check.type === 'left-of') {
    const h1 = getHouseWith(check.cat1, check.val1);
    const h2 = getHouseWith(check.cat2, check.val2);
    if (h1 === -1 && h2 === -1) return { status: 'pending' };
    if (h1 !== -1 && h2 !== -1) {
      return h1 === h2 - 1 ? { status: 'satisfied' } : { status: 'violated' };
    }
    if (h1 === houses.length - 1) return { status: 'violated' };
    if (h2 === 0) return { status: 'violated' };
    return { status: 'pending' };
  }

  if (check.type === 'neighbor') {
    const h1 = getHouseWith(check.cat1, check.val1);
    const h2 = getHouseWith(check.cat2, check.val2);
    if (h1 === -1 && h2 === -1) return { status: 'pending' };
    if (h1 !== -1 && h2 !== -1) {
      return Math.abs(h1 - h2) === 1 ? { status: 'satisfied' } : { status: 'violated' };
    }
    return { status: 'pending' };
  }

  return { status: 'pending' };
}

export function validateEinstein(level, houses) {
  if (!Array.isArray(houses) || houses.length !== level.houses) {
    return { valid: false, code: 'incomplete' };
  }

  // Check all categories in all houses are filled
  for (let h = 0; h < level.houses; h += 1) {
    const house = houses[h];
    if (!house || typeof house !== 'object') return { valid: false, code: 'incomplete' };
    for (const cat of level.categories) {
      if (!house[cat.id]) return { valid: false, code: 'incomplete' };
    }
  }

  // Check no duplicates in same category
  for (const cat of level.categories) {
    const seen = new Set();
    for (let h = 0; h < level.houses; h += 1) {
      const val = houses[h][cat.id];
      if (seen.has(val)) {
        return { valid: false, code: 'duplicate', category: cat.label, value: val };
      }
      seen.add(val);
    }
  }

  // Check all clues
  for (const clue of level.clues) {
    const res = checkEinsteinClue(clue, houses);
    if (res.status !== 'satisfied') {
      return { valid: false, code: 'clue-violated', clue: clue.text };
    }
  }

  return { valid: true, code: 'complete' };
}

// ----------------------------------------------------
// Torre de Hanói (Tower of Hanoi Rules)
// ----------------------------------------------------

export function validateHanoiMove(pegs, from, to) {
  if (!pegs[from] || pegs[from].length === 0) {
    return { valid: false, reason: `A haste ${from} está vazia!` };
  }
  if (from === to) {
    return { valid: false, reason: 'Escolha uma haste de destino diferente!' };
  }
  const sourceDisc = pegs[from][pegs[from].length - 1];
  const targetPeg = pegs[to] || [];
  if (targetPeg.length > 0) {
    const targetTopDisc = targetPeg[targetPeg.length - 1];
    if (sourceDisc > targetTopDisc) {
      return { valid: false, reason: `Não é permitido colocar um disco maior (${sourceDisc}) sobre um menor (${targetTopDisc})!` };
    }
  }
  return { valid: true };
}

export function isHanoiComplete(level, pegs) {
  if (!pegs || !pegs.C) return false;
  if (pegs.A.length !== 0 || pegs.B.length !== 0) return false;
  if (pegs.C.length !== level.discs) return false;
  for (let i = 0; i < level.discs; i += 1) {
    if (pegs.C[i] !== level.discs - i) return false;
  }
  return true;
}

// ----------------------------------------------------
// Jogo do 24 (Target 24 Rules & Math Evaluator)
// ----------------------------------------------------

export function evaluateMathExpression(exprStr) {
  if (typeof exprStr !== 'string' || !exprStr.trim()) {
    return { valid: false, error: 'Expressão vazia' };
  }
  const clean = exprStr.replace(/×/g, '*').replace(/÷/g, '/');
  const tokenRegex = /\d+(\.\d+)?|[+\-*/()]/g;
  const rawTokens = clean.match(tokenRegex);
  if (!rawTokens || rawTokens.join('').length !== clean.replace(/\s+/g, '').length) {
    return { valid: false, error: 'Caracteres inválidos na expressão' };
  }

  const outputQueue = [];
  const opStack = [];
  const precedence = { '+': 1, '-': 1, '*': 2, '/': 2 };

  for (let i = 0; i < rawTokens.length; i += 1) {
    const token = rawTokens[i];
    if (/^\d+(\.\d+)?$/.test(token)) {
      outputQueue.push(parseFloat(token));
    } else if ('+-*/'.includes(token)) {
      while (
        opStack.length > 0 &&
        opStack[opStack.length - 1] !== '(' &&
        precedence[opStack[opStack.length - 1]] >= precedence[token]
      ) {
        outputQueue.push(opStack.pop());
      }
      opStack.push(token);
    } else if (token === '(') {
      opStack.push(token);
    } else if (token === ')') {
      let foundOpen = false;
      while (opStack.length > 0) {
        const top = opStack.pop();
        if (top === '(') {
          foundOpen = true;
          break;
        }
        outputQueue.push(top);
      }
      if (!foundOpen) return { valid: false, error: 'Parênteses desbalanceados' };
    }
  }

  while (opStack.length > 0) {
    const top = opStack.pop();
    if (top === '(' || top === ')') return { valid: false, error: 'Parênteses desbalanceados' };
    outputQueue.push(top);
  }

  const evalStack = [];
  for (const token of outputQueue) {
    if (typeof token === 'number') {
      evalStack.push(token);
    } else {
      if (evalStack.length < 2) return { valid: false, error: 'Sintaxe matemática incorreta' };
      const b = evalStack.pop();
      const a = evalStack.pop();
      if (token === '+') evalStack.push(a + b);
      else if (token === '-') evalStack.push(a - b);
      else if (token === '*') evalStack.push(a * b);
      else if (token === '/') {
        if (Math.abs(b) < 1e-12) return { valid: false, error: 'Divisão por zero não permitida!' };
        evalStack.push(a / b);
      }
    }
  }

  if (evalStack.length !== 1 || Number.isNaN(evalStack[0])) {
    return { valid: false, error: 'Expressão incompleta ou inválida' };
  }

  return { valid: true, value: evalStack[0] };
}

export function validateTwentyFour(level, exprStr) {
  if (typeof exprStr !== 'string' || !exprStr.trim()) {
    return { valid: false, reason: 'Digite ou monte uma expressão com os 4 números disponíveis!' };
  }

  const rawNums = exprStr.match(/\d+(\.\d+)?/g);
  if (!rawNums) {
    return { valid: false, reason: 'Nenhum número foi utilizado na expressão!' };
  }

  const usedNums = rawNums.map(n => Number(n)).sort((a, b) => a - b);
  const requiredNums = [...level.numbers].sort((a, b) => a - b);

  if (usedNums.length !== requiredNums.length) {
    return {
      valid: false,
      reason: `Você precisa usar exatamente ${requiredNums.length} números (usou ${usedNums.length})!`
    };
  }

  for (let i = 0; i < requiredNums.length; i += 1) {
    if (usedNums[i] !== requiredNums[i]) {
      return {
        valid: false,
        reason: `Os números utilizados não correspondem aos disponíveis (${level.numbers.join(', ')})!`
      };
    }
  }

  const evalResult = evaluateMathExpression(exprStr);
  if (!evalResult.valid) {
    return { valid: false, reason: evalResult.error };
  }

  const target = level.target ?? 24;
  if (Math.abs(evalResult.value - target) > 1e-5) {
    const formattedVal = Number(evalResult.value.toFixed(2));
    return {
      valid: false,
      reason: `O resultado da sua expressão é ${formattedVal}, mas o alvo é ${target}. Tente outra combinação!`
    };
  }

  return { valid: true, value: evalResult.value };
}

// ----------------------------------------------------
// Kakuro (Cross-Sums Logic Rules)
// ----------------------------------------------------

export function validateKakuro(level, boardState) {
  if (!boardState || typeof boardState !== 'object') {
    return { valid: false, code: 'incomplete', reason: 'Tabuleiro vazio!' };
  }

  // Check all white cells are filled
  for (const cell of level.cells) {
    const key = `${cell.row},${cell.col}`;
    const val = boardState[key];
    if (!val || val < 1 || val > 9) {
      return { valid: false, code: 'incomplete', reason: 'Preencha todas as células com dígitos de 1 a 9!' };
    }
  }

  // Validate each run (horizontal and vertical sums)
  for (const run of level.runs) {
    const values = run.cells.map(([r, c]) => Number(boardState[`${r},${c}`]));

    // Check duplicates in run
    const uniqueValues = new Set(values);
    if (uniqueValues.size !== values.length) {
      return {
        valid: false,
        code: 'duplicate',
        reason: `Dígito repetido em uma mesma soma de pista ${run.clue} (${run.type === 'horizontal' ? 'linha' : 'coluna'})!`
      };
    }

    // Check sum
    const currentSum = values.reduce((sum, v) => sum + v, 0);
    if (currentSum !== run.clue) {
      return {
        valid: false,
        code: 'wrong-sum',
        reason: `A soma na ${run.type === 'horizontal' ? 'linha' : 'coluna'} resultou em ${currentSum}, mas a pista exige ${run.clue}!`
      };
    }
  }

  return { valid: true, code: 'complete' };
}

// ----------------------------------------------------
// Pirâmides Numéricas & Quadrados Mágicos Rules
// ----------------------------------------------------

export function validatePyramid(level, layersState) {
  if (!Array.isArray(layersState) || layersState.length !== level.layers.length) {
    return { valid: false, code: 'incomplete', reason: 'Preencha todos os tijolos da pirâmide!' };
  }

  // Check all filled
  for (let r = 0; r < level.layers.length; r += 1) {
    if (!Array.isArray(layersState[r]) || layersState[r].length !== level.layers[r].length) {
      return { valid: false, code: 'incomplete', reason: 'Preencha todos os tijolos da pirâmide!' };
    }
    for (let c = 0; c < layersState[r].length; c += 1) {
      const val = layersState[r][c];
      if (val === null || val === undefined || val === '' || Number.isNaN(Number(val))) {
        return { valid: false, code: 'incomplete', reason: 'Ainda há tijolos vazios na pirâmide!' };
      }
    }
  }

  // Validate parent-child operations
  const op = level.op || '+';
  for (let r = 0; r < layersState.length - 1; r += 1) {
    for (let c = 0; c < layersState[r].length; c += 1) {
      const parent = Number(layersState[r][c]);
      const left = Number(layersState[r + 1][c]);
      const right = Number(layersState[r + 1][c + 1]);
      const expected = op === '×' ? left * right : left + right;

      if (parent !== expected) {
        return {
          valid: false,
          code: 'invalid-brick',
          reason: `O tijolo de valor ${parent} está incorreto: ${left} ${op} ${right} = ${expected}!`
        };
      }
    }
  }

  return { valid: true, code: 'complete' };
}

export function validateMagicSquare(level, gridState) {
  if (!Array.isArray(gridState) || gridState.length !== level.size) {
    return { valid: false, code: 'incomplete', reason: 'Preencha todo o quadrado mágico!' };
  }

  const seenDigits = new Set();
  const maxDigit = level.size * level.size;

  for (let r = 0; r < level.size; r += 1) {
    if (!Array.isArray(gridState[r]) || gridState[r].length !== level.size) {
      return { valid: false, code: 'incomplete', reason: 'Preencha todas as casas do quadrado!' };
    }
    for (let c = 0; c < level.size; c += 1) {
      const val = gridState[r][c];
      if (val === null || val === undefined || val === '' || Number.isNaN(Number(val))) {
        return { valid: false, code: 'incomplete', reason: 'Ainda há casas vazias no quadrado!' };
      }
      const num = Number(val);
      if (num < 1 || num > maxDigit) {
        return { valid: false, code: 'out-of-range', reason: `Use apenas números de 1 a ${maxDigit}!` };
      }
      if (seenDigits.has(num)) {
        return { valid: false, code: 'duplicate', reason: `O número ${num} foi utilizado mais de uma vez!` };
      }
      seenDigits.add(num);
    }
  }

  const targetSum = level.magicConstant;

  // Check row sums
  for (let r = 0; r < level.size; r += 1) {
    const rowSum = gridState[r].reduce((s, v) => s + Number(v), 0);
    if (rowSum !== targetSum) {
      return { valid: false, code: 'wrong-sum', reason: `A linha ${r + 1} soma ${rowSum}, mas a constante mágica é ${targetSum}!` };
    }
  }

  // Check col sums
  for (let c = 0; c < level.size; c += 1) {
    let colSum = 0;
    for (let r = 0; r < level.size; r += 1) {
      colSum += Number(gridState[r][c]);
    }
    if (colSum !== targetSum) {
      return { valid: false, code: 'wrong-sum', reason: `A coluna ${c + 1} soma ${colSum}, mas a constante mágica é ${targetSum}!` };
    }
  }

  // Check main diagonal
  let mainDiagSum = 0;
  for (let i = 0; i < level.size; i += 1) {
    mainDiagSum += Number(gridState[i][i]);
  }
  if (mainDiagSum !== targetSum) {
    return { valid: false, code: 'wrong-sum', reason: `A diagonal principal soma ${mainDiagSum}, mas a constante mágica é ${targetSum}!` };
  }

  // Check anti diagonal
  let antiDiagSum = 0;
  for (let i = 0; i < level.size; i += 1) {
    antiDiagSum += Number(gridState[i][level.size - 1 - i]);
  }
  if (antiDiagSum !== targetSum) {
    return { valid: false, code: 'wrong-sum', reason: `A diagonal secundária soma ${antiDiagSum}, mas a constante mágica é ${targetSum}!` };
  }

  return { valid: true, code: 'complete' };
}

// ----------------------------------------------------
// Balança Lógica (Visual Scale Balance Rules)
// ----------------------------------------------------

export function calculatePanWeight(shapeIds, shapeWeights) {
  if (!Array.isArray(shapeIds)) return 0;
  return shapeIds.reduce((total, id) => total + (shapeWeights[id] || 0), 0);
}

export function validateBalance(level, userState) {
  if (!userState || typeof userState !== 'object') {
    return { valid: false, reason: 'Coloque as formas na balança para equilibrar!' };
  }

  const shapeWeights = {};
  level.shapes.forEach(s => {
    shapeWeights[s.id] = s.weight;
  });

  const mysteryLeftWeight = calculatePanWeight(level.mysteryScale.left, shapeWeights);
  const userRightShapes = userState.rightPan || [];
  const mysteryRightWeight = calculatePanWeight(userRightShapes, shapeWeights);

  if (userRightShapes.length === 0) {
    return { valid: false, reason: 'O prato direito da balança misteriosa está vazio!' };
  }

  if (mysteryLeftWeight !== mysteryRightWeight) {
    const diff = mysteryRightWeight - mysteryLeftWeight;
    const direction = diff > 0 ? 'mais pesado' : 'mais leve';
    return {
      valid: false,
      reason: `A balança está desequilibrada! O prato direito está ${direction} do que o prato esquerdo.`
    };
  }

  // Check if level has specific shape constraint (e.g. "Use only triangles")
  if (level.mysteryScale.allowedShapes && Array.isArray(level.mysteryScale.allowedShapes)) {
    const allowed = new Set(level.mysteryScale.allowedShapes);
    for (const shapeId of userRightShapes) {
      if (!allowed.has(shapeId)) {
        return { valid: false, reason: `Use apenas as formas solicitadas no desafio!` };
      }
    }
  }

  return { valid: true, code: 'balanced' };
}


