import { FUTOSHIKI_LEVELS } from '../puzzles.js';
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
import { futoshikiConflicts, validateFutoshiki } from '../rules.js';

const GAME_ID = 'futoshiki';
const panel = document.querySelector('#panel-futoshiki');
const picker = panel.querySelector('[data-level-picker]');
const board = panel.querySelector('[data-board]');
const palette = panel.querySelector('[data-number-palette]');
const message = panel.querySelector('[data-message]');
const checkButton = panel.querySelector('[data-action="check"]');
const resetButton = panel.querySelector('[data-action="reset"]');
let currentLevel = getSelectedLevel(GAME_ID);
let grid = [];
let selectedNumber = 1;

function givenAt(level, row, col) {
  return level.givens.find(given => given.row === row && given.col === col);
}

function initialGrid(level) {
  const next = Array.from({ length: level.size }, () => Array(level.size).fill(0));
  level.givens.forEach(given => { next[given.row][given.col] = given.value; });
  return next;
}

function validStoredGrid(level, value) {
  if (!Array.isArray(value) || value.length !== level.size) return false;
  return value.every((row, rowIndex) => Array.isArray(row)
    && row.length === level.size
    && row.every((cell, colIndex) => {
      const given = givenAt(level, rowIndex, colIndex);
      return Number.isInteger(cell) && cell >= 0 && cell <= level.size && (!given || cell === given.value);
    }));
}

function setLevel(index) {
  cancelAdvance(GAME_ID);
  currentLevel = index;
  setSelectedLevel(GAME_ID, index);
  const level = FUTOSHIKI_LEVELS[index];
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
  renderPalette();
  board.querySelector(`[data-grid-row="${row}"][data-grid-col="${col}"]`)?.focus();
}

function constraintAt(level, first, second) {
  return level.constraints.find(constraint => (
    constraint.a[0] === first[0] && constraint.a[1] === first[1]
    && constraint.b[0] === second[0] && constraint.b[1] === second[1]
  ));
}

function verticalSymbol(relation) {
  // “<” means the upper cell is smaller, so the narrow point faces upward.
  return relation === '<' ? '⌃' : '⌄';
}

function renderBoard() {
  const level = FUTOSHIKI_LEVELS[currentLevel];
  const conflicts = futoshikiConflicts(level, grid);
  const table = document.createElement('div');
  table.className = 'numeric-grid futoshiki-grid';
  table.style.setProperty('--numeric-size', level.size);
  table.setAttribute('role', 'grid');
  table.setAttribute('aria-label', `Grade Davi e Golias, números de 1 a ${level.size}`);

  for (let row = 0; row < level.size; row += 1) {
    for (let col = 0; col < level.size; col += 1) {
      const given = givenAt(level, row, col);
      const cell = document.createElement(given ? 'div' : 'button');
      if (!given) cell.type = 'button';
      cell.className = 'number-cell';
      cell.dataset.gridRow = row;
      cell.dataset.gridCol = col;
      cell.dataset.given = String(Boolean(given));
      cell.dataset.conflict = String(conflicts.has(`${row}:${col}`));
      cell.setAttribute('role', 'gridcell');
      if (conflicts.has(`${row}:${col}`)) cell.setAttribute('aria-invalid', 'true');
      const value = grid[row][col];
      cell.textContent = value || '';
      cell.setAttribute(
        'aria-label',
        `${given ? 'Número fixo' : 'Célula'}, linha ${row + 1}, coluna ${col + 1}: ${value || 'vazia'}${!given ? `. Número selecionado: ${selectedNumber}` : ''}`
      );
      if (!given) cell.addEventListener('click', () => setCell(row, col, selectedNumber));
      table.append(cell);

      if (col < level.size - 1) {
        const gap = document.createElement('span');
        gap.className = 'inequality horizontal';
        gap.setAttribute('aria-hidden', 'true');
        const constraint = constraintAt(level, [row, col], [row, col + 1]);
        gap.textContent = constraint?.relation || '';
        table.append(gap);
      }
    }

    if (row < level.size - 1) {
      for (let col = 0; col < level.size; col += 1) {
        const gap = document.createElement('span');
        gap.className = 'inequality vertical';
        gap.setAttribute('aria-hidden', 'true');
        const constraint = constraintAt(level, [row, col], [row + 1, col]);
        gap.textContent = constraint ? verticalSymbol(constraint.relation) : '';
        table.append(gap);
        if (col < level.size - 1) {
          const spacer = document.createElement('span');
          spacer.className = 'inequality-spacer';
          table.append(spacer);
        }
      }
    }
  }
  board.replaceChildren(table);
}

function renderPalette() {
  const level = FUTOSHIKI_LEVELS[currentLevel];
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
  const result = validateFutoshiki(FUTOSHIKI_LEVELS[currentLevel], grid);
  if (!result.valid) {
    showMessage(
      message,
      'error',
      result.code === 'incomplete'
        ? 'Ainda há espaços vazios. Preencha todas as células antes de conferir.'
        : 'Há números repetidos ou uma comparação invertida. As células destacadas mostram onde revisar.',
      { focus: true }
    );
    renderBoard();
    return;
  }

  const wasComplete = isLevelComplete(GAME_ID, currentLevel);
  markLevelComplete(GAME_ID, currentLevel);
  celebrate(panel.querySelector('.play-surface'));
  const isLast = currentLevel === FUTOSHIKI_LEVELS.length - 1;
  showMessage(
    message,
    'success',
    `${wasComplete ? 'Comparações dominadas novamente' : 'Maior, menor, tudo certo'}, ${playerCallout()}! ${isLast ? 'Você venceu toda a série Davi e Golias.' : 'O próximo nível foi liberado.'}`,
    { focus: true }
  );
  renderPicker();
  if (!isLast) scheduleAdvance(GAME_ID, () => setLevel(currentLevel + 1));
}

function reset() {
  cancelAdvance(GAME_ID);
  clearBoardState(GAME_ID, currentLevel);
  grid = initialGrid(FUTOSHIKI_LEVELS[currentLevel]);
  clearMessage(message);
  renderBoard();
  board.querySelector('button')?.focus();
}

function renderPicker() {
  renderLevelPicker(picker, {
    gameId: GAME_ID,
    levels: FUTOSHIKI_LEVELS,
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
  if (/^[1-5]$/.test(event.key) && Number(event.key) <= FUTOSHIKI_LEVELS[currentLevel].size) {
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

export function refreshFutoshiki() {
  renderPicker();
}
