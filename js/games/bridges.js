import { BRIDGE_LEVELS } from '../puzzles.js';
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
import {
  bridgeKey,
  bridgesCross,
  bridgeTotal,
  deriveBridgeEdges,
  validateBridges
} from '../rules.js';

const NS = 'http://www.w3.org/2000/svg';
const GAME_ID = 'bridges';
const panel = document.querySelector('#panel-bridges');
const picker = panel.querySelector('[data-level-picker]');
const board = panel.querySelector('[data-board]');
const message = panel.querySelector('[data-message]');
const checkButton = panel.querySelector('[data-action="check"]');
const resetButton = panel.querySelector('[data-action="reset"]');
let currentLevel = getSelectedLevel(GAME_ID);
let bridges = {};
let selected = null;

function validStoredBridges(level, value) {
  if (!value || typeof value !== 'object') return {};
  const edgeKeys = new Set(deriveBridgeEdges(level).map(([first, second]) => bridgeKey(first, second)));
  return Object.fromEntries(Object.entries(value).filter(([storedKey, count]) => edgeKeys.has(storedKey) && [1, 2].includes(count)));
}

function setLevel(index) {
  cancelAdvance(GAME_ID);
  currentLevel = index;
  setSelectedLevel(GAME_ID, index);
  const stored = getBoardState(GAME_ID, index);
  bridges = validStoredBridges(BRIDGE_LEVELS[index], stored?.bridges);
  selected = null;
  clearMessage(message);
  render();
}

function position(level, islandIndex) {
  const island = level.islands[islandIndex];
  return { x: 52 + island.col * 68, y: 52 + island.row * 68 };
}

function canAddBridge(level, edge) {
  const [first, second] = edge;
  if (bridgeTotal(level, bridges, first) >= level.islands[first].value) return false;
  if (bridgeTotal(level, bridges, second) >= level.islands[second].value) return false;
  const candidateKey = bridgeKey(first, second);
  const existingEdges = deriveBridgeEdges(level).filter(([a, b]) => (
    bridgeKey(a, b) !== candidateKey && (bridges[bridgeKey(a, b)] || 0) > 0
  ));
  return !existingEdges.some(existing => bridgesCross(level, edge, existing));
}

function updateBridge(first, second) {
  const level = BRIDGE_LEVELS[currentLevel];
  const edge = deriveBridgeEdges(level).find(([a, b]) => (a === first && b === second) || (a === second && b === first));
  if (!edge) {
    selected = second;
    showMessage(message, 'error', 'Essas ilhas não são vizinhas na mesma linha ou coluna. A segunda ilha ficou selecionada.');
    renderBoard();
    return;
  }

  const storedKey = bridgeKey(first, second);
  const current = bridges[storedKey] || 0;
  let next = (current + 1) % 3;
  let notice = '';
  if (next > current && !canAddBridge(level, edge)) {
    if (current === 1) {
      next = 0;
      notice = 'A ponte simples foi removida porque uma ponte dupla ultrapassaria o total da ilha.';
    } else {
      selected = null;
      showMessage(message, 'error', 'Essa ponte ultrapassaria o número de uma ilha ou cruzaria outra ponte.');
      renderBoard();
      return;
    }
  }
  if (next === 0) delete bridges[storedKey];
  else bridges[storedKey] = next;
  selected = null;
  saveBoardState(GAME_ID, currentLevel, { bridges });
  if (notice) showMessage(message, 'info', notice);
  else clearMessage(message);
  renderBoard();
}

function chooseIsland(index) {
  if (selected === null) {
    selected = index;
    showMessage(message, 'info', `Ilha ${index + 1} selecionada. Escolha uma vizinha alinhada.`);
  } else if (selected === index) {
    selected = null;
    clearMessage(message);
  } else {
    updateBridge(selected, index);
    return;
  }
  renderBoard();
}

function appendBridge(svg, level, edge, count) {
  const start = position(level, edge[0]);
  const end = position(level, edge[1]);
  const horizontal = start.y === end.y;
  for (let index = 0; index < count; index += 1) {
    const offset = count === 2 ? (index === 0 ? -4 : 4) : 0;
    const line = document.createElementNS(NS, 'line');
    line.setAttribute('x1', horizontal ? start.x + 19 : start.x + offset);
    line.setAttribute('x2', horizontal ? end.x - 19 : end.x + offset);
    line.setAttribute('y1', horizontal ? start.y + offset : start.y + 19);
    line.setAttribute('y2', horizontal ? end.y + offset : end.y - 19);
    line.classList.add('bridge-line');
    svg.append(line);
  }
}

function renderBoard() {
  const level = BRIDGE_LEVELS[currentLevel];
  const maxRow = Math.max(...level.islands.map(island => island.row));
  const maxCol = Math.max(...level.islands.map(island => island.col));
  const width = 104 + maxCol * 68;
  const height = 104 + maxRow * 68;
  const wrap = document.createElement('div');
  wrap.className = 'bridge-canvas';
  wrap.style.setProperty('--bridge-ratio', String(width / height));
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', `Mapa de ${level.islands.length} ilhas. Use os botões sobre o mapa para construir pontes.`);

  deriveBridgeEdges(level).forEach(edge => {
    const count = bridges[bridgeKey(...edge)] || 0;
    if (count > 0) appendBridge(svg, level, edge, count);
  });
  wrap.append(svg);

  level.islands.forEach((island, index) => {
    const { x, y } = position(level, index);
    const total = bridgeTotal(level, bridges, index);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'island-button';
    button.style.left = `${(x / width) * 100}%`;
    button.style.top = `${(y / height) * 100}%`;
    button.dataset.state = total === island.value ? 'complete' : total > island.value ? 'over' : 'open';
    button.setAttribute('aria-pressed', String(selected === index));
    button.setAttribute('aria-label', `Ilha ${index + 1}: ${total} de ${island.value} pontes${selected === index ? ', selecionada' : ''}`);
    const target = document.createElement('strong');
    target.textContent = island.value;
    const current = document.createElement('span');
    current.textContent = `${total}/${island.value}`;
    button.append(target, current);
    button.addEventListener('click', () => chooseIsland(index));
    wrap.append(button);
  });
  board.replaceChildren(wrap);
}

function check() {
  const result = validateBridges(BRIDGE_LEVELS[currentLevel], bridges);
  if (!result.valid) {
    const messages = {
      degree: `A ilha ${result.index + 1} tem ${result.actual} de ${result.expected} pontes. Ajuste essa conexão.`,
      crossing: 'Há pontes cruzadas. Conecte as ilhas por outro caminho.',
      disconnected: 'As quantidades estão certas, mas ainda existem grupos separados. Todas as ilhas precisam se conectar.',
      'invalid-edge': 'Há uma conexão inválida neste mapa. Reinicie o nível para continuar.'
    };
    showMessage(message, 'error', messages[result.code] || 'Ainda há algo para revisar.', { focus: true });
    return;
  }

  const wasComplete = isLevelComplete(GAME_ID, currentLevel);
  markLevelComplete(GAME_ID, currentLevel);
  celebrate(panel.querySelector('.play-surface'));
  const isLast = currentLevel === BRIDGE_LEVELS.length - 1;
  showMessage(
    message,
    'success',
    `${wasComplete ? 'Rede refeita' : 'Todas as ilhas conectadas'}, ${playerCallout()}! ${isLast ? 'Você concluiu a travessia inteira.' : 'O próximo mapa foi liberado.'}`,
    { focus: true }
  );
  renderPicker();
  if (!isLast) scheduleAdvance(GAME_ID, () => setLevel(currentLevel + 1));
}

function reset() {
  cancelAdvance(GAME_ID);
  clearBoardState(GAME_ID, currentLevel);
  bridges = {};
  selected = null;
  clearMessage(message);
  renderBoard();
  board.querySelector('button')?.focus();
}

function renderPicker() {
  renderLevelPicker(picker, {
    gameId: GAME_ID,
    levels: BRIDGE_LEVELS,
    current: currentLevel,
    onSelect: setLevel
  });
}

function render() {
  renderPicker();
  renderBoard();
}

checkButton.addEventListener('click', check);
resetButton.addEventListener('click', reset);
setLevel(currentLevel);

export function refreshBridges() {
  renderPicker();
}
