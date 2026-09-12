import { TENTS_LEVELS } from '../puzzles.js';
import {
  cancelAdvance,
  celebrate,
  clearBoardState,
  clearMessage,
  getBoardState,
  getSelectedLevel,
  isLevelComplete,
  markLevelComplete,
  moveGridFocus,
  playerCallout,
  renderLevelPicker,
  saveBoardState,
  scheduleAdvance,
  setSelectedLevel,
  showMessage
} from '../core.js';
import { isTree, validateTents } from '../rules.js';

const GAME_ID = 'tents';
const panel = document.querySelector('#panel-tents');
const picker = panel.querySelector('[data-level-picker]');
const board = panel.querySelector('[data-board]');
const message = panel.querySelector('[data-message]');
const checkButton = panel.querySelector('[data-action="check"]');
const resetButton = panel.querySelector('[data-action="reset"]');
let currentLevel = getSelectedLevel(GAME_ID);
let grid = [];

function blankGrid(size) {
  return Array.from({ length: size }, () => Array(size).fill(0));
}

function validStoredGrid(level, value) {
  return Array.isArray(value)
    && value.length === level.size
    && value.every((row, rowIndex) => Array.isArray(row)
      && row.length === level.size
      && row.every((cell, colIndex) => (
        [0, 1, 2].includes(cell) && (!isTree(level, rowIndex, colIndex) || cell === 0)
      )));
}

function setLevel(index) {
  cancelAdvance(GAME_ID);
  currentLevel = index;
  setSelectedLevel(GAME_ID, index);
  const level = TENTS_LEVELS[index];
  const stored = getBoardState(GAME_ID, index);
  grid = validStoredGrid(level, stored?.grid) ? stored.grid : blankGrid(level.size);
  clearMessage(message);
  render();
}

function cycleCell(row, col) {
  grid[row][col] = (grid[row][col] + 1) % 3;
  saveBoardState(GAME_ID, currentLevel, { grid });
  clearMessage(message);
  renderBoard();
}

function clueState(actual, expected) {
  if (actual === expected) return 'complete';
  if (actual > expected) return 'over';
  return 'open';
}

function makeClue(value, actual, label) {
  const clue = document.createElement('div');
  clue.className = 'tents-clue';
  clue.dataset.state = clueState(actual, value);
  clue.setAttribute('aria-label', `${label}: ${actual} de ${value} barracas`);
  const remaining = value - actual;
  const total = document.createElement('strong');
  total.textContent = value;
  const balance = document.createElement('span');
  balance.textContent = remaining > 0 ? `−${remaining}` : remaining === 0 ? '✓' : `+${Math.abs(remaining)}`;
  clue.append(total, balance);
  return clue;
}

function renderBoard() {
  const level = TENTS_LEVELS[currentLevel];
  const gameGrid = document.createElement('div');
  gameGrid.className = 'tents-grid';
  gameGrid.style.setProperty('--grid-size', level.size);
  gameGrid.setAttribute('role', 'grid');
  gameGrid.setAttribute('aria-label', `Tabuleiro Barracas, ${level.size} por ${level.size}`);

  for (let row = 0; row < level.size; row += 1) {
    for (let col = 0; col < level.size; col += 1) {
      const tree = isTree(level, row, col);
      if (tree) {
        const cell = document.createElement('div');
        cell.className = 'puzzle-cell tents-cell is-tree';
        cell.setAttribute('role', 'gridcell');
        cell.setAttribute('aria-label', `Árvore na linha ${row + 1}, coluna ${col + 1}`);
        cell.textContent = '♠';
        gameGrid.append(cell);
        continue;
      }

      const value = grid[row][col];
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'puzzle-cell tents-cell';
      button.dataset.state = value === 1 ? 'tent' : value === 2 ? 'blocked' : 'empty';
      button.dataset.gridRow = row;
      button.dataset.gridCol = col;
      button.setAttribute('role', 'gridcell');
      button.setAttribute(
        'aria-label',
        `Linha ${row + 1}, coluna ${col + 1}: ${value === 1 ? 'barraca' : value === 2 ? 'marcada como vazia' : 'vazia'}. Ative para alterar.`
      );
      button.textContent = value === 1 ? '▲' : value === 2 ? '×' : '';
      button.addEventListener('click', () => cycleCell(row, col));
      gameGrid.append(button);
    }

    const count = grid[row].filter(value => value === 1).length;
    gameGrid.append(makeClue(level.rowClues[row], count, `Linha ${row + 1}`));
  }

  for (let col = 0; col < level.size; col += 1) {
    const count = grid.reduce((total, row) => total + (row[col] === 1 ? 1 : 0), 0);
    gameGrid.append(makeClue(level.colClues[col], count, `Coluna ${col + 1}`));
  }
  const corner = document.createElement('div');
  corner.className = 'tents-clue-corner';
  gameGrid.append(corner);

  board.replaceChildren(gameGrid);
}

function check() {
  const result = validateTents(TENTS_LEVELS[currentLevel], grid);
  if (!result.valid) {
    const messages = {
      row: `Revise a linha ${result.index + 1}: ela precisa ter ${result.expected} barraca${result.expected === 1 ? '' : 's'}.`,
      column: `Revise a coluna ${result.index + 1}: ela precisa ter ${result.expected} barraca${result.expected === 1 ? '' : 's'}.`,
      touching: 'Há duas barracas encostadas. Elas também não podem se tocar na diagonal.',
      pairing: 'Cada barraca precisa formar um par exclusivo com uma árvore vizinha — e cada árvore precisa de uma barraca.',
      tree: 'Uma barraca não pode ocupar a mesma célula de uma árvore. Limpe o tabuleiro e tente novamente.',
      'invalid-grid': 'O tabuleiro salvo não é válido. Limpe o nível para recomeçar.'
    };
    showMessage(message, 'error', messages[result.code] || 'Ainda há algo para revisar.', { focus: true });
    return;
  }

  const wasComplete = isLevelComplete(GAME_ID, currentLevel);
  markLevelComplete(GAME_ID, currentLevel);
  celebrate(panel.querySelector('.play-surface'));
  const isLast = currentLevel === TENTS_LEVELS.length - 1;
  showMessage(
    message,
    'success',
    `${wasComplete ? 'Resolvido de novo' : 'Estratégia certa'}, ${playerCallout()}! ${isLast ? 'Você concluiu todas as clareiras de Barracas.' : 'O próximo nível foi liberado.'}`,
    { focus: true }
  );
  renderPicker();
  if (!isLast) scheduleAdvance(GAME_ID, () => setLevel(currentLevel + 1));
}

function reset() {
  cancelAdvance(GAME_ID);
  clearBoardState(GAME_ID, currentLevel);
  grid = blankGrid(TENTS_LEVELS[currentLevel].size);
  clearMessage(message);
  renderBoard();
  board.querySelector('button')?.focus();
}

function renderPicker() {
  renderLevelPicker(picker, {
    gameId: GAME_ID,
    levels: TENTS_LEVELS,
    current: currentLevel,
    onSelect: setLevel
  });
}

function render() {
  renderPicker();
  renderBoard();
}

board.addEventListener('keydown', event => moveGridFocus(event, board));
checkButton.addEventListener('click', check);
resetButton.addEventListener('click', reset);
setLevel(currentLevel);

export function refreshTents() {
  renderPicker();
}
