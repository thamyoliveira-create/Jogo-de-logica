import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BRIDGE_LEVELS,
  FUTOSHIKI_LEVELS,
  KENKEN_LEVELS,
  TENTS_LEVELS,
  WORD_LEVELS
} from '../js/puzzles.js';
import {
  bridgeKey,
  cageResultIsValid,
  deriveBridgeEdges,
  generateWordGrid,
  validateBridges,
  validateFutoshiki,
  validateKenKen,
  validateKenKenDefinition,
  validateTents
} from '../js/rules.js';

function countTentsSolutions(level, limit = 2) {
  const candidates = [];
  for (let row = 0; row < level.size; row += 1) {
    for (let col = 0; col < level.size; col += 1) {
      const tree = level.trees.some(([treeRow, treeCol]) => treeRow === row && treeCol === col);
      const nearTree = level.trees.some(([treeRow, treeCol]) => Math.abs(treeRow - row) + Math.abs(treeCol - col) === 1);
      if (!tree && nearTree && level.rowClues[row] > 0 && level.colClues[col] > 0) candidates.push([row, col]);
    }
  }

  const grid = Array.from({ length: level.size }, () => Array(level.size).fill(0));
  const rowCounts = Array(level.size).fill(0);
  const colCounts = Array(level.size).fill(0);
  let solutions = 0;

  function search(index) {
    if (solutions >= limit) return;
    if (index === candidates.length) {
      if (validateTents(level, grid).valid) solutions += 1;
      return;
    }

    const [row, col] = candidates[index];
    search(index + 1);
    if (rowCounts[row] >= level.rowClues[row] || colCounts[col] >= level.colClues[col]) return;
    const touches = candidates.slice(0, index).some(([otherRow, otherCol]) => (
      grid[otherRow][otherCol] === 1 && Math.abs(otherRow - row) <= 1 && Math.abs(otherCol - col) <= 1
    ));
    if (touches) return;

    grid[row][col] = 1;
    rowCounts[row] += 1;
    colCounts[col] += 1;
    search(index + 1);
    grid[row][col] = 0;
    rowCounts[row] -= 1;
    colCounts[col] -= 1;
  }

  search(0);
  return solutions;
}

function countFutoshikiSolutions(level, limit = 2) {
  const grid = Array.from({ length: level.size }, () => Array(level.size).fill(0));
  level.givens.forEach(given => { grid[given.row][given.col] = given.value; });
  const editable = [];
  for (let row = 0; row < level.size; row += 1) {
    for (let col = 0; col < level.size; col += 1) {
      if (grid[row][col] === 0) editable.push([row, col]);
    }
  }
  let solutions = 0;

  function validCandidate(row, col, value) {
    if (grid[row].includes(value)) return false;
    if (grid.some(candidateRow => candidateRow[col] === value)) return false;
    return level.constraints.every(constraint => {
      const [aRow, aCol] = constraint.a;
      const [bRow, bCol] = constraint.b;
      const first = aRow === row && aCol === col ? value : grid[aRow][aCol];
      const second = bRow === row && bCol === col ? value : grid[bRow][bCol];
      if (!first || !second) return true;
      return constraint.relation === '<' ? first < second : first > second;
    });
  }

  function search(index) {
    if (solutions >= limit) return;
    if (index === editable.length) {
      if (validateFutoshiki(level, grid).valid) solutions += 1;
      return;
    }
    const [row, col] = editable[index];
    for (let value = 1; value <= level.size; value += 1) {
      if (!validCandidate(row, col, value)) continue;
      grid[row][col] = value;
      search(index + 1);
      grid[row][col] = 0;
    }
  }

  search(0);
  return solutions;
}

function countKenKenSolutions(level, limit = 2) {
  const grid = Array.from({ length: level.size }, () => Array(level.size).fill(0));
  const cells = [];
  for (let row = 0; row < level.size; row += 1) {
    for (let col = 0; col < level.size; col += 1) cells.push([row, col]);
  }
  let solutions = 0;

  function cageFor(row, col) {
    return level.cages.find(cage => cage.cells.some(([cellRow, cellCol]) => cellRow === row && cellCol === col));
  }

  function cageCanStillWork(cage) {
    const values = cage.cells.map(([row, col]) => grid[row][col]);
    const entered = values.filter(Boolean);
    if (entered.length === values.length) return cageResultIsValid(cage, values);
    if (cage.operation === null) return entered.length === 0 || entered[0] === cage.target;
    if (cage.operation === '+') return entered.reduce((sum, value) => sum + value, 0) < cage.target;
    if (cage.operation === '×') return cage.target % entered.reduce((product, value) => product * value, 1) === 0;
    return true;
  }

  function search(index) {
    if (solutions >= limit) return;
    if (index === cells.length) {
      if (validateKenKen(level, grid).valid) solutions += 1;
      return;
    }
    const [row, col] = cells[index];
    const cage = cageFor(row, col);
    for (let value = 1; value <= level.size; value += 1) {
      if (grid[row].includes(value) || grid.some(candidateRow => candidateRow[col] === value)) continue;
      grid[row][col] = value;
      if (cageCanStillWork(cage)) search(index + 1);
      grid[row][col] = 0;
    }
  }

  search(0);
  return solutions;
}

function countBridgeSolutions(level, limit = 2) {
  const edges = deriveBridgeEdges(level);
  const totals = Array(level.islands.length).fill(0);
  const bridges = {};
  let solutions = 0;

  function search(index) {
    if (solutions >= limit) return;
    if (index === edges.length) {
      if (validateBridges(level, bridges).valid) solutions += 1;
      return;
    }
    const [first, second] = edges[index];
    const storedKey = bridgeKey(first, second);
    for (let count = 0; count <= 2; count += 1) {
      if (totals[first] + count > level.islands[first].value || totals[second] + count > level.islands[second].value) continue;
      totals[first] += count;
      totals[second] += count;
      if (count > 0) bridges[storedKey] = count;
      search(index + 1);
      delete bridges[storedKey];
      totals[first] -= count;
      totals[second] -= count;
    }
  }

  search(0);
  return solutions;
}

test('all word-search levels place every declared word reproducibly', () => {
  WORD_LEVELS.forEach(level => {
    const first = generateWordGrid(level);
    const second = generateWordGrid(level);
    assert.equal(first.placements.length, level.words.length, level.id);
    assert.deepEqual(first, second, `${level.id} should be deterministic`);
    first.placements.forEach(placement => {
      const letters = placement.path.map(([row, col]) => first.grid[row][col]).join('');
      assert.equal(letters, placement.word);
    });
  });
});

test('every tents level has exactly one valid solution', () => {
  TENTS_LEVELS.forEach(level => assert.equal(countTentsSolutions(level), 1, level.id));
});

test('every bridge level is solvable using nearest visible neighbours', () => {
  BRIDGE_LEVELS.forEach(level => {
    const edges = deriveBridgeEdges(level);
    assert.ok(edges.length >= level.islands.length - 1, level.id);
    edges.forEach(([first, second]) => {
      const a = level.islands[first];
      const b = level.islands[second];
      assert.ok(a.row === b.row || a.col === b.col);
      const between = level.islands.some((island, index) => index !== first && index !== second
        && ((a.row === b.row && island.row === a.row && island.col > Math.min(a.col, b.col) && island.col < Math.max(a.col, b.col))
          || (a.col === b.col && island.col === a.col && island.row > Math.min(a.row, b.row) && island.row < Math.max(a.row, b.row))));
      assert.equal(between, false, level.id);
    });
    assert.ok(countBridgeSolutions(level) >= 1, `${level.id} should be solvable`);
  });
});

test('futoshiki supplied solutions satisfy every rule and each level is unique', () => {
  FUTOSHIKI_LEVELS.forEach(level => {
    assert.equal(validateFutoshiki(level, level.solution).valid, true, level.id);
    level.givens.forEach(given => assert.equal(level.solution[given.row][given.col], given.value, level.id));
    assert.equal(countFutoshikiSolutions(level), 1, level.id);
  });
});

test('KenKen definitions cover every cell and each puzzle has one solution', () => {
  KENKEN_LEVELS.forEach(level => {
    assert.equal(validateKenKenDefinition(level), true, level.id);
    assert.equal(validateKenKen(level, level.solution).valid, true, level.id);
    assert.equal(countKenKenSolutions(level), 1, level.id);
  });
});
