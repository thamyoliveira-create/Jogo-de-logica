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
const catalogGrid = document.querySelector('#catalog-grid');
const catalogProgressEl = document.querySelector('[data-catalog-progress]');
const catalogLevelsCompletedEl = document.querySelector('#catalog-levels-completed');
const catalogGamesUnlockedEl = document.querySelector('#catalog-games-unlocked');
const catalogFilterBtns = [...document.querySelectorAll('.catalog-filter-btn')];
const backToCatalogButtons = [...document.querySelectorAll('[data-action="back-to-catalog"]')];
const dialogReturnFocus = new WeakMap();
let currentCatalogFilter = 'all';
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

  if (catalogProgressEl) {
    catalogProgressEl.textContent = `${summary.completed}/${summary.total}`;
  }
  if (catalogLevelsCompletedEl) {
    catalogLevelsCompletedEl.textContent = `${summary.completed}/${summary.total}`;
  }
  if (catalogGamesUnlockedEl) {
    const totalGames = Object.keys(GAME_META).length;
    catalogGamesUnlockedEl.textContent = `${totalGames}/${totalGames}`;
  }

  const state = getState();
  Object.keys(GAME_META).forEach(gameId => {
    const tab = document.querySelector(`#tab-${gameId}`);
    if (tab) {
      const completed = state.completed[gameId]?.length || 0;
      const scoreEl = tab.querySelector('[data-game-progress]');
      if (scoreEl) scoreEl.textContent = `${completed}/${GAME_META[gameId].total}`;
    }
  });
}

function renderCatalog() {
  if (!catalogGrid) return;
  catalogGrid.replaceChildren();
  const state = getState();

  const entries = Object.entries(GAME_META).filter(([, meta]) => {
    if (currentCatalogFilter === 'all') return true;
    return meta.filter === currentCatalogFilter;
  });

  entries.forEach(([gameId, meta]) => {
    const completed = state.completed[gameId]?.length || 0;
    const isComplete = completed === meta.total;
    const nextLevel = Math.min(completed + 1, meta.total);

    const card = document.createElement('article');
    card.className = `catalog-game-card${isComplete ? ' is-complete' : ''}`;
    card.dataset.game = gameId;

    // Header: Badge + Category
    const header = document.createElement('div');
    header.className = 'catalog-card-header';

    const badge = document.createElement('span');
    badge.className = 'catalog-card-badge';
    badge.textContent = isComplete ? '✓ Concluído' : `${completed}/${meta.total} Fases`;

    const category = document.createElement('span');
    category.className = 'catalog-card-category';
    category.textContent = meta.category;

    header.append(badge, category);

    // Main: Icon + Title + Skill Pill
    const main = document.createElement('div');
    main.className = 'catalog-card-main';

    const icon = document.createElement('div');
    icon.className = `catalog-card-icon ${meta.iconClass || ''}`;
    icon.textContent = meta.icon;
    icon.setAttribute('aria-hidden', 'true');

    const titleWrap = document.createElement('div');
    titleWrap.className = 'catalog-card-title-wrap';

    const title = document.createElement('h3');
    title.textContent = meta.label;

    const skills = document.createElement('div');
    skills.className = 'catalog-card-skills';
    const skillPill = document.createElement('span');
    skillPill.className = 'catalog-skill-pill';
    skillPill.textContent = meta.skill;
    skills.append(skillPill);

    titleWrap.append(title, skills);
    main.append(icon, titleWrap);

    // Description
    const desc = document.createElement('p');
    desc.className = 'catalog-card-desc';
    desc.textContent = meta.desc;

    // Footer: Level dots + Play Button
    const footer = document.createElement('div');
    footer.className = 'catalog-card-footer';

    const levelsWrap = document.createElement('div');
    levelsWrap.className = 'catalog-card-levels';
    levelsWrap.setAttribute('aria-label', `Progresso: ${completed} de ${meta.total} fases concluídas`);

    for (let i = 0; i < meta.total; i += 1) {
      const dot = document.createElement('span');
      dot.className = `catalog-level-dot ${
        i < completed ? 'dot-complete' : i === completed ? 'dot-unlocked' : 'dot-locked'
      }`;
      dot.title = `Fase ${i + 1}: ${i < completed ? 'Concluída' : i === completed ? 'Disponível' : 'Bloqueada'}`;
      levelsWrap.append(dot);
    }

    const levelsText = document.createElement('span');
    levelsText.className = 'catalog-card-levels-text';
    levelsText.textContent = `${completed}/${meta.total}`;
    levelsWrap.append(levelsText);

    const playBtn = document.createElement('button');
    playBtn.type = 'button';
    playBtn.className = 'catalog-card-play-btn';
    playBtn.setAttribute('aria-label', `Jogar ${meta.label}`);
    if (completed === 0) {
      playBtn.textContent = 'Começar →';
    } else if (isComplete) {
      playBtn.textContent = 'Rejogar ↺';
    } else {
      playBtn.textContent = `Fase ${nextLevel} →`;
    }

    playBtn.addEventListener('click', e => {
      e.stopPropagation();
      cancelAllAdvances();
      activateGame(gameId, { moveFocus: true });
    });

    card.addEventListener('click', () => {
      cancelAllAdvances();
      activateGame(gameId, { moveFocus: true });
    });

    footer.append(levelsWrap, playBtn);
    card.append(header, main, desc, footer);
    catalogGrid.append(card);
  });
}

function activateGame(gameId, { moveFocus = false } = {}) {
  if (gameId !== 'catalog' && !GAME_META[gameId]) return;
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
  if (gameId === 'catalog') {
    renderCatalog();
  }
}

function render() {
  renderProfile();
  renderProgress();
  renderCatalog();
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
  event.preventDefault();
  if (!hasStarted()) {
    submitProfile('');
  } else {
    closeDialog(profileDialog);
  }
});

profileDialog.addEventListener('click', event => {
  if (event.target === profileDialog) {
    if (!hasStarted()) {
      submitProfile('');
    } else {
      closeDialog(profileDialog);
    }
  }
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

catalogFilterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    currentCatalogFilter = btn.dataset.filter || 'all';
    catalogFilterBtns.forEach(other => {
      other.setAttribute('aria-pressed', String(other === btn));
    });
    renderCatalog();
  });
});

backToCatalogButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    cancelAllAdvances();
    activateGame('catalog', { moveFocus: true });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
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
