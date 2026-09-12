import { BALANCE_LEVELS } from '../puzzles.js';
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
import { calculatePanWeight, validateBalance } from '../rules.js';

const GAME_ID = 'balance';
const panel = document.querySelector('#panel-balance');
const picker = panel?.querySelector('[data-level-picker]');
const board = panel?.querySelector('[data-board]');
const message = panel?.querySelector('[data-message]');
const checkButton = panel?.querySelector('[data-action="check"]');
const resetButton = panel?.querySelector('[data-action="reset"]');

let currentLevel = getSelectedLevel(GAME_ID);
let userState = { rightPan: [] };

function initialBalanceState() {
  return { rightPan: [] };
}

function validStoredState(stored) {
  if (!stored || typeof stored !== 'object' || !Array.isArray(stored.rightPan)) return false;
  return true;
}

function setLevel(index) {
  cancelAdvance(GAME_ID);
  currentLevel = index;
  setSelectedLevel(GAME_ID, index);
  const stored = getBoardState(GAME_ID, index);
  userState = validStoredState(stored) ? { rightPan: [...stored.rightPan] } : initialBalanceState();
  if (message) clearMessage(message);
  render();
}

function handleReset() {
  cancelAdvance(GAME_ID);
  userState = initialBalanceState();
  clearBoardState(GAME_ID, currentLevel);
  if (message) clearMessage(message);
  render();
}

function addShapeToRightPan(shapeId) {
  if (message) clearMessage(message);
  userState.rightPan.push(shapeId);
  saveBoardState(GAME_ID, currentLevel, userState);
  render();
}

function removeShapeFromRightPan(index) {
  if (message) clearMessage(message);
  userState.rightPan.splice(index, 1);
  saveBoardState(GAME_ID, currentLevel, userState);
  render();
}

function handleCheck() {
  const level = BALANCE_LEVELS[currentLevel];
  const result = validateBalance(level, userState);

  if (!result.valid) {
    showMessage(message, 'error', `⚠️ ${result.reason}`, { focus: true });
    return;
  }

  markLevelComplete(GAME_ID, currentLevel);
  showMessage(
    message,
    'success',
    `🎉 Extraordinário, ${playerCallout()}! A Balança Misteriosa atingiu o equilíbrio perfeito! Sua dedução algébrica foi impecável!`,
    { focus: true }
  );
  celebrate(board);
  if (currentLevel < BALANCE_LEVELS.length - 1) {
    scheduleAdvance(GAME_ID, () => setLevel(currentLevel + 1));
  }
  render();
}

function renderScaleElement(title, leftShapes, rightShapes, shapeMap, { isInteractive = false, onRemove = null } = {}) {
  const scaleCard = document.createElement('div');
  scaleCard.className = `balance-scale-card ${isInteractive ? 'is-interactive-scale' : 'is-reference-scale'}`;

  const header = document.createElement('div');
  header.className = 'balance-scale-title';
  header.textContent = title;
  scaleCard.append(header);

  // Calculate tilt if interactive
  let tiltDeg = 0;
  if (isInteractive) {
    const shapeWeights = {};
    Object.values(shapeMap).forEach(s => { shapeWeights[s.id] = s.weight; });
    const leftWeight = calculatePanWeight(leftShapes, shapeWeights);
    const rightWeight = calculatePanWeight(rightShapes, shapeWeights);
    if (leftShapes.length > 0 || rightShapes.length > 0) {
      const diff = rightWeight - leftWeight;
      tiltDeg = Math.max(-12, Math.min(12, diff * 2.5));
    }
  }

  const scaleVisual = document.createElement('div');
  scaleVisual.className = 'balance-visual-wrap';

  // Fulcrum & Beam
  const beam = document.createElement('div');
  beam.className = 'balance-beam';
  beam.style.transform = `rotate(${tiltDeg}deg)`;

  const fulcrum = document.createElement('div');
  fulcrum.className = 'balance-fulcrum';

  // Left Pan
  const leftPanWrap = document.createElement('div');
  leftPanWrap.className = 'balance-pan-wrap pan-left';
  leftPanWrap.style.transform = `rotate(${-tiltDeg}deg)`;

  const leftPanPlate = document.createElement('div');
  leftPanPlate.className = 'balance-pan-plate';

  leftShapes.forEach(shapeId => {
    const s = shapeMap[shapeId];
    if (s) {
      const item = document.createElement('span');
      item.className = 'balance-shape-item';
      item.textContent = s.icon;
      item.title = `${s.name}`;
      leftPanPlate.append(item);
    }
  });
  leftPanWrap.append(leftPanPlate);

  // Right Pan
  const rightPanWrap = document.createElement('div');
  rightPanWrap.className = 'balance-pan-wrap pan-right';
  rightPanWrap.style.transform = `rotate(${-tiltDeg}deg)`;

  const rightPanPlate = document.createElement('div');
  rightPanPlate.className = 'balance-pan-plate';
  if (isInteractive && rightShapes.length === 0) {
    const emptyPrompt = document.createElement('span');
    emptyPrompt.className = 'pan-empty-prompt';
    emptyPrompt.textContent = 'Adicione formas abaixo';
    rightPanPlate.append(emptyPrompt);
  }

  rightShapes.forEach((shapeId, idx) => {
    const s = shapeMap[shapeId];
    if (s) {
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'balance-shape-item' + (isInteractive ? ' is-clickable-item' : '');
      item.textContent = s.icon;
      item.title = isInteractive ? `Remover ${s.name}` : s.name;
      item.setAttribute('aria-label', isInteractive ? `Remover ${s.name} do prato direito` : s.name);
      if (isInteractive && onRemove) {
        item.addEventListener('click', () => onRemove(idx));
      }
      rightPanPlate.append(item);
    }
  });
  rightPanWrap.append(rightPanPlate);

  beam.append(leftPanWrap, rightPanWrap);
  scaleVisual.append(beam, fulcrum);
  scaleCard.append(scaleVisual);

  return scaleCard;
}

function render() {
  if (!panel || !board) return;

  renderLevelPicker(picker, {
    gameId: GAME_ID,
    levels: BALANCE_LEVELS,
    current: currentLevel,
    onSelect: setLevel
  });

  const level = BALANCE_LEVELS[currentLevel];
  board.replaceChildren();

  const shapeMap = {};
  level.shapes.forEach(s => { shapeMap[s.id] = s; });

  const container = document.createElement('div');
  container.className = 'balance-container';

  // Section 1: Reference Scales
  const refSection = document.createElement('div');
  refSection.className = 'balance-ref-section';

  const refHeading = document.createElement('div');
  refHeading.className = 'balance-section-heading';
  refHeading.innerHTML = `
    <span class="micro-label">Balanças em Equilíbrio</span>
    <h3>Pistas de Pesagem (Informações Conhecidas)</h3>
  `;
  refSection.append(refHeading);

  const refGrid = document.createElement('div');
  refGrid.className = `balance-ref-grid count-${level.referenceScales.length}`;

  level.referenceScales.forEach(ref => {
    const scaleEl = renderScaleElement(ref.title, ref.left, ref.right, shapeMap, { isInteractive: false });
    refGrid.append(scaleEl);
  });
  refSection.append(refGrid);
  container.append(refSection);

  // Section 2: Mystery Scale (Target)
  const mysterySection = document.createElement('div');
  mysterySection.className = 'balance-mystery-section';

  const mysteryHeading = document.createElement('div');
  mysteryHeading.className = 'balance-section-heading';
  mysteryHeading.innerHTML = `
    <span class="micro-label">Desafio da Balança</span>
    <h3>Balança Misteriosa · Encontre o Equilíbrio</h3>
  `;
  mysterySection.append(mysteryHeading);

  const mysteryScaleEl = renderScaleElement(
    level.mysteryScale.title,
    level.mysteryScale.left,
    userState.rightPan,
    shapeMap,
    {
      isInteractive: true,
      onRemove: removeShapeFromRightPan
    }
  );
  mysterySection.append(mysteryScaleEl);

  // Shape Bank / Selector
  const bankWrap = document.createElement('div');
  bankWrap.className = 'balance-bank-wrap';

  const bankTitle = document.createElement('span');
  bankTitle.className = 'micro-label';
  bankTitle.textContent = 'Toque nas formas para colocar no prato direito:';
  bankWrap.append(bankTitle);

  const bankButtons = document.createElement('div');
  bankButtons.className = 'balance-bank-buttons';

  const allowed = level.mysteryScale.allowedShapes
    ? new Set(level.mysteryScale.allowedShapes)
    : new Set(level.shapes.map(s => s.id));

  level.shapes.forEach(shape => {
    if (allowed.has(shape.id)) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'balance-add-shape-btn';
      btn.innerHTML = `
        <span class="shape-icon">${shape.icon}</span>
        <span class="shape-label">${shape.name}</span>
      `;
      btn.setAttribute('aria-label', `Adicionar ${shape.name} ao prato direito`);
      btn.addEventListener('click', () => addShapeToRightPan(shape.id));
      bankButtons.append(btn);
    }
  });

  bankWrap.append(bankButtons);
  mysterySection.append(bankWrap);

  if (level.hint) {
    const hintDiv = document.createElement('div');
    hintDiv.className = 'balance-hint';
    hintDiv.innerHTML = `<strong>Dica Algébrica:</strong> ${level.hint}`;
    mysterySection.append(hintDiv);
  }

  container.append(mysterySection);
  board.append(container);
}

export function refreshBalance() {
  setLevel(getSelectedLevel(GAME_ID));
}

checkButton?.addEventListener('click', handleCheck);
resetButton?.addEventListener('click', handleReset);

if (panel) {
  setLevel(currentLevel);
}
