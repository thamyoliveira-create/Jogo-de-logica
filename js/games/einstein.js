import { EINSTEIN_LEVELS } from '../puzzles.js';
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
import { checkEinsteinClue, validateEinstein } from '../rules.js';

const GAME_ID = 'einstein';
const panel = document.querySelector('#panel-einstein');
const picker = panel.querySelector('[data-level-picker]');
const board = panel.querySelector('[data-board]');
const message = panel.querySelector('[data-message]');
const cluesList = panel.querySelector('[data-einstein-clues]');
const questionText = panel.querySelector('[data-einstein-question]');
const checkButton = panel.querySelector('[data-action="check"]');
const resetButton = panel.querySelector('[data-action="reset"]');

const VALUE_ICONS = {
  // Cores
  Amarela: '🟡',
  Azul: '🔵',
  Vermelha: '🔴',
  Verde: '🟢',
  Branca: '⚪',
  // Animais
  Cachorro: '🐶',
  Gato: '🐱',
  Gatos: '🐱',
  Pássaro: '🦜',
  Cavalo: '🐴',
  Peixe: '🐟',
  // Bebidas
  Chá: '🍵',
  Leite: '🥛',
  Suco: '🧃',
  Café: '☕',
  Água: '💧',
  // Esportes / Hobbies
  Futebol: '⚽',
  Basquete: '🏀',
  Xadrez: '♟️',
  Natação: '🏊',
  Esportes: '🏃',
  Leitura: '📖',
  Música: '🎵',
  Fotografia: '📷',
  // Nacionalidades
  Brasileiro: '🇧🇷',
  Italiano: '🇮🇹',
  Espanhol: '🇪🇸',
  Francês: '🇫🇷',
  Norueguês: '🇳🇴',
  Dinamarquês: '🇩🇰',
  Inglês: '🇬🇧',
  Alemão: '🇩🇪',
  Sueco: '🇸🇪'
};

let currentLevel = getSelectedLevel(GAME_ID);
let housesState = [];

function initialEinsteinState(level) {
  return Array.from({ length: level.houses }, () => {
    const house = {};
    level.categories.forEach(cat => {
      house[cat.id] = '';
    });
    return house;
  });
}

function validStoredState(level, stored) {
  if (!Array.isArray(stored) || stored.length !== level.houses) return false;
  const validCatIds = new Set(level.categories.map(c => c.id));
  return stored.every(house => {
    if (!house || typeof house !== 'object') return false;
    return Object.keys(house).every(k => validCatIds.has(k));
  });
}

function setLevel(index) {
  cancelAdvance(GAME_ID);
  currentLevel = index;
  setSelectedLevel(GAME_ID, index);
  const level = EINSTEIN_LEVELS[index];
  const stored = getBoardState(GAME_ID, index);
  housesState = validStoredState(level, stored) ? stored : initialEinsteinState(level);
  clearMessage(message);
  render();
}

function handleValueChange(houseIndex, categoryId, value) {
  housesState[houseIndex][categoryId] = value;
  saveBoardState(GAME_ID, currentLevel, housesState);
  clearMessage(message);
  render();
}

function handleReset() {
  cancelAdvance(GAME_ID);
  const level = EINSTEIN_LEVELS[currentLevel];
  housesState = initialEinsteinState(level);
  clearBoardState(GAME_ID, currentLevel);
  clearMessage(message);
  render();
}

function handleCheck() {
  const level = EINSTEIN_LEVELS[currentLevel];
  const result = validateEinstein(level, housesState);

  if (!result.valid) {
    if (result.code === 'incomplete') {
      showMessage(message, 'alert', 'Ainda há campos vazios nas casas. Preencha todas as características antes de conferir!', { focus: true });
    } else if (result.code === 'duplicate') {
      showMessage(message, 'error', `⚠️ Conflito de dedução: a opção "${result.value}" em "${result.category}" foi atribuída a mais de uma casa!`, { focus: true });
    } else if (result.code === 'clue-violated') {
      showMessage(message, 'error', `⚠️ Pelo menos uma pista não foi satisfeita: "${result.clue}". Revise as posições!`, { focus: true });
    }
    return;
  }

  markLevelComplete(GAME_ID, currentLevel);
  showMessage(message, 'success', `🎉 Extraordinário, ${playerCallout()}! Você decifrou todas as pistas e resolveu o Enigma com perfeição lógica!`, { focus: true });
  celebrate(board);
  if (currentLevel < EINSTEIN_LEVELS.length - 1) {
    scheduleAdvance(GAME_ID, () => setLevel(currentLevel + 1));
  }
  render();
}

function render() {
  renderLevelPicker(picker, {
    gameId: GAME_ID,
    levels: EINSTEIN_LEVELS,
    current: currentLevel,
    onSelect: setLevel
  });

  const level = EINSTEIN_LEVELS[currentLevel];

  if (questionText) {
    questionText.textContent = level.question;
  }

  // Render Clues List with live status evaluation
  if (cluesList) {
    cluesList.replaceChildren();
    level.clues.forEach((clue, idx) => {
      const clueItem = document.createElement('li');
      const status = checkEinsteinClue(clue, housesState);
      clueItem.className = `einstein-clue-item clue-${status.status}`;

      const badge = document.createElement('span');
      badge.className = 'clue-badge';
      if (status.status === 'satisfied') {
        badge.textContent = '✓';
        badge.title = 'Pista satisfeita';
      } else if (status.status === 'violated') {
        badge.textContent = '✗';
        badge.title = 'Pista violada';
      } else {
        badge.textContent = `${idx + 1}`;
        badge.title = 'Pista pendente';
      }

      const text = document.createElement('span');
      text.className = 'clue-text';
      text.textContent = clue.text;

      clueItem.append(badge, text);
      cluesList.append(clueItem);
    });
  }

  // Render Houses Matrix
  board.replaceChildren();

  const grid = document.createElement('div');
  grid.className = `einstein-grid houses-${level.houses}`;

  for (let h = 0; h < level.houses; h += 1) {
    const houseCard = document.createElement('div');
    houseCard.className = 'einstein-house-card';

    const chosenColor = housesState[h]?.cor || '';
    if (chosenColor) {
      const colorKey = chosenColor.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
      houseCard.dataset.houseColor = colorKey;
    }

    const roof = document.createElement('div');
    roof.className = 'house-roof';
    roof.innerHTML = `
      <span class="roof-icon" aria-hidden="true">🏠</span>
      <strong class="house-title">Casa ${h + 1}${chosenColor ? ` · ${chosenColor}` : ''}</strong>
    `;
    houseCard.append(roof);

    const body = document.createElement('div');
    body.className = 'house-body';

    level.categories.forEach(cat => {
      const row = document.createElement('div');
      row.className = 'house-cat-row';

      const label = document.createElement('label');
      label.className = 'house-cat-label';
      label.textContent = cat.label;
      const selectId = `einstein-${currentLevel}-h${h}-${cat.id}`;
      label.htmlFor = selectId;

      const select = document.createElement('select');
      select.id = selectId;
      select.className = 'house-select';

      const emptyOption = document.createElement('option');
      emptyOption.value = '';
      emptyOption.textContent = `— ${cat.label} —`;
      select.append(emptyOption);

      const currentValue = housesState[h]?.[cat.id] || '';

      // Find values used in other houses
      const usedInOtherHouses = new Set();
      for (let otherH = 0; otherH < level.houses; otherH += 1) {
        if (otherH !== h) {
          const val = housesState[otherH]?.[cat.id];
          if (val) usedInOtherHouses.add(val);
        }
      }

      cat.values.forEach(val => {
        const option = document.createElement('option');
        option.value = val;
        const icon = VALUE_ICONS[val] ? `${VALUE_ICONS[val]} ` : '';
        option.textContent = icon + val + (usedInOtherHouses.has(val) ? ' (em outra casa)' : '');
        if (val === currentValue) option.selected = true;
        select.append(option);
      });

      select.addEventListener('change', (e) => {
        handleValueChange(h, cat.id, e.target.value);
      });

      row.append(label, select);
      body.append(row);
    });

    houseCard.append(body);
    grid.append(houseCard);
  }

  board.append(grid);
}

export function refreshEinstein() {
  setLevel(getSelectedLevel(GAME_ID));
}

checkButton?.addEventListener('click', handleCheck);
resetButton?.addEventListener('click', handleReset);

setLevel(currentLevel);
