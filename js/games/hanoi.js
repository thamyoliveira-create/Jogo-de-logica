import { HANOI_LEVELS } from '../puzzles.js';
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
import { isHanoiComplete, validateHanoiMove } from '../rules.js';

const GAME_ID = 'hanoi';
const panel = document.querySelector('#panel-hanoi');
const picker = panel.querySelector('[data-level-picker]');
const board = panel.querySelector('[data-board]');
const message = panel.querySelector('[data-message]');
const undoButton = panel.querySelector('[data-action="undo"]');
const resetButton = panel.querySelector('[data-action="reset"]');
const movesCounter = panel.querySelector('[data-hanoi-moves]');

let currentLevel = getSelectedLevel(GAME_ID);
let gameState = null;
let selectedPeg = null;

function initialHanoiState(level) {
  const discs = Array.from({ length: level.discs }, (_, i) => level.discs - i);
  return {
    pegs: {
      A: [...discs],
      B: [],
      C: []
    },
    moves: 0,
    history: []
  };
}

function validStoredState(level, stored) {
  if (!stored || typeof stored !== 'object' || !stored.pegs) return false;
  const { A, B, C } = stored.pegs;
  if (!Array.isArray(A) || !Array.isArray(B) || !Array.isArray(C)) return false;
  const allDiscs = [...A, ...B, ...C].sort((a, b) => a - b);
  if (allDiscs.length !== level.discs) return false;
  for (let i = 0; i < level.discs; i += 1) {
    if (allDiscs[i] !== i + 1) return false;
  }
  return true;
}

function setLevel(index) {
  cancelAdvance(GAME_ID);
  currentLevel = index;
  selectedPeg = null;
  setSelectedLevel(GAME_ID, index);
  const level = HANOI_LEVELS[index];
  const stored = getBoardState(GAME_ID, index);
  gameState = validStoredState(level, stored) ? stored : initialHanoiState(level);
  clearMessage(message);
  render();
}

function pushHistory() {
  gameState.history = gameState.history || [];
  gameState.history.push(JSON.stringify({
    pegs: {
      A: [...gameState.pegs.A],
      B: [...gameState.pegs.B],
      C: [...gameState.pegs.C]
    },
    moves: gameState.moves
  }));
  if (gameState.history.length > 50) gameState.history.shift();
}

function handlePegClick(pegKey) {
  const level = HANOI_LEVELS[currentLevel];
  clearMessage(message);

  if (selectedPeg === null) {
    if (gameState.pegs[pegKey].length === 0) {
      showMessage(message, 'alert', `A haste ${pegKey} está vazia. Selecione uma haste que contenha discos!`);
      return;
    }
    selectedPeg = pegKey;
    render();
    return;
  }

  if (selectedPeg === pegKey) {
    selectedPeg = null;
    render();
    return;
  }

  // Attempt move
  const validation = validateHanoiMove(gameState.pegs, selectedPeg, pegKey);
  if (!validation.valid) {
    showMessage(message, 'error', `⚠️ ${validation.reason}`, { focus: true });
    selectedPeg = null;
    render();
    return;
  }

  pushHistory();
  const disc = gameState.pegs[selectedPeg].pop();
  gameState.pegs[pegKey].push(disc);
  gameState.moves += 1;
  selectedPeg = null;

  if (isHanoiComplete(level, gameState.pegs)) {
    markLevelComplete(GAME_ID, currentLevel);
    const optText = gameState.moves === level.minMoves
      ? '🎯 Incrível! Você resolveu com a quantidade MÍNIMA matematicamente perfeita de movimentos!'
      : `Muito bem! Você completou em ${gameState.moves} movimentos (o ideal matemático era ${level.minMoves}).`;
    showMessage(message, 'success', `🎉 Parabéns, ${playerCallout()}! Você transferiu toda a Torre de Hanói com sucesso! ${optText}`, { focus: true });
    celebrate(board);
    if (currentLevel < HANOI_LEVELS.length - 1) {
      scheduleAdvance(GAME_ID, () => setLevel(currentLevel + 1));
    }
  }

  saveBoardState(GAME_ID, currentLevel, gameState);
  render();
}

function handleUndo() {
  if (!gameState.history || gameState.history.length === 0) return;
  const previous = JSON.parse(gameState.history.pop());
  gameState.pegs = previous.pegs;
  gameState.moves = previous.moves;
  selectedPeg = null;
  clearMessage(message);
  saveBoardState(GAME_ID, currentLevel, gameState);
  render();
}

function handleReset() {
  cancelAdvance(GAME_ID);
  const level = HANOI_LEVELS[currentLevel];
  gameState = initialHanoiState(level);
  selectedPeg = null;
  clearBoardState(GAME_ID, currentLevel);
  clearMessage(message);
  render();
}

const DISC_COLORS = [
  '#f59e0b', // Disc 1 - amber
  '#10b981', // Disc 2 - emerald
  '#06b6d4', // Disc 3 - cyan
  '#6366f1', // Disc 4 - indigo
  '#ec4899', // Disc 5 - pink
  '#8b5cf6'  // Disc 6 - purple
];

function render() {
  renderLevelPicker(picker, {
    gameId: GAME_ID,
    levels: HANOI_LEVELS,
    current: currentLevel,
    onSelect: setLevel
  });

  const level = HANOI_LEVELS[currentLevel];

  if (movesCounter) {
    movesCounter.textContent = `Movimentos: ${gameState.moves} (mínimo ideal: ${level.minMoves})`;
  }

  board.replaceChildren();

  const container = document.createElement('div');
  container.className = 'hanoi-container';

  const pegsKeys = ['A', 'B', 'C'];
  const pegLabels = {
    A: 'Haste A (Origem)',
    B: 'Haste B (Auxiliar)',
    C: 'Haste C (Destino)'
  };

  pegsKeys.forEach(key => {
    const pegWrapper = document.createElement('button');
    pegWrapper.type = 'button';
    pegWrapper.className = `hanoi-peg-wrapper ${selectedPeg === key ? 'is-selected-peg' : ''}`;
    pegWrapper.setAttribute('aria-label', `${pegLabels[key]}, contém ${gameState.pegs[key].length} discos`);
    pegWrapper.addEventListener('click', () => handlePegClick(key));

    const pegPole = document.createElement('div');
    pegPole.className = 'hanoi-pole';

    const discsStack = document.createElement('div');
    discsStack.className = 'hanoi-discs-stack';

    gameState.pegs[key].forEach((discSize, idx) => {
      const isTopDisc = idx === gameState.pegs[key].length - 1;
      const isLifted = selectedPeg === key && isTopDisc;

      const discEl = document.createElement('div');
      discEl.className = `hanoi-disc disc-${discSize} ${isLifted ? 'is-lifted' : ''}`;

      const widthPercent = 30 + (discSize / level.discs) * 65;
      discEl.style.width = `${widthPercent}%`;
      discEl.style.backgroundColor = DISC_COLORS[(discSize - 1) % DISC_COLORS.length];
      discEl.innerHTML = `<span>${discSize}</span>`;

      discsStack.append(discEl);
    });

    const pegBase = document.createElement('div');
    pegBase.className = 'hanoi-base';
    pegBase.innerHTML = `<strong>${key}</strong><small>${key === 'C' ? '⭐ Destino' : key === 'A' ? 'Origem' : 'Auxiliar'}</small>`;

    pegWrapper.append(pegPole, discsStack, pegBase);
    container.append(pegWrapper);
  });

  board.append(container);

  if (undoButton) {
    undoButton.disabled = !gameState.history || gameState.history.length === 0;
  }
}

export function refreshHanoi() {
  setLevel(getSelectedLevel(GAME_ID));
}

undoButton?.addEventListener('click', handleUndo);
resetButton?.addEventListener('click', handleReset);

setLevel(currentLevel);
