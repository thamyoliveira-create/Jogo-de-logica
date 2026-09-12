import { GAME_META } from './puzzles.js';
import {
  cancelAllAdvances,
  getActiveGame,
  getPlayerName,
  getState,
  hasStarted,
  progressSummary,
  resetProgress,
  setActiveGame,
  setProfile,
  subscribe
} from './core.js';
import { refreshTents } from './games/tents.js';
import { refreshWordSearch } from './games/word-search.js';
import { refreshBridges } from './games/bridges.js';
import { refreshFutoshiki } from './games/futoshiki.js';
import { refreshKenKen } from './games/kenken.js';
import { refreshRiver } from './games/river.js';
import { refreshEinstein } from './games/einstein.js';
import { refreshHanoi } from './games/hanoi.js';
import { refreshTwentyFour } from './games/twentyfour.js';
import { refreshKakuro } from './games/kakuro.js';
import { refreshPyramid } from './games/pyramid.js';
import { refreshBalance } from './games/balance.js';

const refreshGames = {
  tents: refreshTents,
  words: refreshWordSearch,
  bridges: refreshBridges,
  futoshiki: refreshFutoshiki,
  kenken: refreshKenKen,
  river: refreshRiver,
  einstein: refreshEinstein,
  hanoi: refreshHanoi,
  twentyfour: refreshTwentyFour,
  kakuro: refreshKakuro,
  pyramid: refreshPyramid,
  balance: refreshBalance
};

const tabs = [...document.querySelectorAll('[role="tab"]')];
const panels = [...document.querySelectorAll('[role="tabpanel"]')];
const profileDialog = document.querySelector('#profile-dialog');
const profileForm = document.querySelector('#profile-form');
const nameInput = document.querySelector('#player-name');
const nameError = document.querySelector('#name-error');
const visitorButton = document.querySelector('#play-as-visitor');
const editProfileButton = document.querySelector('#edit-profile');
const playerDisplay = document.querySelector('#player-display');
const progressValue = document.querySelector('#progress-value');
const progressBar = document.querySelector('#progress-bar');
const progressText = document.querySelector('#progress-text');
const resetAllButton = document.querySelector('#reset-all');
const resetDialog = document.querySelector('#reset-dialog');
const cancelResetButton = document.querySelector('#cancel-reset');
const confirmResetButton = document.querySelector('#confirm-reset');
const firstTab = tabs[0];
const tabList = document.querySelector('[role="tablist"]');
const dialogReturnFocus = new WeakMap();
let lastRenderedSignature = '';

function syncTabOrientation() {
  tabList?.setAttribute('aria-orientation', window.matchMedia('(max-width: 960px)').matches ? 'horizontal' : 'vertical');
}

function openDialog(dialog, trigger) {
  dialogReturnFocus.set(dialog, trigger || document.activeElement);
  if (typeof dialog.showModal === 'function') dialog.showModal();
  else dialog.setAttribute('open', '');
}

function closeDialog(dialog, { restoreFocus = true } = {}) {
  if (typeof dialog.close === 'function') dialog.close();
  else dialog.removeAttribute('open');
  const returnTarget = dialogReturnFocus.get(dialog);
  dialogReturnFocus.delete(dialog);
  if (restoreFocus) returnTarget?.focus?.();
}

function renderProfile() {
  const name = getPlayerName();
  playerDisplay.textContent = name || 'Visitante';
  editProfileButton.setAttribute('aria-label', name ? `Editar nome de ${name}` : 'Adicionar seu nome');
}

function renderProgress() {
  const summary = progressSummary();
  progressValue.textContent = `${summary.completed}/${summary.total}`;
  progressBar.value = summary.completed;
  progressBar.max = summary.total;
  progressText.textContent = `${summary.percentage}% dos desafios concluídos`;

  const state = getState();
  Object.keys(GAME_META).forEach(gameId => {
    const tab = document.querySelector(`#tab-${gameId}`);
    const completed = state.completed[gameId].length;
    tab.querySelector('[data-game-progress]').textContent = `${completed}/${GAME_META[gameId].total}`;
  });
}

function activateGame(gameId, { moveFocus = false } = {}) {
  if (!GAME_META[gameId]) return;
  tabs.forEach(tab => {
    const active = tab.dataset.game === gameId;
    tab.setAttribute('aria-selected', String(active));
    tab.tabIndex = active ? 0 : -1;
    if (active && moveFocus) tab.focus();
  });
  panels.forEach(panel => {
    const active = panel.dataset.game === gameId;
    panel.hidden = !active;
  });
  setActiveGame(gameId);
}

function render() {
  renderProfile();
  renderProgress();
  const state = getState();
  const signature = JSON.stringify(state.completed);
  if (signature !== lastRenderedSignature) {
    Object.values(refreshGames).forEach(refresh => refresh());
    lastRenderedSignature = signature;
  }
}

function submitProfile(name) {
  const returning = hasStarted();
  setProfile(name);
  nameError.hidden = true;
  closeDialog(profileDialog, { restoreFocus: returning });
  render();
  if (!returning) firstTab.focus();
}

profileForm.addEventListener('submit', event => {
  event.preventDefault();
  const name = nameInput.value.trim();
  if (!name) {
    nameError.hidden = false;
    nameInput.setAttribute('aria-invalid', 'true');
    nameInput.focus();
    return;
  }
  nameInput.removeAttribute('aria-invalid');
  submitProfile(name);
});

nameInput.addEventListener('input', () => {
  if (nameInput.value.trim()) {
    nameError.hidden = true;
    nameInput.removeAttribute('aria-invalid');
  }
});

visitorButton.addEventListener('click', () => submitProfile(''));
editProfileButton.addEventListener('click', () => {
  nameInput.value = getPlayerName();
  nameError.hidden = true;
  nameInput.removeAttribute('aria-invalid');
  openDialog(profileDialog, editProfileButton);
  window.setTimeout(() => nameInput.focus(), 0);
});

profileDialog.addEventListener('cancel', event => {
  if (!hasStarted()) {
    event.preventDefault();
    return;
  }
  event.preventDefault();
  closeDialog(profileDialog);
});

profileDialog.addEventListener('click', event => {
  if (event.target === profileDialog && hasStarted()) closeDialog(profileDialog);
});

tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => {
    cancelAllAdvances();
    activateGame(tab.dataset.game);
  });
  tab.addEventListener('keydown', event => {
    let nextIndex = null;
    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') nextIndex = (index + 1) % tabs.length;
    if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') nextIndex = (index - 1 + tabs.length) % tabs.length;
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = tabs.length - 1;
    if (nextIndex === null) return;
    event.preventDefault();
    cancelAllAdvances();
    activateGame(tabs[nextIndex].dataset.game, { moveFocus: true });
  });
});

resetAllButton.addEventListener('click', () => openDialog(resetDialog, resetAllButton));
cancelResetButton.addEventListener('click', () => closeDialog(resetDialog));
confirmResetButton.addEventListener('click', () => {
  resetProgress();
  closeDialog(resetDialog);
  window.location.reload();
});
resetDialog.addEventListener('cancel', event => {
  event.preventDefault();
  closeDialog(resetDialog);
});

window.addEventListener('resize', syncTabOrientation);
syncTabOrientation();
subscribe(render);
activateGame(getActiveGame());
render();

if (!hasStarted()) {
  openDialog(profileDialog);
  window.setTimeout(() => nameInput.focus(), 0);
}
