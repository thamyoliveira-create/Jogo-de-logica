import test from 'node:test';
import assert from 'node:assert/strict';
import { GAME_META, PUZZLES } from '../js/puzzles.js';
import {
  getState,
  isLevelUnlocked,
  isLevelComplete,
  markLevelComplete,
  resetProgress
} from '../js/core.js';
import {
  validateTents,
  generateWordGrid,
  validateBridges,
  validateFutoshiki,
  validateKenKen,
  validateEinstein,
  evaluateExpression,
  validateTwentyFourSolution,
  validateKakuro,
  validatePyramid,
  validateMagicSquare,
  validateBalance
} from '../js/rules.js';

test('GAME_META covers exactly 12 games with 50 total levels', () => {
  const gameIds = Object.keys(GAME_META);
  assert.equal(gameIds.length, 12);
  const totalLevels = gameIds.reduce((sum, id) => sum + GAME_META[id].total, 0);
  assert.equal(totalLevels, 50);
});

test('Every game has matching level definitions in PUZZLES', () => {
  Object.entries(GAME_META).forEach(([gameId, meta]) => {
    const levels = PUZZLES[gameId];
    assert.ok(Array.isArray(levels), `Game ${gameId} has levels array`);
    assert.equal(levels.length, meta.total, `Game ${gameId} has ${meta.total} levels`);
    levels.forEach((level, idx) => {
      assert.ok(level.title, `Game ${gameId} level ${idx + 1} has title`);
    });
  });
});

test('Tents puzzle solutions are valid according to rules', () => {
  PUZZLES.tents.forEach(level => {
    const res = validateTents(level, level.solution);
    assert.equal(res.valid, true, `Tents level ${level.id} solution is valid`);
  });
});

test('Bridges puzzle solutions are valid according to rules', () => {
  PUZZLES.bridges.forEach(level => {
    const res = validateBridges(level, level.solution);
    assert.equal(res.valid, true, `Bridges level ${level.id} solution is valid`);
  });
});

test('Futoshiki puzzle solutions are valid according to rules', () => {
  PUZZLES.futoshiki.forEach(level => {
    const res = validateFutoshiki(level, level.solution);
    assert.equal(res.valid, true, `Futoshiki level ${level.id} solution is valid`);
  });
});

test('KenKen puzzle solutions are valid according to rules', () => {
  PUZZLES.kenken.forEach(level => {
    const res = validateKenKen(level, level.solution);
    assert.equal(res.valid, true, `KenKen level ${level.id} solution is valid`);
  });
});

test('Einstein puzzle solutions are valid according to rules', () => {
  PUZZLES.einstein.forEach(level => {
    const res = validateEinstein(level, level.solution);
    assert.equal(res.valid, true, `Einstein level ${level.id} solution is valid`);
  });
});

test('TwentyFour expressions evaluate accurately without eval', () => {
  assert.equal(evaluateExpression('(1 + 5) * (8 - 4)').value, 24);
  assert.equal(evaluateExpression('8 / (1 - 2 / 3)').value, 24);
  assert.equal(evaluateExpression('(3 * 8) * (7 - 6)').value, 24);
});

test('Kakuro puzzle solutions are valid according to rules', () => {
  PUZZLES.kakuro.forEach(level => {
    const res = validateKakuro(level, level.solution);
    assert.equal(res.valid, true, `Kakuro level ${level.id} solution is valid`);
  });
});

test('Pyramids and Magic Squares solutions are valid according to rules', () => {
  PUZZLES.pyramid.forEach(level => {
    if (level.type === 'magic') {
      const res = validateMagicSquare(level, level.solution);
      assert.equal(res.valid, true, `Magic square level ${level.id} solution is valid`);
    } else {
      const res = validatePyramid(level, level.solution);
      assert.equal(res.valid, true, `Pyramid level ${level.id} solution is valid`);
    }
  });
});

test('Balance puzzle solutions are valid according to rules', () => {
  PUZZLES.balance.forEach(level => {
    const res = validateBalance(level, level.solution);
    assert.equal(res.valid, true, `Balance level ${level.id} solution is valid`);
  });
});

test('Word Search grid generator produces solvable letter matrix', () => {
  PUZZLES.words.forEach(level => {
    const { grid, placements } = generateWordGrid(level);
    assert.equal(grid.length, level.size);
    assert.equal(placements.length, level.words.length);
  });
});

test('All 12 games have Level 1 (index 0) unlocked at the beginning without sequential dependency', () => {
  resetProgress();
  const gameIds = Object.keys(GAME_META);
  gameIds.forEach(gameId => {
    assert.equal(isLevelUnlocked(gameId, 0), true, `Level 1 of ${gameId} is unlocked immediately`);
    assert.equal(isLevelUnlocked(gameId, 1), false, `Level 2 of ${gameId} is locked until level 1 is done`);
  });
});

test('Completing a level in one game only unlocks next level for that specific game', () => {
  resetProgress();
  assert.equal(isLevelComplete('tents', 0), false);
  assert.equal(isLevelUnlocked('tents', 1), false);

  markLevelComplete('tents', 0);

  assert.equal(isLevelComplete('tents', 0), true);
  assert.equal(isLevelUnlocked('tents', 1), true);
  assert.equal(isLevelUnlocked('bridges', 1), false, 'Bridges level 2 remains locked');
  assert.equal(isLevelUnlocked('hanoi', 1), false, 'Hanoi level 2 remains locked');
});
