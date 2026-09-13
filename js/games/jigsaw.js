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
let dragState = null;
let suppressPieceClick = false;

function clearDragPreview() {
  board?.querySelectorAll('.is-preview-valid, .is-preview-invalid').forEach(cell => {
    cell.classList.remove('is-preview-valid', 'is-preview-invalid');
  });
}

function cancelDrag() {
  dragState?.ghost?.remove();
  dragState?.source?.classList.remove('is-dragging');
  clearDragPreview();
  dragState = null;
}

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
  cancelDrag();
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
  cancelDrag();
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

function placePiece(pieceId, row, col, rotation) {
  const level = JIGSAW_LEVELS[currentLevel];
  if (!pieceId) {
    showMessage(message, 'info', 'Escolha uma peça na bandeja para começar.', { focus: false });
    return false;
  }

  const placement = { row, col, rotation };
  if (!jigsawPlacementFits(level, placements, pieceId, placement)) {
    showMessage(message, 'error', 'Essa peça não cabe aí. Tente outro ponto ou gire a peça.', { focus: false });
    return false;
  }

  placements[pieceId] = placement;
  selectedPieceId = firstUnplacedPiece(level);
  selectedRotation = 0;
  save();
  if (message) clearMessage(message);
  render();
  if (Object.keys(placements).length === level.pieces.length) check();
  return true;
}

function placeSelected(row, col) {
  placePiece(selectedPieceId, row, col, selectedRotation);
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

function createDragGhost(piece, rotation) {
  const cells = rotateJigsawCells(piece.cells, rotation);
  const rows = Math.max(...cells.map(([row]) => row)) + 1;
  const cols = Math.max(...cells.map(([, col]) => col)) + 1;
  const cellSize = board?.querySelector('.jigsaw-cell')?.getBoundingClientRect().width || 48;
  const ghost = document.createElement('div');
  ghost.className = 'jigsaw-drag-ghost';
  ghost.style.setProperty('--jigsaw-drag-cell', `${cellSize}px`);
  ghost.style.gridTemplateRows = `repeat(${rows}, var(--jigsaw-drag-cell))`;
  ghost.style.gridTemplateColumns = `repeat(${cols}, var(--jigsaw-drag-cell))`;
  cells.forEach(([row, col]) => {
    const block = document.createElement('i');
    block.className = `jigsaw-drag-block color-${piece.color}`;
    block.style.gridRow = String(row + 1);
    block.style.gridColumn = String(col + 1);
    ghost.append(block);
  });
  document.body.append(ghost);
  return ghost;
}

function startPieceDrag(event, piece) {
  if (event.button !== 0 || placements[piece.id]) return;
  event.preventDefault();
  if (selectedPieceId !== piece.id) {
    selectedPieceId = piece.id;
    selectedRotation = 0;
  }
  dragState = {
    pieceId: piece.id,
    rotation: selectedRotation,
    startX: event.clientX,
    startY: event.clientY,
    dragging: false,
    source: event.currentTarget,
    ghost: null,
    target: null,
    valid: false
  };
}

function previewDragAt(clientX, clientY) {
  if (!dragState?.ghost) return;
  const cellSize = Number.parseFloat(dragState.ghost.style.getPropertyValue('--jigsaw-drag-cell')) || 48;
  dragState.ghost.style.left = `${clientX - cellSize / 2}px`;
  dragState.ghost.style.top = `${clientY - cellSize / 2}px`;
  clearDragPreview();

  const targetCell = document.elementFromPoint(clientX, clientY)?.closest('.jigsaw-cell');
  if (!targetCell || !board?.contains(targetCell)) {
    dragState.target = null;
    dragState.valid = false;
    return;
  }

  const row = Number(targetCell.dataset.row);
  const col = Number(targetCell.dataset.col);
  const level = JIGSAW_LEVELS[currentLevel];
  const piece = level.pieces.find(candidate => candidate.id === dragState.pieceId);
  const placement = { row, col, rotation: dragState.rotation };
  const valid = jigsawPlacementFits(level, placements, piece.id, placement);
  const previewClass = valid ? 'is-preview-valid' : 'is-preview-invalid';
  jigsawCellsForPlacement(piece, placement).forEach(([targetRow, targetCol]) => {
    board.querySelector(`[data-row="${targetRow}"][data-col="${targetCol}"]`)?.classList.add(previewClass);
  });
  dragState.target = { row, col };
  dragState.valid = valid;
}

function movePieceDrag(event) {
  if (!dragState) return;
  const distance = Math.hypot(event.clientX - dragState.startX, event.clientY - dragState.startY);
  if (!dragState.dragging && distance > 6) {
    const level = JIGSAW_LEVELS[currentLevel];
    const piece = level.pieces.find(candidate => candidate.id === dragState.pieceId);
    dragState.dragging = true;
    dragState.ghost = createDragGhost(piece, dragState.rotation);
    dragState.source?.classList.add('is-dragging');
  }
  if (dragState.dragging) previewDragAt(event.clientX, event.clientY);
}

function finishPieceDrag() {
  if (!dragState) return;
  const completedDrag = dragState.dragging;
  const pieceId = dragState.pieceId;
  const rotation = dragState.rotation;
  const target = dragState.target;
  const valid = dragState.valid;
  cancelDrag();

  suppressPieceClick = true;
  window.setTimeout(() => { suppressPieceClick = false; }, 0);
  if (completedDrag && valid && target) {
    placePiece(pieceId, target.row, target.col, rotation);
  } else {
    selectedPieceId = pieceId;
    selectedRotation = rotation;
    render();
  }
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
    button.addEventListener('pointerdown', event => startPieceDrag(event, piece));
    button.addEventListener('click', event => {
      if (suppressPieceClick) {
        event.preventDefault();
        return;
      }
      choosePiece(piece.id);
    });
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
      cell.dataset.row = String(row);
      cell.dataset.col = String(col);
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
document.addEventListener('pointermove', movePieceDrag);
document.addEventListener('pointerup', finishPieceDrag);
document.addEventListener('pointercancel', cancelDrag);

if (panel) setLevel(currentLevel);
