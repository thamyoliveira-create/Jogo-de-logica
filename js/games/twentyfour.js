import { TWENTYFOUR_LEVELS } from '../puzzles.js';
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
import { evaluateMathExpression, validateTwentyFour } from '../rules.js';

const GAME_ID = 'twentyfour';
const panel = document.querySelector('#panel-twentyfour');
const picker = panel?.querySelector('[data-level-picker]');
const board = panel?.querySelector('[data-board]');
const message = panel?.querySelector('[data-message]');
const checkButton = panel?.querySelector('[data-action="check"]');
const resetButton = panel?.querySelector('[data-action="reset"]');

let currentLevel = getSelectedLevel(GAME_ID);
let currentExpr = '';

function initialTwentyFourState() {
  return { expr: '' };
}

function validStoredState(stored) {
  if (!stored || typeof stored !== 'object') return false;
  return typeof stored.expr === 'string';
}

function setLevel(index) {
  cancelAdvance(GAME_ID);
  currentLevel = index;
  setSelectedLevel(GAME_ID, index);
  const stored = getBoardState(GAME_ID, index);
  currentExpr = validStoredState(stored) ? stored.expr : '';
  if (message) clearMessage(message);
  render();
}

function handleReset() {
  cancelAdvance(GAME_ID);
  currentExpr = '';
  clearBoardState(GAME_ID, currentLevel);
  if (message) clearMessage(message);
  render();
}

function handleCheck() {
  const level = TWENTYFOUR_LEVELS[currentLevel];
  const result = validateTwentyFour(level, currentExpr);

  if (!result.valid) {
    showMessage(message, 'error', `⚠️ ${result.reason}`, { focus: true });
    return;
  }

  markLevelComplete(GAME_ID, currentLevel);
  showMessage(
    message,
    'success',
    `🎉 Fantástico, ${playerCallout()}! A expressão ${currentExpr} = ${result.value} atingiu o alvo ${level.target ?? 24} com rigor matemático!`,
    { focus: true }
  );
  celebrate(board);
  if (currentLevel < TWENTYFOUR_LEVELS.length - 1) {
    scheduleAdvance(GAME_ID, () => setLevel(currentLevel + 1));
  }
  render();
}

function appendToken(token) {
  if (message) clearMessage(message);
  currentExpr += token;
  saveBoardState(GAME_ID, currentLevel, { expr: currentExpr });
  render();
}

function handleBackspace() {
  if (message) clearMessage(message);
  // Remove last token or space
  currentExpr = currentExpr.trimEnd();
  if (currentExpr.length > 0) {
    // If ends with a number or operator
    currentExpr = currentExpr.slice(0, -1).trimEnd();
  }
  saveBoardState(GAME_ID, currentLevel, { expr: currentExpr });
  render();
}

function render() {
  if (!panel || !board) return;

  renderLevelPicker(picker, {
    gameId: GAME_ID,
    levels: TWENTYFOUR_LEVELS,
    current: currentLevel,
    onSelect: setLevel
  });

  const level = TWENTYFOUR_LEVELS[currentLevel];
  board.replaceChildren();

  const container = document.createElement('div');
  container.className = 'twentyfour-container';

  // Target Banner
  const targetBanner = document.createElement('div');
  targetBanner.className = 'twentyfour-target-banner';
  targetBanner.innerHTML = `
    <span class="twentyfour-target-label">Alvo Matemático</span>
    <strong class="twentyfour-target-val">${level.target ?? 24}</strong>
  `;
  container.append(targetBanner);

  // Available Numbers Card Row
  const numbersRow = document.createElement('div');
  numbersRow.className = 'twentyfour-numbers-row';

  // Count how many times each number in level.numbers has been used in currentExpr
  const rawNumsInExpr = (currentExpr.match(/\d+(\.\d+)?/g) || []).map(Number);
  const usedCounts = new Map();
  rawNumsInExpr.forEach(n => usedCounts.set(n, (usedCounts.get(n) || 0) + 1));

  const levelNumberCounts = new Map();
  level.numbers.forEach(n => levelNumberCounts.set(n, (levelNumberCounts.get(n) || 0) + 1));

  level.numbers.forEach((num, idx) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'twentyfour-num-btn';

    const usedSoFar = usedCounts.get(num) || 0;
    // If all copies of this number are used up, mark disabled/used
    // To match specific index, calculate occurrence index of num
    let occurrenceIdx = 0;
    for (let i = 0; i <= idx; i += 1) {
      if (level.numbers[i] === num) occurrenceIdx += 1;
    }
    const isUsed = occurrenceIdx <= usedSoFar;

    if (isUsed) {
      btn.classList.add('is-used');
      btn.setAttribute('aria-disabled', 'true');
    }

    btn.textContent = String(num);
    btn.setAttribute('aria-label', `Número ${num}${isUsed ? ' (já usado)' : ''}`);
    btn.addEventListener('click', () => {
      appendToken(currentExpr.length > 0 && !/[+\-*/(]$/.test(currentExpr.trim()) ? ` ${num}` : `${num}`);
    });

    numbersRow.append(btn);
  });
  container.append(numbersRow);

  // Expression Display Box
  const displayBox = document.createElement('div');
  displayBox.className = 'twentyfour-display-box';

  const exprText = document.createElement('span');
  exprText.className = 'twentyfour-expr-text';
  exprText.textContent = currentExpr || 'Monte sua expressão...';
  if (!currentExpr) exprText.classList.add('is-placeholder');

  // Live evaluation preview
  const previewText = document.createElement('span');
  previewText.className = 'twentyfour-preview-text';
  if (currentExpr.trim()) {
    const evalRes = evaluateMathExpression(currentExpr);
    if (evalRes.valid) {
      const formatted = Number(evalRes.value.toFixed(2));
      previewText.textContent = `= ${formatted}`;
      if (Math.abs(evalRes.value - (level.target ?? 24)) < 1e-5) {
        previewText.classList.add('matches-target');
      }
    }
  }

  displayBox.append(exprText, previewText);
  container.append(displayBox);

  // Operations Keypad
  const keypad = document.createElement('div');
  keypad.className = 'twentyfour-keypad';

  const ops = [
    { label: '+', token: ' + ' },
    { label: '−', token: ' - ' },
    { label: '×', token: ' * ' },
    { label: '÷', token: ' / ' },
    { label: '(', token: '(' },
    { label: ')', token: ')' },
    { label: '⌫', action: 'backspace' },
    { label: 'Limpar', action: 'clear' }
  ];

  ops.forEach(op => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `twentyfour-op-btn ${op.action ? `btn-${op.action}` : ''}`;
    btn.textContent = op.label;
    btn.setAttribute('aria-label', op.action === 'backspace' ? 'Apagar último caractere' : op.action === 'clear' ? 'Limpar expressão' : `Operador ${op.label}`);

    if (op.action === 'backspace') {
      btn.addEventListener('click', handleBackspace);
    } else if (op.action === 'clear') {
      btn.addEventListener('click', () => {
        currentExpr = '';
        saveBoardState(GAME_ID, currentLevel, { expr: '' });
        clearMessage(message);
        render();
      });
    } else {
      btn.addEventListener('click', () => appendToken(op.token));
    }

    keypad.append(btn);
  });
  container.append(keypad);

  board.append(container);
}

export function refreshTwentyFour() {
  setLevel(getSelectedLevel(GAME_ID));
}

checkButton?.addEventListener('click', handleCheck);
resetButton?.addEventListener('click', handleReset);

if (panel) {
  setLevel(currentLevel);
}
