import { KENKEN_LEVELS } from '../puzzles.js';
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
import { kenkenConflicts, validateKenKen } from '../rules.js';

const GAME_ID = 'kenken';
const panel = document.querySelector('#panel-kenken');
const picker = panel.querySelector('[data-level-picker]');
const board = panel.querySelector('[data-board]');
const palette = panel.querySelector('[data-number-palette]');
const message = panel.querySelector('[data-message]');
const checkButton = panel.querySelector('[data-action="check"]');
const resetButton = panel.querySelector('[data-action="reset"]');
let currentLevel = getSelectedLevel(GAME_ID);
let grid = [];
let selectedNumber = 1;

function cageAt(level, row, col) {
  return level.cages.find(cage => cage.cells.some(([cellRow, cellCol]) => cellRow === row && cellCol === col));
}

function cageAnchor(cage) {
  return [...cage.cells].sort((a, b) => a[0] - b[0] || a[1] - b[1])[0];
}

function initialGrid(level) {
  const next = Array.from({ length: level.size }, () => Array(level.size).fill(0));
  level.cages.filter(cage => cage.operation === null).forEach(cage => {
    const [row, col] = cage.cells[0];
    next[row][col] = cage.target;
  });
  return next;
}

function validStoredGrid(level, value) {
  if (!Array.isArray(value) || value.length !== level.size) return false;
  return value.every((row, rowIndex) => Array.isArray(row)
    && row.length === level.size
    && row.every((cell, colIndex) => {
      const cage = cageAt(level, rowIndex, colIndex);
      const fixed = cage.operation === null;
      return Number.isInteger(cell) && cell >= 0 && cell <= level.size && (!fixed || cell === cage.target);
    }));
}

function setLevel(index) {
  cancelAdvance(GAME_ID);
  currentLevel = index;
  setSelectedLevel(GAME_ID, index);
  const level = KENKEN_LEVELS[index];
  const stored = getBoardState(GAME_ID, index);
  grid = validStoredGrid(level, stored?.grid) ? stored.grid : initialGrid(level);
  selectedNumber = Math.min(selectedNumber, level.size);
  clearMessage(message);
  render();
}

function setCell(row, col, value) {
  grid[row][col] = grid[row][col] === value ? 0 : value;
  saveBoardState(GAME_ID, currentLevel, { grid });
  clearMessage(message);
  renderBoard();
  board.querySelector(`[data-grid-row="${row}"][data-grid-col="${col}"]`)?.focus();
}

function renderBoard() {
  const level = KENKEN_LEVELS[currentLevel];
  const conflicts = kenkenConflicts(level, grid);
  const gameGrid = document.createElement('div');
  gameGrid.className = 'kenken-grid';
  gameGrid.style.setProperty('--kenken-size', level.size);
  gameGrid.setAttribute('role', 'grid');
  gameGrid.setAttribute('aria-label', `Grade KenKen, números de 1 a ${level.size}`);

  for (let row = 0; row < level.size; row += 1) {
    for (let col = 0; col < level.size; col += 1) {
      const cage = cageAt(level, row, col);
      const [anchorRow, anchorCol] = cageAnchor(cage);
      const fixed = cage.operation === null;
      const cell = document.createElement(fixed ? 'div' : 'button');
      if (!fixed) cell.type = 'button';
      cell.className = 'number-cell kenken-cell';
      cell.dataset.gridRow = row;
      cell.dataset.gridCol = col;
      cell.dataset.given = String(fixed);
      cell.dataset.conflict = String(conflicts.has(`${row}:${col}`));
      if (conflicts.has(`${row}:${col}`)) cell.setAttribute('aria-invalid', 'true');
      cell.setAttribute('role', 'gridcell');

      const sameAbove = row > 0 && cageAt(level, row - 1, col) === cage;
      const sameBelow = row < level.size - 1 && cageAt(level, row + 1, col) === cage;
      const sameLeft = col > 0 && cageAt(level, row, col - 1) === cage;
      const sameRight = col < level.size - 1 && cageAt(level, row, col + 1) === cage;
      cell.dataset.borderTop = String(!sameAbove);
      cell.dataset.borderBottom = String(!sameBelow);
      cell.dataset.borderLeft = String(!sameLeft);
      cell.dataset.borderRight = String(!sameRight);

      if (row === anchorRow && col === anchorCol && !fixed) {
        const label = document.createElement('span');
        label.className = 'cage-label';
        label.textContent = `${cage.target}${cage.operation}`;
        label.setAttribute('aria-hidden', 'true');
        cell.append(label);
      }
      const value = document.createElement('strong');
      value.className = 'number-value';
      value.textContent = grid[row][col] || '';
      cell.append(value);
      cell.setAttribute(
        'aria-label',
        `${fixed ? 'Número fixo' : 'Célula'}, linha ${row + 1}, coluna ${col + 1}: ${grid[row][col] || 'vazia'}. Região ${cage.target}${cage.operation || ''}${!fixed ? `. Número selecionado: ${selectedNumber}` : ''}`
      );
      if (!fixed) cell.addEventListener('click', () => setCell(row, col, selectedNumber));
      gameGrid.append(cell);
    }
  }
  board.replaceChildren(gameGrid);
}

function renderPalette() {
  const level = KENKEN_LEVELS[currentLevel];
  palette.replaceChildren();
  for (let number = 1; number <= level.size; number += 1) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'number-choice';
    button.textContent = number;
    button.setAttribute('aria-pressed', String(selectedNumber === number));
    button.setAttribute('aria-label', `Usar número ${number}`);
    button.addEventListener('click', () => {
      selectedNumber = number;
      renderPalette();
    });
    palette.append(button);
  }
}

function check() {
  const result = validateKenKen(KENKEN_LEVELS[currentLevel], grid);
  if (!result.valid) {
    showMessage(
      message,
      'error',
      result.code === 'incomplete'
        ? 'Ainda há espaços vazios. Complete a grade antes de conferir.'
        : 'Há repetição em uma linha ou coluna, ou uma região não fecha a conta. Revise as células destacadas.',
      { focus: true }
    );
    renderBoard();
    return;
  }

  const wasComplete = isLevelComplete(GAME_ID, currentLevel);
  markLevelComplete(GAME_ID, currentLevel);
  celebrate(panel.querySelector('.play-surface'));
  const isLast = currentLevel === KENKEN_LEVELS.length - 1;
  showMessage(
    message,
    'success',
    `${wasComplete ? 'Grade resolvida novamente' : 'Contas fechadas'}, ${playerCallout()}! ${isLast ? 'Você concluiu toda a série KenKen.' : 'O próximo desafio foi liberado.'}`,
    { focus: true }
  );
  renderPicker();
  if (!isLast) scheduleAdvance(GAME_ID, () => setLevel(currentLevel + 1));
}

function reset() {
  cancelAdvance(GAME_ID);
  clearBoardState(GAME_ID, currentLevel);
  grid = initialGrid(KENKEN_LEVELS[currentLevel]);
  clearMessage(message);
  renderBoard();
  board.querySelector('button')?.focus();
}

function renderPicker() {
  renderLevelPicker(picker, {
    gameId: GAME_ID,
    levels: KENKEN_LEVELS,
    current: currentLevel,
    onSelect: setLevel
  });
}

function render() {
  renderPicker();
  renderBoard();
  renderPalette();
}

board.addEventListener('keydown', event => {
  const target = event.target.closest('.number-cell');
  if (!target) return;
  if (/^[1-4]$/.test(event.key)) {
    event.preventDefault();
    selectedNumber = Number(event.key);
    setCell(Number(target.dataset.gridRow), Number(target.dataset.gridCol), selectedNumber);
    return;
  }
  if (event.key === 'Backspace' || event.key === 'Delete' || event.key === '0') {
    event.preventDefault();
    const row = Number(target.dataset.gridRow);
    const col = Number(target.dataset.gridCol);
    grid[row][col] = 0;
    saveBoardState(GAME_ID, currentLevel, { grid });
    renderBoard();
    board.querySelector(`[data-grid-row="${row}"][data-grid-col="${col}"]`)?.focus();
    return;
  }
  moveGridFocus(event, board);
});

checkButton.addEventListener('click', check);
resetButton.addEventListener('click', reset);
setLevel(currentLevel);

export function refreshKenKen() {
  renderPicker();
}
