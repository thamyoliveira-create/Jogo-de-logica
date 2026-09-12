import { RIVER_LEVELS } from '../puzzles.js';
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
import { checkRiverBankSafety, isRiverComplete, validateRiverRaft } from '../rules.js';

const GAME_ID = 'river';
const panel = document.querySelector('#panel-river');
const picker = panel.querySelector('[data-level-picker]');
const board = panel.querySelector('[data-board]');
const message = panel.querySelector('[data-message]');
const sailButton = panel.querySelector('[data-action="sail"]');
const undoButton = panel.querySelector('[data-action="undo"]');
const resetButton = panel.querySelector('[data-action="reset"]');
const movesCounter = panel.querySelector('[data-river-moves]');

let currentLevel = getSelectedLevel(GAME_ID);
let gameState = null;
let isSailing = false;

function initialRiverState(level) {
  return {
    left: level.characters.map(c => c.id),
    right: [],
    raft: [],
    raftPosition: 'left',
    moves: 0,
    history: []
  };
}

function validStoredState(level, stored) {
  if (!stored || typeof stored !== 'object') return false;
  const allIds = new Set(level.characters.map(c => c.id));
  const currentIds = [...(stored.left || []), ...(stored.right || []), ...(stored.raft || [])];
  if (currentIds.length !== allIds.size || !currentIds.every(id => allIds.has(id))) return false;
  if (!['left', 'right'].includes(stored.raftPosition)) return false;
  return true;
}

function setLevel(index) {
  cancelAdvance(GAME_ID);
  currentLevel = index;
  setSelectedLevel(GAME_ID, index);
  const level = RIVER_LEVELS[index];
  const stored = getBoardState(GAME_ID, index);
  gameState = validStoredState(level, stored) ? stored : initialRiverState(level);
  clearMessage(message);
  render();
}

function pushHistory() {
  gameState.history = gameState.history || [];
  gameState.history.push(JSON.stringify({
    left: [...gameState.left],
    right: [...gameState.right],
    raft: [...gameState.raft],
    raftPosition: gameState.raftPosition,
    moves: gameState.moves
  }));
  if (gameState.history.length > 50) gameState.history.shift();
}

function checkVictory() {
  const level = RIVER_LEVELS[currentLevel];
  if (isRiverComplete(level, gameState)) {
    if (gameState.raft && gameState.raft.length > 0) {
      gameState.right.push(...gameState.raft);
      gameState.raft = [];
    }
    markLevelComplete(GAME_ID, currentLevel);
    const optText = gameState.moves === level.minMoves
      ? '🎯 Fantástico! Você completou com a quantidade MÍNIMA ideal de movimentos!'
      : `Muito bem! Você completou em ${gameState.moves} viagens (o ideal era ${level.minMoves}).`;
    showMessage(message, 'success', `🎉 Parabéns, ${playerCallout()}! Todos cruzaram o rio com segurança! ${optText}`, { focus: true });
    celebrate(board);
    if (currentLevel < RIVER_LEVELS.length - 1) {
      scheduleAdvance(GAME_ID, () => setLevel(currentLevel + 1));
    }
    saveBoardState(GAME_ID, currentLevel, gameState);
    render();
    return true;
  }
  return false;
}

function handleCharacterClick(charId, fromLocation) {
  if (isSailing) return;
  const level = RIVER_LEVELS[currentLevel];

  if (fromLocation === 'left' || fromLocation === 'right') {
    if (gameState.raftPosition !== fromLocation) {
      showMessage(message, 'alert', `O barco está na margem ${gameState.raftPosition === 'left' ? 'esquerda' : 'direita'}!`);
      return;
    }
    if (gameState.raft.length >= level.capacity) {
      showMessage(message, 'alert', `O barco já está com a capacidade máxima (${level.capacity} tripulantes)!`);
      return;
    }
    pushHistory();
    gameState[fromLocation] = gameState[fromLocation].filter(id => id !== charId);
    gameState.raft.push(charId);
    clearMessage(message);
  } else if (fromLocation === 'raft') {
    pushHistory();
    gameState.raft = gameState.raft.filter(id => id !== charId);
    gameState[gameState.raftPosition].push(charId);
    clearMessage(message);
  }

  saveBoardState(GAME_ID, currentLevel, gameState);
  render();

  checkVictory();
}

function handleSail() {
  if (isSailing) return;
  const level = RIVER_LEVELS[currentLevel];
  const raftChars = gameState.raft.map(id => level.characters.find(c => c.id === id));
  const validation = validateRiverRaft(level, raftChars);

  if (!validation.canSail) {
    showMessage(message, 'alert', validation.reason);
    return;
  }

  const originPosition = gameState.raftPosition;
  const targetPosition = originPosition === 'left' ? 'right' : 'left';

  // Check safety of the origin bank once raft departs
  const originBankChars = gameState[originPosition].map(id => level.characters.find(c => c.id === id));
  const originSafety = checkRiverBankSafety(level.id, originBankChars);

  if (!originSafety.safe) {
    showMessage(message, 'error', `⚠️ Violação de regra na margem de partida: ${originSafety.reason}`, { focus: true });
    return;
  }

  pushHistory();
  isSailing = true;
  clearMessage(message);
  render();

  // Sail animation delay
  setTimeout(() => {
    gameState.raftPosition = targetPosition;
    gameState.moves += 1;
    isSailing = false;

    // Check safety of the target bank upon arrival
    const targetBankWithRaft = [
      ...gameState[targetPosition].map(id => level.characters.find(c => c.id === id)),
      ...raftChars
    ];
    const targetSafety = checkRiverBankSafety(level.id, targetBankWithRaft);

    if (!targetSafety.safe) {
      showMessage(message, 'error', `⚠️ Violação de regra na margem de chegada: ${targetSafety.reason}`, { focus: true });
    } else {
      checkVictory();
    }

    saveBoardState(GAME_ID, currentLevel, gameState);
    render();
  }, 600);
}

function handleUndo() {
  if (isSailing || !gameState.history || gameState.history.length === 0) return;
  const previous = JSON.parse(gameState.history.pop());
  gameState.left = previous.left;
  gameState.right = previous.right;
  gameState.raft = previous.raft;
  gameState.raftPosition = previous.raftPosition;
  gameState.moves = previous.moves;
  clearMessage(message);
  saveBoardState(GAME_ID, currentLevel, gameState);
  render();
}

function handleReset() {
  cancelAdvance(GAME_ID);
  const level = RIVER_LEVELS[currentLevel];
  gameState = initialRiverState(level);
  clearBoardState(GAME_ID, currentLevel);
  clearMessage(message);
  render();
}

function render() {
  renderLevelPicker(picker, {
    gameId: GAME_ID,
    levels: RIVER_LEVELS,
    current: currentLevel,
    onSelect: setLevel
  });

  const level = RIVER_LEVELS[currentLevel];
  if (movesCounter) {
    movesCounter.textContent = `Viagens: ${gameState.moves} (mínimo: ${level.minMoves})`;
  }

  board.replaceChildren();

  const container = document.createElement('div');
  container.className = 'river-game-container';

  // Left Bank
  const leftBank = document.createElement('div');
  leftBank.className = `river-bank left-bank ${gameState.raftPosition === 'left' ? 'is-active-bank' : ''}`;
  const leftHeading = document.createElement('h3');
  leftHeading.className = 'river-bank-title';
  leftHeading.textContent = 'Margem Esquerda (Partida)';
  const leftRoster = document.createElement('div');
  leftRoster.className = 'river-roster';

  gameState.left.forEach(id => {
    const char = level.characters.find(c => c.id === id);
    if (!char) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `river-char-card ${char.isPilot ? 'is-pilot' : ''}`;
    button.disabled = isSailing || gameState.raftPosition !== 'left' || gameState.raft.length >= level.capacity;
    button.innerHTML = `
      <span class="char-icon" aria-hidden="true">${char.icon}</span>
      <span class="char-info">
        <strong>${char.name}</strong>
        <small>${char.role}${char.isPilot ? ' ⭐' : ''}</small>
      </span>
    `;
    button.setAttribute('aria-label', `Embarcar ${char.name} no barco`);
    button.addEventListener('click', () => handleCharacterClick(id, 'left'));
    leftRoster.append(button);
  });
  leftBank.append(leftHeading, leftRoster);

  // River Stream & Raft
  const stream = document.createElement('div');
  stream.className = 'river-stream';

  const raft = document.createElement('div');
  raft.className = `river-raft raft-${gameState.raftPosition} ${isSailing ? 'is-sailing' : ''}`;

  const raftSlots = document.createElement('div');
  raftSlots.className = 'raft-slots';

  gameState.raft.forEach(id => {
    const char = level.characters.find(c => c.id === id);
    if (!char) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `river-char-card on-raft ${char.isPilot ? 'is-pilot' : ''}`;
    button.disabled = isSailing;
    button.innerHTML = `
      <span class="char-icon" aria-hidden="true">${char.icon}</span>
      <span class="char-info">
        <strong>${char.name}</strong>
        <small>Desembarcar</small>
      </span>
    `;
    button.setAttribute('aria-label', `Desembarcar ${char.name} para a margem ${gameState.raftPosition === 'left' ? 'esquerda' : 'direita'}`);
    button.addEventListener('click', () => handleCharacterClick(id, 'raft'));
    raftSlots.append(button);
  });

  // Empty slot indicator
  for (let s = gameState.raft.length; s < level.capacity; s += 1) {
    const emptySlot = document.createElement('div');
    emptySlot.className = 'raft-empty-slot';
    emptySlot.innerHTML = '<span>Lugar vago</span>';
    raftSlots.append(emptySlot);
  }

  const raftLabel = document.createElement('span');
  raftLabel.className = 'raft-label';
  raftLabel.textContent = '⛵ Balsa';

  raft.append(raftSlots, raftLabel);
  stream.append(raft);

  // Right Bank
  const rightBank = document.createElement('div');
  rightBank.className = `river-bank right-bank ${gameState.raftPosition === 'right' ? 'is-active-bank' : ''}`;
  const rightHeading = document.createElement('h3');
  rightHeading.className = 'river-bank-title';
  rightHeading.textContent = 'Margem Direita (Destino)';
  const rightRoster = document.createElement('div');
  rightRoster.className = 'river-roster';

  gameState.right.forEach(id => {
    const char = level.characters.find(c => c.id === id);
    if (!char) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `river-char-card ${char.isPilot ? 'is-pilot' : ''}`;
    button.disabled = isSailing || gameState.raftPosition !== 'right' || gameState.raft.length >= level.capacity;
    button.innerHTML = `
      <span class="char-icon" aria-hidden="true">${char.icon}</span>
      <span class="char-info">
        <strong>${char.name}</strong>
        <small>${char.role}${char.isPilot ? ' ⭐' : ''}</small>
      </span>
    `;
    button.setAttribute('aria-label', `Embarcar ${char.name} de volta no barco`);
    button.addEventListener('click', () => handleCharacterClick(id, 'right'));
    rightRoster.append(button);
  });
  rightBank.append(rightHeading, rightRoster);

  container.append(leftBank, stream, rightBank);
  board.append(container);

  if (undoButton) {
    undoButton.disabled = isSailing || !gameState.history || gameState.history.length === 0;
  }
}

export function refreshRiver() {
  setLevel(getSelectedLevel(GAME_ID));
}

sailButton?.addEventListener('click', handleSail);
undoButton?.addEventListener('click', handleUndo);
resetButton?.addEventListener('click', handleReset);

setLevel(currentLevel);
