import { PYRAMID_LEVELS } from '../puzzles.js';
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
import { validateMagicSquare, validatePyramid } from '../rules.js';

const GAME_ID = 'pyramid';
const panel = document.querySelector('#panel-pyramid');
const picker = panel?.querySelector('[data-level-picker]');
const board = panel?.querySelector('[data-board]');
const message = panel?.querySelector('[data-message]');
const checkButton = panel?.querySelector('[data-action="check"]');
const resetButton = panel?.querySelector('[data-action="reset"]');

let currentLevel = getSelectedLevel(GAME_ID);
let puzzleState = null;

function initialPyramidState(level) {
  if (level.type === 'pyramid') {
    return level.layers.map(row => row.map(brick => (brick.value !== null ? brick.value : '')));
  }
  if (level.type === 'magicsquare' || level.type === 'magic_square') {
    return level.initialGrid.map(row => row.map(val => (val !== null ? val : '')));
  }
  return [];
}

function validStoredState(level, stored) {
  if (!Array.isArray(stored)) return false;
  if (level.type === 'pyramid') {
    if (stored.length !== level.layers.length) return false;
    return stored.every((row, r) => Array.isArray(row) && row.length === level.layers[r].length);
  }
  if (level.type === 'magicsquare' || level.type === 'magic_square') {
    if (stored.length !== level.size) return false;
    return stored.every(row => Array.isArray(row) && row.length === level.size);
  }
  return false;
}

function setLevel(index) {
  cancelAdvance(GAME_ID);
  currentLevel = index;
  setSelectedLevel(GAME_ID, index);
  const level = PYRAMID_LEVELS[index];
  const stored = getBoardState(GAME_ID, index);
  puzzleState = validStoredState(level, stored) ? stored : initialPyramidState(level);
  if (message) clearMessage(message);
  render();
}

function handleReset() {
  cancelAdvance(GAME_ID);
  const level = PYRAMID_LEVELS[currentLevel];
  puzzleState = initialPyramidState(level);
  clearBoardState(GAME_ID, currentLevel);
  if (message) clearMessage(message);
  render();
}

function handleValueChange(r, c, value) {
  const num = value === '' ? '' : Number(value);
  puzzleState[r][c] = num;
  saveBoardState(GAME_ID, currentLevel, puzzleState);
  if (message) clearMessage(message);
}

function handleCheck() {
  const level = PYRAMID_LEVELS[currentLevel];
  let result;

  if (level.type === 'pyramid') {
    result = validatePyramid(level, puzzleState);
  } else {
    result = validateMagicSquare(level, puzzleState);
  }

  if (!result.valid) {
    showMessage(message, 'error', `⚠️ ${result.reason}`, { focus: true });
    return;
  }

  markLevelComplete(GAME_ID, currentLevel);
  const praise = level.type === 'pyramid'
    ? `🎉 Incrível, ${playerCallout()}! A pirâmide numérica foi perfeitamente equilibrada com a operação ${level.op || '+'}!`
    : `🎉 Magnífico, ${playerCallout()}! O quadrado mágico está perfeito com constante ${level.magicConstant}!`;

  showMessage(message, 'success', praise, { focus: true });
  celebrate(board);
  if (currentLevel < PYRAMID_LEVELS.length - 1) {
    scheduleAdvance(GAME_ID, () => setLevel(currentLevel + 1));
  }
  render();
}

function render() {
  if (!panel || !board) return;

  renderLevelPicker(picker, {
    gameId: GAME_ID,
    levels: PYRAMID_LEVELS,
    current: currentLevel,
    onSelect: setLevel
  });

  const level = PYRAMID_LEVELS[currentLevel];
  board.replaceChildren();

  const container = document.createElement('div');
  container.className = 'pyramid-container';

  // Header / Hint badge
  const header = document.createElement('div');
  header.className = 'pyramid-header';
  if (level.type === 'pyramid') {
    header.innerHTML = `
      <span class="pyramid-badge">Operação: Bloco Superior = Esquerda ${level.op || '+'} Direita</span>
    `;
  } else {
    header.innerHTML = `
      <span class="pyramid-badge">Constante Mágica: Soma = <strong>${level.magicConstant}</strong> em todas as linhas, colunas e diagonais</span>
    `;
  }
  container.append(header);

  if (level.type === 'pyramid') {
    // Render Pyramid Bricks
    const pyramidWrap = document.createElement('div');
    pyramidWrap.className = 'pyramid-bricks-wrap';

    level.layers.forEach((layer, r) => {
      const rowDiv = document.createElement('div');
      rowDiv.className = 'pyramid-row';

      layer.forEach((brickObj, c) => {
        const brick = document.createElement('div');
        brick.className = 'pyramid-brick';
        const isGiven = typeof brickObj === 'object' && brickObj !== null ? brickObj.given : brickObj !== null;
        const fixedVal = typeof brickObj === 'object' && brickObj !== null ? brickObj.value : brickObj;

        if (isGiven && fixedVal !== null) {
          brick.classList.add('is-fixed');
          brick.innerHTML = `<strong class="brick-val">${fixedVal}</strong>`;
        } else {
          brick.classList.add('is-input');
          const input = document.createElement('input');
          input.type = 'number';
          input.className = 'brick-input';
          input.id = `pyr-${currentLevel}-${r}-${c}`;
          input.setAttribute('aria-label', `Camada ${r + 1}, Bloco ${c + 1}`);
          const currentVal = puzzleState[r]?.[c];
          if (currentVal !== '' && currentVal !== undefined && currentVal !== null) {
            input.value = currentVal;
          }

          input.addEventListener('input', (e) => {
            handleValueChange(r, c, e.target.value);
          });

          brick.append(input);
        }

        rowDiv.append(brick);
      });

      pyramidWrap.append(rowDiv);
    });

    container.append(pyramidWrap);
  } else {
    // Render Magic Square Matrix
    const squareWrap = document.createElement('div');
    squareWrap.className = 'magic-square-wrap';

    const grid = document.createElement('div');
    grid.className = `magic-square-grid size-${level.size}`;
    grid.style.gridTemplateColumns = `repeat(${level.size}, minmax(52px, 68px))`;

    const initialMatrix = level.initialGrid || level.initial || [];
    initialMatrix.forEach((row, r) => {
      row.forEach((fixedVal, c) => {
        const cell = document.createElement('div');
        cell.className = 'magic-square-cell';

        if (fixedVal !== null) {
          cell.classList.add('is-fixed');
          cell.innerHTML = `<strong>${fixedVal}</strong>`;
        } else {
          cell.classList.add('is-input');
          const input = document.createElement('input');
          input.type = 'number';
          input.min = '1';
          input.max = String(level.size * level.size);
          input.className = 'magic-square-input';
          input.id = `mag-${currentLevel}-${r}-${c}`;
          input.setAttribute('aria-label', `Linha ${r + 1}, Coluna ${c + 1}`);
          const currentVal = puzzleState[r]?.[c];
          if (currentVal !== '' && currentVal !== undefined && currentVal !== null) {
            input.value = currentVal;
          }

          input.addEventListener('input', (e) => {
            handleValueChange(r, c, e.target.value);
          });

          // Keyboard arrow navigation
          input.addEventListener('keydown', (e) => {
            let targetR = r;
            let targetC = c;
            if (e.key === 'ArrowUp') targetR -= 1;
            else if (e.key === 'ArrowDown') targetR += 1;
            else if (e.key === 'ArrowLeft') targetC -= 1;
            else if (e.key === 'ArrowRight') targetC += 1;
            else return;

            const nextInput = document.querySelector(`#mag-${currentLevel}-${targetR}-${targetC}`);
            if (nextInput) {
              e.preventDefault();
              nextInput.focus();
              nextInput.select();
            }
          });

          cell.append(input);
        }

        grid.append(cell);
      });
    });

    squareWrap.append(grid);
    container.append(squareWrap);
  }

  if (level.hint) {
    const hintDiv = document.createElement('div');
    hintDiv.className = 'pyramid-hint';
    hintDiv.innerHTML = `<strong>Dica de Cálculo:</strong> ${level.hint}`;
    container.append(hintDiv);
  }

  board.append(container);
}

export function refreshPyramid() {
  setLevel(getSelectedLevel(GAME_ID));
}

checkButton?.addEventListener('click', handleCheck);
resetButton?.addEventListener('click', handleReset);

if (panel) {
  setLevel(currentLevel);
}
