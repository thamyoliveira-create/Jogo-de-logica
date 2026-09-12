import { GAME_META } from './puzzles.js';

const STORAGE_KEY = 'mesa-logica:v2';
const listeners = new Set();
const advanceTimers = new Map();

const clone = value => JSON.parse(JSON.stringify(value));

function blankState() {
  const selectedLevels = {};
  const completed = {};
  Object.keys(GAME_META).forEach(gameId => {
    selectedLevels[gameId] = 0;
    completed[gameId] = [];
  });
  return {
    version: 2,
    profile: { started: false, name: '' },
    activeGame: 'tents',
    selectedLevels,
    completed,
    boards: {}
  };
}

function readStoredState() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return parsed && parsed.version === 2 ? parsed : null;
  } catch {
    return null;
  }
}

function isUnlockedInState(state, gameId, level) {
  return level === 0 || state.completed[gameId]?.includes(level - 1) || false;
}

function normalizeState(value) {
  const fallback = blankState();
  if (!value || typeof value !== 'object') return fallback;

  const state = blankState();
  state.profile.started = Boolean(value.profile?.started);
  state.profile.name = typeof value.profile?.name === 'string' ? value.profile.name.slice(0, 40) : '';
  state.activeGame = GAME_META[value.activeGame] ? value.activeGame : fallback.activeGame;

  Object.entries(GAME_META).forEach(([gameId, meta]) => {
    const selected = Number.parseInt(value.selectedLevels?.[gameId], 10);
    state.selectedLevels[gameId] = Number.isInteger(selected)
      ? Math.max(0, Math.min(meta.total - 1, selected))
      : 0;

    const completed = Array.isArray(value.completed?.[gameId]) ? value.completed[gameId] : [];
    state.completed[gameId] = [...new Set(completed)]
      .filter(level => Number.isInteger(level) && level >= 0 && level < meta.total)
      .sort((a, b) => a - b);
  });

  state.boards = value.boards && typeof value.boards === 'object' && !Array.isArray(value.boards)
    ? value.boards
    : {};

  Object.entries(GAME_META).forEach(([gameId, meta]) => {
    if (!isUnlockedInState(state, gameId, state.selectedLevels[gameId])) {
      state.selectedLevels[gameId] = Math.min(state.completed[gameId].length, meta.total - 1);
    }
  });
  return state;
}

let appState = normalizeState(readStoredState());

function save({ notify = false } = {}) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
  } catch {
    // The games remain usable when browser storage is unavailable.
  }
  if (notify) listeners.forEach(listener => listener(getState()));
}

export function getState() {
  return clone(appState);
}

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setProfile(name) {
  appState.profile = {
    started: true,
    name: typeof name === 'string' ? name.trim().slice(0, 40) : ''
  };
  save({ notify: true });
}

export function getPlayerName() {
  return appState.profile.name;
}

export function hasStarted() {
  return appState.profile.started;
}

export function playerCallout() {
  return appState.profile.name || 'você';
}

export function setActiveGame(gameId) {
  if (!GAME_META[gameId] || appState.activeGame === gameId) return;
  appState.activeGame = gameId;
  save();
}

export function getActiveGame() {
  return appState.activeGame;
}

export function getSelectedLevel(gameId) {
  return appState.selectedLevels[gameId] ?? 0;
}

export function setSelectedLevel(gameId, level) {
  const meta = GAME_META[gameId];
  if (!meta || !Number.isInteger(level) || level < 0 || level >= meta.total
    || !isUnlockedInState(appState, gameId, level)) return false;
  appState.selectedLevels[gameId] = level;
  save();
  return true;
}

export function completedLevels(gameId) {
  return [...(appState.completed[gameId] || [])];
}

export function isLevelComplete(gameId, level) {
  return appState.completed[gameId]?.includes(level) || false;
}

export function isLevelUnlocked(gameId, level) {
  return Boolean(GAME_META[gameId]) && Number.isInteger(level) && level >= 0
    && level < GAME_META[gameId].total && isUnlockedInState(appState, gameId, level);
}

export function markLevelComplete(gameId, level) {
  if (!GAME_META[gameId] || !Number.isInteger(level) || level < 0
    || level >= GAME_META[gameId].total || !isLevelUnlocked(gameId, level)
    || isLevelComplete(gameId, level)) return false;
  appState.completed[gameId].push(level);
  appState.completed[gameId].sort((a, b) => a - b);
  save({ notify: true });
  return true;
}

function boardKey(gameId, level) {
  return `${gameId}:${level}`;
}

export function getBoardState(gameId, level) {
  const value = appState.boards[boardKey(gameId, level)];
  return value === undefined ? null : clone(value);
}

export function saveBoardState(gameId, level, value) {
  if (!GAME_META[gameId] || !Number.isInteger(level) || level < 0
    || level >= GAME_META[gameId].total || !isUnlockedInState(appState, gameId, level)
    || !value || typeof value !== 'object') return false;
  appState.boards[boardKey(gameId, level)] = clone(value);
  save();
  return true;
}

export function clearBoardState(gameId, level) {
  if (!GAME_META[gameId] || !Number.isInteger(level) || level < 0
    || level >= GAME_META[gameId].total) return false;
  delete appState.boards[boardKey(gameId, level)];
  save();
  return true;
}

export function resetProgress() {
  const profile = clone(appState.profile);
  appState = blankState();
  appState.profile = profile;
  cancelAllAdvances();
  save({ notify: true });
}

export function progressSummary() {
  const total = Object.values(GAME_META).reduce((sum, game) => sum + game.total, 0);
  const completed = Object.keys(GAME_META)
    .reduce((sum, gameId) => sum + appState.completed[gameId].length, 0);
  return { completed, total, percentage: Math.round((completed / total) * 100) };
}

export function renderLevelPicker(container, { gameId, levels, current, onSelect }) {
  container.replaceChildren();
  levels.forEach((level, index) => {
    const button = document.createElement('button');
    const complete = isLevelComplete(gameId, index);
    const unlocked = isLevelUnlocked(gameId, index);
    button.type = 'button';
    button.className = 'level-chip';
    button.dataset.state = complete ? 'complete' : unlocked ? 'open' : 'locked';
    button.disabled = !unlocked;
    button.setAttribute('aria-pressed', String(index === current));
    button.setAttribute(
      'aria-label',
      `${index === current ? 'Nível atual: ' : ''}${level.title}, nível ${index + 1}${complete ? ', concluído' : unlocked ? '' : ', bloqueado'}`
    );

    const number = document.createElement('span');
    number.className = 'level-chip-number';
    number.textContent = String(index + 1).padStart(2, '0');
    const label = document.createElement('span');
    label.textContent = level.title;
    button.append(number, label);

    if (complete) {
      const check = document.createElement('span');
      check.className = 'level-chip-check';
      check.textContent = '✓';
      check.setAttribute('aria-hidden', 'true');
      button.append(check);
    }

    button.addEventListener('click', () => onSelect(index));
    container.append(button);
  });
}

export function showMessage(element, kind, text, { focus = false } = {}) {
  element.textContent = text;
  element.dataset.kind = kind;
  element.hidden = false;
  if (focus) {
    element.tabIndex = -1;
    element.focus({ preventScroll: true });
  }
}

export function clearMessage(element) {
  element.textContent = '';
  element.removeAttribute('data-kind');
  element.hidden = true;
}

export function scheduleAdvance(gameId, callback, delay = 1500) {
  cancelAdvance(gameId);
  const timer = window.setTimeout(() => {
    advanceTimers.delete(gameId);
    callback();
  }, delay);
  advanceTimers.set(gameId, timer);
}

export function cancelAdvance(gameId) {
  const timer = advanceTimers.get(gameId);
  if (timer !== undefined) window.clearTimeout(timer);
  advanceTimers.delete(gameId);
}

export function cancelAllAdvances() {
  advanceTimers.forEach(timer => window.clearTimeout(timer));
  advanceTimers.clear();
}

export function celebrate(element) {
  element.classList.remove('is-celebrating');
  window.requestAnimationFrame(() => element.classList.add('is-celebrating'));
  window.setTimeout(() => element.classList.remove('is-celebrating'), 900);
}

export function moveGridFocus(event, container) {
  const directions = {
    ArrowLeft: [0, -1],
    ArrowRight: [0, 1],
    ArrowUp: [-1, 0],
    ArrowDown: [1, 0]
  };
  const direction = directions[event.key];
  const current = event.target.closest('[data-grid-row][data-grid-col]');
  if (!direction || !current || !container.contains(current)) return false;

  const row = Number(current.dataset.gridRow);
  const col = Number(current.dataset.gridCol);
  const candidates = [...container.querySelectorAll('button[data-grid-row][data-grid-col]:not(:disabled)')];
  const maxRow = Math.max(...candidates.map(cell => Number(cell.dataset.gridRow)));
  const maxCol = Math.max(...candidates.map(cell => Number(cell.dataset.gridCol)));
  let nextRow = row;
  let nextCol = col;

  for (let step = 0; step <= Math.max(maxRow, maxCol) + 1; step += 1) {
    nextRow += direction[0];
    nextCol += direction[1];
    if (nextRow < 0 || nextCol < 0 || nextRow > maxRow || nextCol > maxCol) break;
    const next = candidates.find(cell => (
      Number(cell.dataset.gridRow) === nextRow && Number(cell.dataset.gridCol) === nextCol
    ));
    if (next) {
      event.preventDefault();
      next.focus();
      return true;
    }
  }
  return false;
}
