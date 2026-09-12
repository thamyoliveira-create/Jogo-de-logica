import { WORD_LEVELS } from '../puzzles.js';
import {
  cancelAdvance,
  celebrate,
  clearBoardState,
  clearMessage,
  getBoardState,
  getSelectedLevel,
  isLevelComplete,
  markLevelComplete,
  playerCallout,
  renderLevelPicker,
  saveBoardState,
  scheduleAdvance,
  setSelectedLevel,
  showMessage
} from '../core.js';
import { generateWordGrid } from '../rules.js';

const GAME_ID = 'words';
const panel = document.querySelector('#panel-words');
const picker = panel.querySelector('[data-level-picker]');
const board = panel.querySelector('[data-board]');
const list = panel.querySelector('[data-word-list]');
const counter = panel.querySelector('[data-word-counter]');
const message = panel.querySelector('[data-message]');
const resetButton = panel.querySelector('[data-action="reset"]');
let currentLevel = getSelectedLevel(GAME_ID);
let generated;
let found = [];
let startCell = null;
let previewPath = [];
let pointerSelecting = false;
let pointerMoved = false;

const pathKey = path => path.map(([row, col]) => `${row}:${col}`).join('|');

function linePath(start, end) {
  const rowDistance = end.row - start.row;
  const colDistance = end.col - start.col;
  if (!(rowDistance === 0 || colDistance === 0 || Math.abs(rowDistance) === Math.abs(colDistance))) return null;
  const steps = Math.max(Math.abs(rowDistance), Math.abs(colDistance));
  const rowStep = Math.sign(rowDistance);
  const colStep = Math.sign(colDistance);
  return Array.from({ length: steps + 1 }, (_, index) => [start.row + rowStep * index, start.col + colStep * index]);
}

function wordForPath(path) {
  const selection = pathKey(path);
  const reverse = pathKey([...path].reverse());
  return generated.placements.find(placement => {
    const candidate = pathKey(placement.path);
    return candidate === selection || candidate === reverse;
  });
}

function setLevel(index) {
  cancelAdvance(GAME_ID);
  currentLevel = index;
  setSelectedLevel(GAME_ID, index);
  generated = generateWordGrid(WORD_LEVELS[index]);
  const stored = getBoardState(GAME_ID, index);
  const available = new Set(generated.placements.map(placement => placement.word));
  found = Array.isArray(stored?.found) ? stored.found.filter(word => available.has(word)) : [];
  startCell = null;
  previewPath = [];
  pointerSelecting = false;
  pointerMoved = false;
  clearMessage(message);
  render();
}

function foundCellSet() {
  const cells = new Set();
  generated.placements
    .filter(placement => found.includes(placement.word))
    .forEach(placement => placement.path.forEach(([row, col]) => cells.add(`${row}:${col}`)));
  return cells;
}

function previewCellSet() {
  return new Set(previewPath.map(([row, col]) => `${row}:${col}`));
}

function updateSelection(end) {
  if (!startCell) return;
  previewPath = linePath(startCell, end) || [[startCell.row, startCell.col]];
  paintCells();
}

function commitSelection() {
  if (!startCell) return;
  const placement = wordForPath(previewPath);
  if (placement && !found.includes(placement.word)) {
    found.push(placement.word);
    saveBoardState(GAME_ID, currentLevel, { found });
    showMessage(message, 'info', `${placement.label} encontrada. Continue: faltam ${generated.placements.length - found.length}.`);
    if (found.length === generated.placements.length) completeLevel();
  } else if (placement) {
    showMessage(message, 'info', `${placement.label} já estava marcada.`);
  } else if (previewPath.length > 1) {
    showMessage(message, 'error', 'Essa linha não forma uma das palavras. Tente outra direção.');
  }
  startCell = null;
  previewPath = [];
  renderBoard();
  renderList();
}

function selectCell(row, col, { commit = true } = {}) {
  if (!startCell) {
    startCell = { row, col };
    previewPath = [[row, col]];
    showMessage(message, 'info', 'Início marcado. Agora escolha a última letra da palavra.');
    paintCells();
    return;
  }
  updateSelection({ row, col });
  if (commit) commitSelection();
}

function completeLevel() {
  const wasComplete = isLevelComplete(GAME_ID, currentLevel);
  markLevelComplete(GAME_ID, currentLevel);
  celebrate(panel.querySelector('.play-surface'));
  const isLast = currentLevel === WORD_LEVELS.length - 1;
  showMessage(
    message,
    'success',
    `${wasComplete ? 'Mapa resolvido novamente' : 'Olhar afiado'}, ${playerCallout()}! ${isLast ? 'Você encontrou todas as palavras da série.' : 'O próximo mapa foi liberado.'}`,
    { focus: true }
  );
  renderPicker();
  if (!isLast) scheduleAdvance(GAME_ID, () => setLevel(currentLevel + 1), 1700);
}

function paintCells() {
  const foundCells = foundCellSet();
  const previewCells = previewCellSet();
  board.querySelectorAll('.word-cell').forEach(cell => {
    const coordinate = `${cell.dataset.row}:${cell.dataset.col}`;
    cell.dataset.found = String(foundCells.has(coordinate));
    cell.dataset.preview = String(previewCells.has(coordinate));
    cell.setAttribute('aria-pressed', String(foundCells.has(coordinate)));
  });
}

function cellFromPoint(x, y) {
  const cell = document.elementFromPoint(x, y)?.closest('.word-cell');
  return cell && board.contains(cell) ? cell : null;
}

function renderBoard() {
  const level = WORD_LEVELS[currentLevel];
  const grid = document.createElement('div');
  grid.className = 'word-grid';
  grid.style.setProperty('--word-size', level.size);
  grid.setAttribute('role', 'grid');
  grid.setAttribute('aria-label', `Caça-palavras ${level.title}, ${level.size} por ${level.size}`);

  generated.grid.forEach((row, rowIndex) => {
    row.forEach((letter, colIndex) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'word-cell';
      button.dataset.row = rowIndex;
      button.dataset.col = colIndex;
      button.dataset.gridRow = rowIndex;
      button.dataset.gridCol = colIndex;
      button.setAttribute('role', 'gridcell');
      button.setAttribute('aria-label', `${letter}, linha ${rowIndex + 1}, coluna ${colIndex + 1}`);
      button.textContent = letter;
      button.addEventListener('click', () => {
        // Keyboard activation does not fire pointerdown, so the click completes the two-step selection.
        if (!pointerSelecting) selectCell(rowIndex, colIndex);
      });
      button.addEventListener('pointerdown', event => {
        if (event.pointerType === 'mouse' && event.button !== 0) return;
        pointerSelecting = true;
        pointerMoved = false;
        if (!startCell) {
          startCell = { row: rowIndex, col: colIndex };
          previewPath = [[rowIndex, colIndex]];
        } else {
          updateSelection({ row: rowIndex, col: colIndex });
        }
        paintCells();
      });
      grid.append(button);
    });
  });
  board.replaceChildren(grid);
  paintCells();
}

function renderList() {
  list.replaceChildren();
  generated.placements.forEach(placement => {
    const item = document.createElement('li');
    const complete = found.includes(placement.word);
    item.dataset.found = String(complete);
    const marker = document.createElement('span');
    marker.setAttribute('aria-hidden', 'true');
    marker.textContent = complete ? '✓' : '○';
    const word = document.createElement('span');
    word.textContent = placement.label;
    item.append(marker, word);
    list.append(item);
  });
  counter.textContent = `${found.length}/${generated.placements.length} encontradas`;
}

function renderPicker() {
  renderLevelPicker(picker, {
    gameId: GAME_ID,
    levels: WORD_LEVELS,
    current: currentLevel,
    onSelect: setLevel
  });
}

function render() {
  renderPicker();
  renderBoard();
  renderList();
}

function reset() {
  cancelAdvance(GAME_ID);
  clearBoardState(GAME_ID, currentLevel);
  found = [];
  startCell = null;
  previewPath = [];
  pointerSelecting = false;
  pointerMoved = false;
  clearMessage(message);
  renderBoard();
  renderList();
  board.querySelector('button')?.focus();
}

document.addEventListener('pointermove', event => {
  if (!pointerSelecting || !startCell || panel.hidden) return;
  const cell = cellFromPoint(event.clientX, event.clientY);
  if (cell) {
    if (Number(cell.dataset.row) !== startCell.row || Number(cell.dataset.col) !== startCell.col) pointerMoved = true;
    updateSelection({ row: Number(cell.dataset.row), col: Number(cell.dataset.col) });
  }
});

document.addEventListener('pointerup', event => {
  if (!pointerSelecting || panel.hidden) return;
  const cell = cellFromPoint(event.clientX, event.clientY);
  if (pointerMoved && previewPath.length > 1) {
    commitSelection();
  } else if (cell) {
    if (previewPath.length > 1) commitSelection();
    else showMessage(message, 'info', 'Início marcado. Agora escolha a última letra da palavra.');
  }
  pointerMoved = false;
  window.setTimeout(() => { pointerSelecting = false; }, 0);
});

board.addEventListener('keydown', event => {
  const directions = { ArrowLeft: [0, -1], ArrowRight: [0, 1], ArrowUp: [-1, 0], ArrowDown: [1, 0] };
  const direction = directions[event.key];
  const current = event.target.closest('.word-cell');
  if (!direction || !current) return;
  event.preventDefault();
  const level = WORD_LEVELS[currentLevel];
  const nextRow = Math.max(0, Math.min(level.size - 1, Number(current.dataset.row) + direction[0]));
  const nextCol = Math.max(0, Math.min(level.size - 1, Number(current.dataset.col) + direction[1]));
  board.querySelector(`[data-row="${nextRow}"][data-col="${nextCol}"]`)?.focus();
});

resetButton.addEventListener('click', reset);
setLevel(currentLevel);

export function refreshWordSearch() {
  renderPicker();
}
