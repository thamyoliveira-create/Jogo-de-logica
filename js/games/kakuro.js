import { KAKURO_LEVELS } from '../puzzles.js';
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
import { validateKakuro } from '../rules.js';

const GAME_ID = 'kakuro';
const panel = document.querySelector('#panel-kakuro');
const picker = panel?.querySelector('[data-level-picker]');
const board = panel?.querySelector('[data-board]');
const message = panel?.querySelector('[data-message]');
const checkButton = panel?.querySelector('[data-action="check"]');
const resetButton = panel?.querySelector('[data-action="reset"]');

let currentLevel = getSelectedLevel(GAME_ID);
let boardState = {};

function initialKakuroState() {
  return {};
}

function validStoredState(stored) {
  if (!stored || typeof stored !== 'object') return false;
  return true;
}

function setLevel(index) {
  cancelAdvance(GAME_ID);
  currentLevel = index;
  setSelectedLevel(GAME_ID, index);
  const stored = getBoardState(GAME_ID, index);
  boardState = validStoredState(stored) ? { ...stored } : initialKakuroState();
  if (message) clearMessage(message);
  render();
}

function handleReset() {
  cancelAdvance(GAME_ID);
  boardState = initialKakuroState();
  clearBoardState(GAME_ID, currentLevel);
  if (message) clearMessage(message);
  render();
}

function handleCellChange(r, c, value) {
  const key = `${r},${c}`;
  const num = parseInt(value, 10);
  if (Number.isInteger(num) && num >= 1 && num <= 9) {
    boardState[key] = num;
  } else {
    delete boardState[key];
  }
  saveBoardState(GAME_ID, currentLevel, boardState);
  if (message) clearMessage(message);
  render();
}

function handleCheck() {
  const level = KAKURO_LEVELS[currentLevel];
  const result = validateKakuro(level, boardState);

  if (!result.valid) {
    showMessage(message, 'error', `⚠️ ${result.reason}`, { focus: true });
    return;
  }

  markLevelComplete(GAME_ID, currentLevel);
  showMessage(
    message,
    'success',
    `🎉 Extraordinário, ${playerCallout()}! Você completou todas as somas cruzadas com dígitos únicos de 1 a 9!`,
    { focus: true }
  );
  celebrate(board);
  if (currentLevel < KAKURO_LEVELS.length - 1) {
    scheduleAdvance(GAME_ID, () => setLevel(currentLevel + 1));
  }
  render();
}

function render() {
  if (!panel || !board) return;

  renderLevelPicker(picker, {
    gameId: GAME_ID,
    levels: KAKURO_LEVELS,
    current: currentLevel,
    onSelect: setLevel
  });

  const level = KAKURO_LEVELS[currentLevel];
  board.replaceChildren();

  const grid = document.createElement('div');
  grid.className = `kakuro-grid grid-size-${level.cols}`;
  grid.style.gridTemplateColumns = `repeat(${level.cols}, minmax(44px, 58px))`;

  // Map white cells
  const whiteSet = new Set(level.cells.map(c => `${c.row},${c.col}`));

  for (let r = 0; r < level.rows; r += 1) {
    for (let c = 0; c < level.cols; c += 1) {
      const cellKey = `${r},${c}`;
      const cellData = level.grid[r][c];

      if (cellData.type !== 'white') {
        // Clue or Blocked Black Cell
        const clueCell = document.createElement('div');
        clueCell.className = 'kakuro-cell kakuro-black-cell';

        if (cellData.colClue !== undefined || cellData.rowClue !== undefined) {
          clueCell.classList.add('has-clue');
          clueCell.innerHTML = `
            <svg class="kakuro-diagonal" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
              <line x1="0" y1="0" x2="100" y2="100" />
            </svg>
            ${cellData.colClue !== undefined ? `<span class="kakuro-clue-down" title="Soma vertical: ${cellData.colClue}">${cellData.colClue}</span>` : ''}
            ${cellData.rowClue !== undefined ? `<span class="kakuro-clue-across" title="Soma horizontal: ${cellData.rowClue}">${cellData.rowClue}</span>` : ''}
          `;
        }
        grid.append(clueCell);
      } else if (whiteSet.has(cellKey)) {
        // White Editable Cell
        const whiteCell = document.createElement('div');
        whiteCell.className = 'kakuro-cell kakuro-white-cell';

        const input = document.createElement('input');
        input.type = 'number';
        input.min = '1';
        input.max = '9';
        input.inputMode = 'numeric';
        input.className = 'kakuro-input';
        input.id = `kakuro-${currentLevel}-${r}-${c}`;
        input.setAttribute('aria-label', `Linha ${r + 1}, Coluna ${c + 1}`);

        const currentVal = boardState[cellKey];
        if (currentVal !== undefined && currentVal !== null && currentVal !== '') {
          input.value = currentVal;
        }

        input.addEventListener('input', (e) => {
          let val = e.target.value.replace(/[^1-9]/g, '');
          if (val.length > 1) val = val.slice(-1); // Only single digit 1-9
          e.target.value = val;
          handleCellChange(r, c, val);
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

          const nextInput = document.querySelector(`#kakuro-${currentLevel}-${targetR}-${targetC}`);
          if (nextInput) {
            e.preventDefault();
            nextInput.focus();
            nextInput.select();
          }
        });

        whiteCell.append(input);
        grid.append(whiteCell);
      } else {
        // Unspecified cell defaults to empty black
        const emptyCell = document.createElement('div');
        emptyCell.className = 'kakuro-cell kakuro-black-cell';
        grid.append(emptyCell);
      }
    }
  }

  board.append(grid);
}

export function refreshKakuro() {
  setLevel(getSelectedLevel(GAME_ID));
}

checkButton?.addEventListener('click', handleCheck);
resetButton?.addEventListener('click', handleReset);

if (panel) {
  setLevel(currentLevel);
}
