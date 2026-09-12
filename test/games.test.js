import test from 'node:test';
import assert from 'node:assert/strict';
import {
  checkRiverBankSafety,
  validateRiverRaft,
  isRiverComplete,
  checkEinsteinClue,
  validateEinstein,
  validateHanoiMove,
  isHanoiComplete,
  validateTents,
  validateFutoshiki,
  validateKenKen,
  evaluateMathExpression,
  validateTwentyFour,
  validateKakuro,
  validatePyramid,
  validateMagicSquare,
  calculatePanWeight,
  validateBalance
} from '../js/rules.js';
import {
  RIVER_LEVELS,
  EINSTEIN_LEVELS,
  HANOI_LEVELS,
  TENTS_LEVELS,
  FUTOSHIKI_LEVELS,
  KENKEN_LEVELS,
  TWENTYFOUR_LEVELS,
  KAKURO_LEVELS,
  PYRAMID_LEVELS,
  BALANCE_LEVELS
} from '../js/puzzles.js';

test('River Crossing - Japanese IQ Test bank safety constraints', () => {
  // Thief alone with family without police -> violation
  const violation1 = checkRiverBankSafety('japones', [
    { id: 'thief' },
    { id: 'boy1' }
  ]);
  assert.equal(violation1.safe, false);
  assert.match(violation1.reason, /Ladrão/);

  // Thief with family AND police -> safe
  const safe1 = checkRiverBankSafety('japones', [
    { id: 'thief' },
    { id: 'police' },
    { id: 'boy1' }
  ]);
  assert.equal(safe1.safe, true);

  // Father alone with girl without mother -> violation
  const violation2 = checkRiverBankSafety('japones', [
    { id: 'father' },
    { id: 'girl1' }
  ]);
  assert.equal(violation2.safe, false);
  assert.match(violation2.reason, /Pai/);

  // Father with girl AND mother -> safe
  const safe2 = checkRiverBankSafety('japones', [
    { id: 'father' },
    { id: 'mother' },
    { id: 'girl1' }
  ]);
  assert.equal(safe2.safe, true);

  // Mother alone with boy without father -> violation
  const violation3 = checkRiverBankSafety('japones', [
    { id: 'mother' },
    { id: 'boy1' }
  ]);
  assert.equal(violation3.safe, false);
  assert.match(violation3.reason, /Mãe/);

  // Mother with boy AND father -> safe
  const safe3 = checkRiverBankSafety('japones', [
    { id: 'mother' },
    { id: 'father' },
    { id: 'boy1' }
  ]);
  assert.equal(safe3.safe, true);
});

test('River Crossing - Raft validation and victory condition', () => {
  const level = RIVER_LEVELS[2]; // Japanese IQ test
  // Empty raft
  assert.equal(validateRiverRaft(level, []).canSail, false);

  // Only kids (no pilot)
  const kidsOnly = [{ id: 'boy1', isPilot: false }, { id: 'girl1', isPilot: false }];
  assert.equal(validateRiverRaft(level, kidsOnly).canSail, false);

  // Capacity exceeded (> 2)
  const threePilots = [
    { id: 'father', isPilot: true },
    { id: 'mother', isPilot: true },
    { id: 'police', isPilot: true }
  ];
  assert.equal(validateRiverRaft(level, threePilots).canSail, false);

  // Valid sailing with 1 pilot and 1 child
  const validRaft = [
    { id: 'police', isPilot: true },
    { id: 'thief', isPilot: false }
  ];
  assert.equal(validateRiverRaft(level, validRaft).canSail, true);

  // Victory check
  const stateIncomplete = {
    raftPosition: 'right',
    raft: [],
    left: [{ id: 'mother' }],
    right: [{ id: 'father' }]
  };
  assert.equal(isRiverComplete(level, stateIncomplete), false);

  const stateComplete = {
    raftPosition: 'right',
    raft: [],
    left: [],
    right: level.characters
  };
  assert.equal(isRiverComplete(level, stateComplete), true);

  // Victory check when last characters just arrived on raft at destination bank
  const stateCompleteOnRaft = {
    raftPosition: 'right',
    raft: [{ id: 'father' }, { id: 'mother' }],
    left: [],
    right: level.characters.filter(c => c.id !== 'father' && c.id !== 'mother')
  };
  assert.equal(isRiverComplete(level, stateCompleteOnRaft), true);
});

test('Einstein Riddle - Validation and clue satisfaction', () => {
  const level0 = EINSTEIN_LEVELS[0]; // 3 houses
  // Incomplete houses
  assert.equal(validateEinstein(level0, [{}, {}, {}]).valid, false);

  // Correct solution for level 0 (3 houses):
  const validSolution0 = [
    { cor: 'Amarela', animal: 'Gato', bebida: 'Chá' },
    { cor: 'Azul', animal: 'Pássaro', bebida: 'Leite' },
    { cor: 'Vermelha', animal: 'Cachorro', bebida: 'Suco' }
  ];
  const result0 = validateEinstein(level0, validSolution0);
  assert.equal(result0.valid, true);

  // Clue test: Amarela está à esquerda da Azul
  const clueLeftOf = level0.clues.find(c => c.check.type === 'left-of');
  assert.ok(clueLeftOf);
  assert.equal(checkEinsteinClue(clueLeftOf, validSolution0).status, 'satisfied');

  // Level 1 (4 houses) validation:
  const level1 = EINSTEIN_LEVELS[1];
  const result1 = validateEinstein(level1, level1.solution);
  assert.equal(result1.valid, true);

  // Level 2 (5 houses - classic Zebra puzzle) validation:
  const level2 = EINSTEIN_LEVELS[2];
  const result2 = validateEinstein(level2, level2.solution);
  assert.equal(result2.valid, true);
});

test('Tower of Hanoi - Move validation and stacking logic', () => {
  const level = HANOI_LEVELS[0]; // 3 discs
  const pegs = {
    A: [3, 2, 1],
    B: [],
    C: []
  };

  // Valid move 1 from A to C
  const move1 = validateHanoiMove(pegs, 'A', 'C');
  assert.equal(move1.valid, true);

  // Illegal move: empty peg
  const moveEmpty = validateHanoiMove(pegs, 'B', 'C');
  assert.equal(moveEmpty.valid, false);

  // Illegal move: larger disc over smaller disc
  const stateIllegal = {
    A: [3, 2],
    B: [],
    C: [1]
  };
  const moveIllegal = validateHanoiMove(stateIllegal, 'A', 'C'); // Disc 2 over Disc 1
  assert.equal(moveIllegal.valid, false);

  // Victory check
  const stateWin = {
    A: [],
    B: [],
    C: [3, 2, 1]
  };
  assert.equal(isHanoiComplete(level, stateWin), true);
});

test('Tents - Validation of grid and tent constraints', () => {
  const level0 = TENTS_LEVELS[0];
  const validTents0 = level0.solution;
  const result = validateTents(level0, validTents0);
  assert.equal(result.valid, true);

  // Wrong number of tents
  const invalidTents = validTents0.slice(1);
  const resultInvalid = validateTents(level0, invalidTents);
  assert.equal(resultInvalid.valid, false);
});

test('Futoshiki - Inequality and row/col uniqueness validation', () => {
  const level0 = FUTOSHIKI_LEVELS[0];
  const valid0 = level0.solution;
  const result = validateFutoshiki(level0, valid0);
  assert.equal(result.valid, true);
});

test('KenKen - Cage arithmetic and Latin square validation', () => {
  const level0 = KENKEN_LEVELS[0];
  const valid0 = level0.solution;
  const result = validateKenKen(level0, valid0);
  assert.equal(result.valid, true);
});

test('Math Evaluator (Safe Shunting-Yard Parser) - Arithmetic and Precedence', () => {
  // Simple operations
  assert.equal(evaluateMathExpression('2 + 3 * 4').value, 14);
  assert.equal(evaluateMathExpression('(2 + 3) * 4').value, 20);
  assert.equal(evaluateMathExpression('24 / (3 - 1)').value, 12);
  assert.equal(evaluateMathExpression('(8 - 4) * (7 - 1)').value, 24);

  // Fractional / decimal arithmetic
  const fracResult = evaluateMathExpression('(5 - 1 / 5) * 5');
  assert.ok(fracResult.valid);
  assert.ok(Math.abs(fracResult.value - 24) < 1e-9);

  // Unicode operator characters (×, ÷)
  assert.equal(evaluateMathExpression('(6 × 8) ÷ 2').value, 24);

  // Division by zero protection
  const divZero = evaluateMathExpression('24 / (4 - 4)');
  assert.equal(divZero.valid, false);
  assert.match(divZero.error, /Divisão por zero/);

  // Unbalanced parentheses & syntax errors
  assert.equal(evaluateMathExpression('((2 + 3) * 4').valid, false);
  assert.equal(evaluateMathExpression('2 + * 3').valid, false);
  assert.equal(evaluateMathExpression('').valid, false);
});

test('Jogo do 24 - Expression & target validation for all levels', () => {
  // Level 1: [3, 3, 8, 8] -> 8 / (3 - 8 / 3) = 24
  const l1 = TWENTYFOUR_LEVELS[0];
  const res1 = validateTwentyFour(l1, '8 / (3 - 8 / 3)');
  assert.equal(res1.valid, true);
  assert.ok(Math.abs(res1.value - 24) < 1e-5);

  // Level 2: [1, 3, 4, 6] -> 6 / (1 - 3 / 4) = 24
  const l2 = TWENTYFOUR_LEVELS[1];
  const res2 = validateTwentyFour(l2, '6 / (1 - 3 / 4)');
  assert.equal(res2.valid, true);

  // Level 3: [5, 5, 5, 1] -> (5 - 1 / 5) * 5 = 24
  const l3 = TWENTYFOUR_LEVELS[2];
  const res3 = validateTwentyFour(l3, '(5 - 1 / 5) * 5');
  assert.equal(res3.valid, true);

  // Level 4: [2, 3, 4, 5] -> (5 - 3 + 4) * 4? Wait: (5 + 3 - 2) * 4 = 24
  const l4 = TWENTYFOUR_LEVELS[3];
  const res4 = validateTwentyFour(l4, '(5 + 3 - 2) * 4');
  assert.equal(res4.valid, true);

  // Invalid: missing numbers
  const resMissing = validateTwentyFour(l1, '8 * 3');
  assert.equal(resMissing.valid, false);
  assert.match(resMissing.reason, /exatamente 4 números/);

  // Invalid: wrong numbers used
  const resWrongNums = validateTwentyFour(l1, '6 * 4 + 0 * 1');
  assert.equal(resWrongNums.valid, false);

  // Invalid: expression doesn't reach 24
  const resWrongResult = validateTwentyFour(l1, '8 + 8 + 3 + 3');
  assert.equal(resWrongResult.valid, false);
  assert.match(resWrongResult.reason, /alvo é 24/);
});

test('Kakuro - Cross-sum partitions and uniqueness validation', () => {
  // Test all Kakuro levels with their solutions
  KAKURO_LEVELS.forEach((level, idx) => {
    const result = validateKakuro(level, level.solution);
    assert.equal(result.valid, true, `Kakuro Level ${idx + 1} (${level.id}) solution should be valid`);
  });

  // Duplicate digit in horizontal/vertical run -> invalid
  const level0 = KAKURO_LEVELS[0];
  const invalidDuplicate = { ...level0.solution, '1,1': 4, '1,2': 4 }; // Row clue 8 with 4,4 (duplicate)
  const resultDuplicate = validateKakuro(level0, invalidDuplicate);
  assert.equal(resultDuplicate.valid, false);
  assert.equal(resultDuplicate.code, 'duplicate');

  // Incomplete board -> invalid
  const incompleteBoard = { ...level0.solution, '1,1': '' };
  const resultIncomplete = validateKakuro(level0, incompleteBoard);
  assert.equal(resultIncomplete.valid, false);
  assert.equal(resultIncomplete.code, 'incomplete');

  // Wrong sum -> invalid
  const invalidSum = { ...level0.solution, '1,1': 1, '1,2': 2 };
  const resultWrongSum = validateKakuro(level0, invalidSum);
  assert.equal(resultWrongSum.valid, false);
  assert.equal(resultWrongSum.code, 'wrong-sum');
});

test('Pirâmides Numéricas & Quadrados Mágicos - Validation', () => {
  // Pyramid levels
  const pyr1 = PYRAMID_LEVELS[0];
  const resPyr1 = validatePyramid(pyr1, pyr1.solution);
  assert.equal(resPyr1.valid, true);

  const pyr2 = PYRAMID_LEVELS[1];
  const resPyr2 = validatePyramid(pyr2, pyr2.solution);
  assert.equal(resPyr2.valid, true);

  // Pyramid with wrong brick calculation
  const badPyr = [
    [99],
    [8, 12],
    [3, 5, 7]
  ];
  const resBadPyr = validatePyramid(pyr1, badPyr);
  assert.equal(resBadPyr.valid, false);
  assert.equal(resBadPyr.code, 'invalid-brick');

  // Magic square levels
  const mag3 = PYRAMID_LEVELS[2];
  const resMag3 = validateMagicSquare(mag3, mag3.solution);
  assert.equal(resMag3.valid, true);

  const mag4 = PYRAMID_LEVELS[3];
  const resMag4 = validateMagicSquare(mag4, mag4.solution);
  assert.equal(resMag4.valid, true);

  // Magic square with duplicate number
  const duplicateMag = [
    [8, 1, 6],
    [3, 5, 7],
    [4, 8, 2] // 8 repeated
  ];
  const resDupMag = validateMagicSquare(mag3, duplicateMag);
  assert.equal(resDupMag.valid, false);
  assert.equal(resDupMag.code, 'duplicate');
});

test('Balança Lógica - Weight calculation and balance validation', () => {
  const weights = { square: 4, triangle: 2, circle: 3 };
  assert.equal(calculatePanWeight(['square', 'triangle'], weights), 6);
  assert.equal(calculatePanWeight(['circle', 'circle'], weights), 6);

  // Level 1: bal-1 -> mystery left: ['square', 'triangle'] (weight 6), solution right: ['triangle', 'triangle', 'triangle']
  const bal1 = BALANCE_LEVELS[0];
  const state1Valid = { rightPan: ['triangle', 'triangle', 'triangle'] };
  const resBal1 = validateBalance(bal1, state1Valid);
  assert.equal(resBal1.valid, true);

  // Level 1: unbalanced state
  const state1Invalid = { rightPan: ['triangle', 'triangle'] };
  const resBal1Invalid = validateBalance(bal1, state1Invalid);
  assert.equal(resBal1Invalid.valid, false);
  assert.match(resBal1Invalid.reason, /desequilibrada/);

  // Level 2: bal-2 -> star=6, diamond=4, moon=2; mystery left: ['star', 'diamond'] (weight 10); right: 5 moons (weight 10)
  const bal2 = BALANCE_LEVELS[1];
  const state2Valid = { rightPan: ['moon', 'moon', 'moon', 'moon', 'moon'] };
  const resBal2 = validateBalance(bal2, state2Valid);
  assert.equal(resBal2.valid, true);

  // Level 3: bal-3 -> gold=7, gem=4, heart=3; mystery left: ['gold', 'heart'] (weight 10); right: 1 gem + 2 hearts = 10
  const bal3 = BALANCE_LEVELS[2];
  const state3Valid = { rightPan: ['gem', 'heart', 'heart'] };
  const resBal3 = validateBalance(bal3, state3Valid);
  assert.equal(resBal3.valid, true);

  // Level 4: bal-4 -> fire=4, water=3, earth=7, air=10; mystery left: ['air', 'earth'] (weight 17); right: 2 fires + 3 waters = 8 + 9 = 17
  const bal4 = BALANCE_LEVELS[3];
  const state4Valid = { rightPan: ['fire', 'fire', 'water', 'water', 'water'] };
  const resBal4 = validateBalance(bal4, state4Valid);
  assert.equal(resBal4.valid, true);
});

