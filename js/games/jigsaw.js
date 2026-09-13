import { JIGSAW_LEVELS } from '../puzzles.js';
import {
  cancelAdvance,
  celebrate,
  clearBoardState,
  clearMessage,
  getBoardState,
  getSelectedLevel,
  markLevelComplete,
  playerCallout,
  renderLevelPicker,
  saveBoardState,
  scheduleAdvance,
  setSelectedLevel,
  showMessage
} from '../core.js';
import {
  jigsawCellsForPlacement,
  jigsawPlacementFits,
  rotateJigsawCells,
  validateJigsaw
} from '../rules.js';

const GAME_ID = 'jigsaw';
const panel = document.querySelector('#panel-jigsaw');
const picker = panel?.querySelector('[data-level-picker]');
const board = panel?.querySelector('[data-board]');
const pieceBank = panel?.querySelector('[data-piece-bank]');
const message = panel?.querySelector('[data-message]');
const rotateButton = panel?.querySelector('[data-action="rotate"]');
const checkButton = panel?.querySelector('[data-action="check"]');
const resetButton = panel?.querySelector('[data-action="reset"]');

let currentLevel = getSelectedLevel(GAME_ID);
let placements = {};
let selectedPieceId = null;
let selectedRotation = 0;

function validStoredState(stored, level) {
  if (!stored || typeof stored !== 'object' || Array.isArray(stored)) return false;
  return Object.entries(stored).every(([pieceId, placement]) => (
    level.pieces.some(piece => piece.id === pieceId)
      && Number.isInteger(placement?.row)
      && Number.isInteger(placement?.col)
      && Number.isInteger(placement?.rotation)
  ));
}

function firstUnplacedPiece(level) {
  return level.pieces.find(piece => !placements[piece.id])?.id || null;
}

function setLevel(index) {
  cancelAdvance(GAME_ID);
  currentLevel = index;
  setSelectedLevel(GAME_ID, index);
  const level = JIGSAW_LEVELS[currentLevel];
  const stored = getBoardState(GAME_ID, index);
  placements = validStoredState(stored, level) ? { ...stored } : {};
  selectedPieceId = firstUnplacedPiece(level);
  selectedRotation = 0;
  if (message) clearMessage(message);
  render();
}

function save() {
  saveBoardState(GAME_ID, currentLevel, placements);
}

function reset() {
  cancelAdvance(GAME_ID);
  placements = {};
  selectedPieceId = JIGSAW_LEVELS[currentLevel].pieces[0].id;
  selectedRotation = 0;
  clearBoardState(GAME_ID, currentLevel);
  if (message) clearMessage(message);
  render();
}

function choosePiece(pieceId) {
  if (placements[pieceId]) delete placements[pieceId];
  selectedPieceId = pieceId;
  selectedRotation = 0;
  save();
  if (message) clearMessage(message);
  render();
}

function rotateSelected() {
  if (!selectedPieceId) {
    showMessage(message, 'info', 'Escolha uma peça antes de girar.', { focus: false });
    return;
  }
  selectedRotation = (selectedRotation + 1) % 4;
  if (message) clearMessage(message);
  render();
}

function placeSelected(row, col) {
  const level = JIGSAW_LEVELS[currentLevel];
  if (!selectedPieceId) {
    showMessage(message, 'info', 'Escolha uma peça na bandeja para começar.', { focus: false });
    return;
  }

  const placement = { row, col, rotation: selectedRotation };
  if (!jigsawPlacementFits(level, placements, selectedPieceId, placement)) {
    showMessage(message, 'error', 'Essa peça não cabe aí. Tente outro ponto ou gire a peça.', { focus: false });
    return;
  }

  placements[selectedPieceId] = placement;
  selectedPieceId = firstUnplacedPiece(level);
  selectedRotation = 0;
  save();
  if (message) clearMessage(message);
  render();
}

function removePlacedPiece(pieceId) {
  delete placements[pieceId];
  selectedPieceId = pieceId;
  selectedRotation = 0;
  save();
  if (message) clearMessage(message);
  render();
}

function check() {
  const level = JIGSAW_LEVELS[currentLevel];
  const result = validateJigsaw(level, placements);
  if (!result.valid) {
    showMessage(message, 'error', `⚠️ ${result.reason}`, { focus: true });
    return;
  }

  markLevelComplete(GAME_ID, currentLevel);
  showMessage(message, 'success', `🎉 Perfeito, ${playerCallout()}! Todas as peças se encaixaram sem deixar espaços.`, { focus: true });
  celebrate(board);
  if (currentLevel < JIGSAW_LEVELS.length - 1) {
    scheduleAdvance(GAME_ID, () => setLevel(currentLevel + 1));
  }
  render();
}

function createPiecePreview(piece, rotation) {
  const cells = rotateJigsawCells(piece.cells, rotation);
  const rows = Math.max(...cells.map(([row]) => row)) + 1;
  const cols = Math.max(...cells.map(([, col]) => col)) + 1;
  const preview = document.createElement('span');
  preview.className = 'jigsaw-piece-preview';
  preview.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
  preview.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
  cells.forEach(([row, col]) => {
    const block = document.createElement('i');
    block.className = `jigsaw-block color-${piece.color}`;
    block.style.gridRow = String(row + 1);
    block.style.gridColumn = String(col + 1);
    preview.append(block);
  });
  return preview;
}

function renderPieceBank(level) {
  pieceBank.replaceChildren();
  level.pieces.forEach(piece => {
    const placed = Boolean(placements[piece.id]);
    const selected = selectedPieceId === piece.id;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `jigsaw-piece-button${selected ? ' is-selected' : ''}${placed ? ' is-placed' : ''}`;
    button.setAttribute('aria-pressed', String(selected));
    button.setAttribute('aria-label', placed ? `${piece.label}, encaixada. Clique para retirar` : `Selecionar ${piece.label}`);
    button.append(createPiecePreview(piece, selected ? selectedRotation : 0));
    const label = document.createElement('span');
    label.textContent = placed ? 'Encaixada ✓' : piece.label;
    button.append(label);
    button.addEventListener('click', () => choosePiece(piece.id));
    pieceBank.append(button);
  });
}

function renderBoard(level) {
  board.replaceChildren();
  const grid = document.createElement('div');
  grid.className = 'jigsaw-grid';
  grid.style.gridTemplateColumns = `repeat(${level.cols}, var(--jigsaw-cell))`;
  const occupied = new Map();

  Object.entries(placements).forEach(([pieceId, placement]) => {
    const piece = level.pieces.find(candidate => candidate.id === pieceId);
    if (!piece) return;
    jigsawCellsForPlacement(piece, placement).forEach(([row, col]) => {
      occupied.set(`${row},${col}`, piece);
    });
  });

  for (let row = 0; row < level.rows; row += 1) {
    for (let col = 0; col < level.cols; col += 1) {
      const piece = occupied.get(`${row},${col}`);
      const cell = document.createElement('button');
      cell.type = 'button';
      cell.className = `jigsaw-cell${piece ? ` is-filled color-${piece.color}` : ''}`;
      cell.setAttribute('aria-label', piece
        ? `Linha ${row + 1}, coluna ${col + 1}: ${piece.label}. Clique para retirar a peça`
        : `Linha ${row + 1}, coluna ${col + 1}: espaço vazio`);
      if (piece) cell.addEventListener('click', () => removePlacedPiece(piece.id));
      else cell.addEventListener('click', () => placeSelected(row, col));
      grid.append(cell);
    }
  }
  board.append(grid);
}

function render() {
  if (!panel || !board || !pieceBank) return;
  const level = JIGSAW_LEVELS[currentLevel];
  renderLevelPicker(picker, {
    gameId: GAME_ID,
    levels: JIGSAW_LEVELS,
    current: currentLevel,
    onSelect: setLevel
  });
  renderPieceBank(level);
  renderBoard(level);
  rotateButton.disabled = !selectedPieceId;
}

export function refreshJigsaw() {
  setLevel(getSelectedLevel(GAME_ID));
}

rotateButton?.addEventListener('click', rotateSelected);
checkButton?.addEventListener('click', check);
resetButton?.addEventListener('click', reset);

if (panel) setLevel(currentLevel);
