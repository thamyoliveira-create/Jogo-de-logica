const deepFreeze = value => {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    Object.values(value).forEach(deepFreeze);
  }
  return value;
};

export const GAME_META = deepFreeze({
  tents: {
    label: 'Barracas',
    shortLabel: 'Barracas',
    category: 'Dedução Espacial',
    filter: 'spatial',
    icon: '▲',
    iconClass: 'tents-icon',
    desc: 'Posicione barracas ao lado de árvores respeitando as contagens de linhas e colunas.',
    skill: 'Raciocínio Espacial e Contagem',
    total: 4
  },
  words: {
    label: 'Caça-palavras',
    shortLabel: 'Palavras',
    category: 'Atenção & Inglês',
    filter: 'spatial',
    icon: 'A',
    iconClass: 'words-icon',
    desc: 'Localize termos técnicos de gestão e negócios em inglês na matriz de letras.',
    skill: 'Atenção Visual e Vocabulário',
    total: 3
  },
  bridges: {
    label: 'Ilhas',
    shortLabel: 'Ilhas',
    category: 'Grafos & Redes',
    filter: 'spatial',
    icon: '━',
    iconClass: 'bridges-icon',
    desc: 'Conecte todas as ilhas com pontes retas até atingir a contagem necessária.',
    skill: 'Planejamento e Teoria dos Grafos',
    total: 3
  },
  futoshiki: {
    label: 'Davi e Golias',
    shortLabel: 'Davi e Golias',
    category: 'Inequações & Ordem',
    filter: 'deduction',
    icon: '<',
    iconClass: 'futoshiki-icon',
    desc: 'Preencha a grade latina respeitando sinais de maior (>) e menor (<) entre os números.',
    skill: 'Inequações e Comparação Numérica',
    total: 3
  },
  kenken: {
    label: 'KenKen',
    shortLabel: 'KenKen',
    category: 'Aritmética & Matrizes',
    filter: 'math',
    icon: '×',
    iconClass: 'kenken-icon',
    desc: 'Calcule as operações matemáticas em cada bloco sem repetir números nas linhas e colunas.',
    skill: 'Cálculo Mental e Lógica Combinatória',
    total: 3
  },
  river: {
    label: 'Travessia do Rio',
    shortLabel: 'Travessia',
    category: 'Logística & Algoritmos',
    filter: 'strategy',
    icon: '⛵',
    iconClass: 'river-icon',
    desc: 'Atravesse personagens no barco respeitando restrições de segurança e o teste japonês.',
    skill: 'Planejamento de Estados e Logística',
    total: 3
  },
  einstein: {
    label: 'Enigma de Einstein',
    shortLabel: 'Einstein',
    category: 'Dedução Matricial',
    filter: 'deduction',
    icon: '🧠',
    iconClass: 'einstein-icon',
    desc: 'Deduza as características de cada casa combinando todas as pistas com coloração dinâmica.',
    skill: 'Pensamento Hipotético-Dedutivo',
    total: 3
  },
  hanoi: {
    label: 'Torre de Hanói',
    shortLabel: 'Hanói',
    category: 'Recursão & Estratégia',
    filter: 'strategy',
    icon: '🗼',
    iconClass: 'hanoi-icon',
    desc: 'Transfira todos os discos entre as três torres sem nunca apoiar um disco maior sobre um menor.',
    skill: 'Recursão e Otimização de Movimentos',
    total: 4
  },
  twentyfour: {
    label: 'Jogo do 24',
    shortLabel: 'Jogo do 24',
    category: 'Expressões & Operações',
    filter: 'math',
    icon: '24',
    iconClass: 'twentyfour-icon',
    desc: 'Combine as 4 cartas com operações básicas e parênteses para atingir exatamente 24.',
    skill: 'Expressões Numéricas e Frações',
    total: 4
  },
  kakuro: {
    label: 'Kakuro',
    shortLabel: 'Kakuro',
    category: 'Somas Cruzadas',
    filter: 'math',
    icon: '∑',
    iconClass: 'kakuro-icon',
    desc: 'Preencha as palavras cruzadas numéricas decompondo os totais em dígitos únicos de 1 a 9.',
    skill: 'Partição de Inteiros e Aritmética',
    total: 3
  },
  pyramid: {
    label: 'Pirâmides & Quadrados',
    shortLabel: 'Pirâmides',
    category: 'Estruturas Numéricas',
    filter: 'math',
    icon: '🔺',
    iconClass: 'pyramid-icon',
    desc: 'Resolva pirâmides aritméticas e quadrados mágicos lendários de Lo Shu e Dürer.',
    skill: 'Propriedades Aritméticas e Matrizes',
    total: 4
  },
  balance: {
    label: 'Balança Lógica',
    shortLabel: 'Balança',
    category: 'Sistemas Algébricos',
    filter: 'deduction',
    icon: '⚖️',
    iconClass: 'balance-icon',
    desc: 'Descubra os pesos relativos das formas geométricas e equilibre a balança interativa.',
    skill: 'Sistemas de Equações e Equivalência',
    total: 4
  }
});

export const TENTS_LEVELS = deepFreeze([
  {
    id: 'clareira',
    title: 'Clareira',
    size: 5,
    trees: [[0, 1], [1, 4], [2, 2], [3, 4], [4, 1]],
    rowClues: [2, 0, 1, 1, 1],
    colClues: [1, 1, 0, 1, 2]
  },
  {
    id: 'trilha',
    title: 'Trilha',
    size: 6,
    trees: [[0, 1], [1, 2], [1, 4], [3, 5], [4, 1], [5, 4]],
    rowClues: [2, 0, 2, 0, 1, 1],
    colClues: [2, 0, 1, 1, 1, 1]
  },
  {
    id: 'bosque',
    title: 'Bosque',
    size: 7,
    trees: [[0, 0], [1, 5], [2, 2], [3, 6], [4, 0], [5, 3], [6, 4]],
    rowClues: [2, 0, 1, 1, 1, 1, 1],
    colClues: [1, 1, 1, 1, 0, 2, 1]
  },
  {
    id: 'acampamento',
    title: 'Acampamento',
    size: 8,
    trees: [[0, 1], [1, 4], [2, 1], [3, 6], [4, 1], [5, 4], [6, 1], [7, 6]],
    rowClues: [2, 0, 2, 0, 2, 0, 2, 0],
    colClues: [2, 0, 2, 0, 2, 0, 2, 0]
  }
]);

export const WORD_LEVELS = deepFreeze([
  {
    id: 'organizar',
    title: 'Organizar',
    size: 12,
    seed: 1847,
    words: [
      { word: 'FOCUS', label: 'FOCUS' },
      { word: 'GOAL', label: 'GOAL' },
      { word: 'PLAN', label: 'PLAN' },
      { word: 'DATA', label: 'DATA' },
      { word: 'COST', label: 'COST' },
      { word: 'VALUE', label: 'VALUE' },
      { word: 'TEAM', label: 'TEAM' },
      { word: 'SCOPE', label: 'SCOPE' }
    ]
  },
  {
    id: 'administrar',
    title: 'Administrar',
    size: 14,
    seed: 2911,
    words: [
      { word: 'CLIENT', label: 'CLIENT' },
      { word: 'PROCESS', label: 'PROCESS' },
      { word: 'BUDGET', label: 'BUDGET' },
      { word: 'SUPPLY', label: 'SUPPLY' },
      { word: 'QUALITY', label: 'QUALITY' },
      { word: 'RESULT', label: 'RESULT' },
      { word: 'RESOURCE', label: 'RESOURCE' }
    ]
  },
  {
    id: 'liderar',
    title: 'Liderar',
    size: 14,
    seed: 3769,
    words: [
      { word: 'STRATEGY', label: 'STRATEGY' },
      { word: 'LEADERSHIP', label: 'LEADERSHIP' },
      { word: 'INNOVATION', label: 'INNOVATION' },
      { word: 'EFFICIENCY', label: 'EFFICIENCY' },
      { word: 'VISION', label: 'VISION' },
      { word: 'MANAGEMENT', label: 'MANAGEMENT' }
    ]
  }
]);

export const BRIDGE_LEVELS = deepFreeze([
  {
    id: 'arquipelago',
    title: 'Arquipélago',
    islands: [
      { row: 0, col: 0, value: 2 }, { row: 0, col: 2, value: 3 }, { row: 0, col: 4, value: 2 },
      { row: 2, col: 0, value: 2 }, { row: 2, col: 2, value: 3 }, { row: 2, col: 4, value: 2 }
    ]
  },
  {
    id: 'correnteza',
    title: 'Correnteza',
    islands: [
      { row: 0, col: 0, value: 3 }, { row: 0, col: 2, value: 4 }, { row: 0, col: 4, value: 2 },
      { row: 2, col: 0, value: 2 }, { row: 2, col: 2, value: 5 }, { row: 2, col: 4, value: 3 },
      { row: 4, col: 2, value: 1 }
    ]
  },
  {
    id: 'travessia',
    title: 'Travessia',
    islands: [
      { row: 0, col: 0, value: 2 }, { row: 0, col: 3, value: 3 }, { row: 0, col: 6, value: 2 },
      { row: 2, col: 0, value: 2 }, { row: 2, col: 3, value: 2 }, { row: 2, col: 6, value: 2 },
      { row: 4, col: 0, value: 1 }, { row: 4, col: 3, value: 1 }, { row: 4, col: 6, value: 1 }
    ]
  }
]);

export const FUTOSHIKI_LEVELS = deepFreeze([
  {
    id: 'comparar',
    title: 'Comparar',
    size: 4,
    solution: [
      [1, 2, 3, 4],
      [2, 3, 4, 1],
      [3, 4, 1, 2],
      [4, 1, 2, 3]
    ],
    givens: [
      { row: 0, col: 0, value: 1 }, { row: 0, col: 3, value: 4 },
      { row: 1, col: 0, value: 2 }, { row: 1, col: 2, value: 4 }, { row: 1, col: 3, value: 1 },
      { row: 2, col: 0, value: 3 }, { row: 2, col: 1, value: 4 }, { row: 2, col: 3, value: 2 },
      { row: 3, col: 1, value: 1 }, { row: 3, col: 2, value: 2 }, { row: 3, col: 3, value: 3 }
    ],
    constraints: [
      { a: [0, 1], b: [0, 2], relation: '<' },
      { a: [1, 1], b: [1, 2], relation: '<' },
      { a: [2, 1], b: [2, 2], relation: '>' },
      { a: [3, 0], b: [3, 1], relation: '>' }
    ]
  },
  {
    id: 'equilibrar',
    title: 'Equilibrar',
    size: 4,
    solution: [
      [2, 4, 1, 3],
      [3, 1, 4, 2],
      [1, 3, 2, 4],
      [4, 2, 3, 1]
    ],
    givens: [
      { row: 0, col: 1, value: 4 }, { row: 0, col: 2, value: 1 },
      { row: 1, col: 0, value: 3 }, { row: 1, col: 3, value: 2 },
      { row: 2, col: 0, value: 1 }, { row: 2, col: 3, value: 4 },
      { row: 3, col: 0, value: 4 }, { row: 3, col: 3, value: 1 }
    ],
    constraints: [
      { a: [0, 0], b: [0, 1], relation: '<' },
      { a: [0, 2], b: [0, 3], relation: '<' },
      { a: [1, 1], b: [1, 2], relation: '<' },
      { a: [2, 1], b: [2, 2], relation: '>' },
      { a: [3, 1], b: [3, 2], relation: '<' },
      { a: [0, 0], b: [1, 0], relation: '<' },
      { a: [2, 2], b: [3, 2], relation: '<' }
    ]
  },
  {
    id: 'estrategia',
    title: 'Estratégia',
    size: 5,
    solution: [
      [1, 3, 5, 2, 4],
      [2, 4, 1, 3, 5],
      [3, 5, 2, 4, 1],
      [4, 1, 3, 5, 2],
      [5, 2, 4, 1, 3]
    ],
    givens: [
      { row: 0, col: 0, value: 1 }, { row: 0, col: 3, value: 2 }, { row: 0, col: 4, value: 4 },
      { row: 1, col: 0, value: 2 }, { row: 1, col: 3, value: 3 }, { row: 1, col: 4, value: 5 },
      { row: 2, col: 0, value: 3 }, { row: 2, col: 3, value: 4 }, { row: 2, col: 4, value: 1 },
      { row: 3, col: 0, value: 4 }, { row: 3, col: 3, value: 5 }, { row: 3, col: 4, value: 2 },
      { row: 4, col: 0, value: 5 }, { row: 4, col: 3, value: 1 }, { row: 4, col: 4, value: 3 }
    ],
    constraints: [
      { a: [0, 1], b: [0, 2], relation: '<' },
      { a: [1, 1], b: [1, 2], relation: '>' },
      { a: [2, 1], b: [2, 2], relation: '>' },
      { a: [3, 1], b: [3, 2], relation: '<' },
      { a: [4, 1], b: [4, 2], relation: '<' },
      { a: [0, 2], b: [1, 2], relation: '>' },
      { a: [2, 1], b: [3, 1], relation: '>' }
    ]
  }
]);

export const KENKEN_LEVELS = deepFreeze([
  {
    id: 'operacoes',
    title: 'Operações',
    size: 4,
    solution: [
      [1, 2, 3, 4],
      [2, 3, 4, 1],
      [3, 4, 1, 2],
      [4, 1, 2, 3]
    ],
    cages: [
      { cells: [[0, 0], [1, 0]], operation: '+', target: 3 },
      { cells: [[0, 1], [0, 2]], operation: '+', target: 5 },
      { cells: [[0, 3]], operation: null, target: 4 },
      { cells: [[1, 1], [1, 2]], operation: '−', target: 1 },
      { cells: [[1, 3]], operation: null, target: 1 },
      { cells: [[2, 0], [3, 0]], operation: '−', target: 1 },
      { cells: [[2, 1], [3, 1]], operation: '÷', target: 4 },
      { cells: [[2, 2], [2, 3]], operation: '×', target: 2 },
      { cells: [[3, 2], [3, 3]], operation: '−', target: 1 }
    ]
  },
  {
    id: 'combinar',
    title: 'Combinar',
    size: 4,
    solution: [
      [2, 4, 1, 3],
      [3, 1, 4, 2],
      [1, 3, 2, 4],
      [4, 2, 3, 1]
    ],
    cages: [
      { cells: [[0, 0]], operation: null, target: 2 },
      { cells: [[0, 1], [1, 1]], operation: '÷', target: 4 },
      { cells: [[0, 2]], operation: null, target: 1 },
      { cells: [[0, 3], [1, 3]], operation: '−', target: 1 },
      { cells: [[1, 0]], operation: null, target: 3 },
      { cells: [[1, 2], [2, 2]], operation: '÷', target: 2 },
      { cells: [[2, 0], [2, 1]], operation: '+', target: 4 },
      { cells: [[2, 3], [3, 3]], operation: '÷', target: 4 },
      { cells: [[3, 0], [3, 1]], operation: '÷', target: 2 },
      { cells: [[3, 2]], operation: null, target: 3 }
    ]
  },
  {
    id: 'desafio-final',
    title: 'Desafio final',
    size: 4,
    solution: [
      [3, 1, 4, 2],
      [4, 2, 1, 3],
      [2, 4, 3, 1],
      [1, 3, 2, 4]
    ],
    cages: [
      { cells: [[0, 0], [0, 1], [1, 0]], operation: '×', target: 12 },
      { cells: [[0, 2]], operation: null, target: 4 },
      { cells: [[0, 3]], operation: null, target: 2 },
      { cells: [[1, 1], [1, 2]], operation: '×', target: 2 },
      { cells: [[1, 3], [2, 3]], operation: '÷', target: 3 },
      { cells: [[2, 0], [3, 0]], operation: '÷', target: 2 },
      { cells: [[2, 1], [2, 2], [3, 1]], operation: '+', target: 10 },
      { cells: [[3, 2], [3, 3]], operation: '×', target: 8 }
    ]
  }
]);

export const RIVER_LEVELS = deepFreeze([
  {
    id: 'fazendeiro',
    title: 'O Fazendeiro e o Rio',
    capacity: 2,
    minMoves: 7,
    characters: [
      { id: 'farmer', name: 'Fazendeiro', role: 'Piloto', icon: '👨‍🌾', isPilot: true, group: 'farmer' },
      { id: 'wolf', name: 'Lobo', role: 'Animal', icon: '🐺', isPilot: false, group: 'wolf' },
      { id: 'sheep', name: 'Ovelha', role: 'Animal', icon: '🐑', isPilot: false, group: 'sheep' },
      { id: 'cabbage', name: 'Couve', role: 'Carga', icon: '🥬', isPilot: false, group: 'cabbage' }
    ],
    rulesDescription: [
      'O Fazendeiro é o único que sabe remar o barco.',
      'O barco transporta no máximo 2 itens por vez (o Fazendeiro e mais um elemento).',
      'Sem o Fazendeiro por perto, o Lobo come a Ovelha.',
      'Sem o Fazendeiro por perto, a Ovelha come a Couve.'
    ]
  },
  {
    id: 'familia',
    title: 'Passeio da Família',
    capacity: 2,
    minMoves: 9,
    characters: [
      { id: 'father', name: 'Pai', role: 'Adulto', icon: '👨', isPilot: true, group: 'father' },
      { id: 'mother', name: 'Mãe', role: 'Adulto', icon: '👩', isPilot: true, group: 'mother' },
      { id: 'son', name: 'Filho', role: 'Criança', icon: '👦', isPilot: false, group: 'boy' },
      { id: 'daughter', name: 'Filha', role: 'Criança', icon: '👧', isPilot: false, group: 'girl' },
      { id: 'dog', name: 'Cachorro', role: 'Animal', icon: '🐕', isPilot: false, group: 'dog' }
    ],
    rulesDescription: [
      'Apenas o Pai e a Mãe sabem pilotar o barco.',
      'O barco transporta no máximo 2 pessoas/animais por vez.',
      'O Pai não pode ficar com a Filha sem a presença da Mãe.',
      'A Mãe não pode ficar com o Filho sem a presença do Pai.',
      'O Cachorro não pode ficar com as crianças sem a presença de um adulto.'
    ]
  },
  {
    id: 'japones',
    title: 'O Teste Japonês de QI (8 Personagens)',
    capacity: 2,
    minMoves: 17,
    characters: [
      { id: 'police', name: 'Policial', role: 'Oficial', icon: '👮', isPilot: true, group: 'police' },
      { id: 'thief', name: 'Ladrão', role: 'Prisioneiro', icon: '🦹', isPilot: false, group: 'thief' },
      { id: 'father', name: 'Pai', role: 'Adulto', icon: '👨', isPilot: true, group: 'father' },
      { id: 'mother', name: 'Mãe', role: 'Adulto', icon: '👩', isPilot: true, group: 'mother' },
      { id: 'boy1', name: 'Filho 1', role: 'Criança', icon: '👦', isPilot: false, group: 'boy' },
      { id: 'boy2', name: 'Filho 2', role: 'Criança', icon: '👦', isPilot: false, group: 'boy' },
      { id: 'girl1', name: 'Filha 1', role: 'Criança', icon: '👧', isPilot: false, group: 'girl' },
      { id: 'girl2', name: 'Filha 2', role: 'Criança', icon: '👧', isPilot: false, group: 'girl' }
    ],
    rulesDescription: [
      'O barco transporta no máximo 2 pessoas por vez.',
      'Apenas Pai, Mãe e Policial sabem pilotar o barco.',
      'O Pai não pode ficar com nenhuma das filhas sem a presença da Mãe.',
      'A Mãe não pode ficar com nenhum dos filhos sem a presença do Pai.',
      'O Ladrão não pode ficar perto de nenhum membro da família sem a guarda do Policial.'
    ]
  }
]);

export const EINSTEIN_LEVELS = deepFreeze([
  {
    id: 'einstein-3',
    title: 'Primeiras Deduções (3 Casas)',
    houses: 3,
    categories: [
      { id: 'cor', label: 'Cor da Casa', values: ['Amarela', 'Azul', 'Vermelha'] },
      { id: 'animal', label: 'Animal', values: ['Cachorro', 'Gato', 'Pássaro'] },
      { id: 'bebida', label: 'Bebida', values: ['Chá', 'Leite', 'Suco'] }
    ],
    solution: [
      { cor: 'Amarela', animal: 'Gato', bebida: 'Chá' },
      { cor: 'Azul', animal: 'Pássaro', bebida: 'Leite' },
      { cor: 'Vermelha', animal: 'Cachorro', bebida: 'Suco' }
    ],
    question: 'Deduz a posição, a cor, o animal e a bebida de cada uma das 3 casas.',
    clues: [
      { text: 'A casa do meio (Casa 2) consome Leite.', check: { type: 'house-value', house: 1, category: 'bebida', value: 'Leite' } },
      { text: 'O dono do Cachorro mora na casa Vermelha.', check: { type: 'same-house', cat1: 'animal', val1: 'Cachorro', cat2: 'cor', val2: 'Vermelha' } },
      { text: 'A casa Amarela fica imediatamente à esquerda da casa Azul.', check: { type: 'left-of', cat1: 'cor', val1: 'Amarela', cat2: 'cor', val2: 'Azul' } },
      { text: 'O dono do Gato bebe Chá.', check: { type: 'same-house', cat1: 'animal', val1: 'Gato', cat2: 'bebida', val2: 'Chá' } },
      { text: 'O dono do Pássaro mora na Casa 2.', check: { type: 'house-value', house: 1, category: 'animal', value: 'Pássaro' } },
      { text: 'A pessoa que bebe Suco mora na Casa 3.', check: { type: 'house-value', house: 2, category: 'bebida', value: 'Suco' } }
    ]
  },
  {
    id: 'einstein-4',
    title: 'Dedução das 4 Casas',
    houses: 4,
    categories: [
      { id: 'cor', label: 'Cor da Casa', values: ['Amarela', 'Azul', 'Vermelha', 'Verde'] },
      { id: 'nacionalidade', label: 'Nacionalidade', values: ['Brasileiro', 'Italiano', 'Espanhol', 'Francês'] },
      { id: 'bebida', label: 'Bebida', values: ['Café', 'Chá', 'Leite', 'Suco'] },
      { id: 'esporte', label: 'Esporte', values: ['Futebol', 'Basquete', 'Xadrez', 'Natação'] }
    ],
    solution: [
      { cor: 'Amarela', nacionalidade: 'Brasileiro', bebida: 'Suco', esporte: 'Futebol' },
      { cor: 'Azul', nacionalidade: 'Italiano', bebida: 'Chá', esporte: 'Natação' },
      { cor: 'Vermelha', nacionalidade: 'Espanhol', bebida: 'Leite', esporte: 'Xadrez' },
      { cor: 'Verde', nacionalidade: 'Francês', bebida: 'Café', esporte: 'Basquete' }
    ],
    question: 'Quem é o Francês e qual esporte ele pratica?',
    clues: [
      { text: 'O Brasileiro mora na primeira casa (Casa 1).', check: { type: 'house-value', house: 0, category: 'nacionalidade', value: 'Brasileiro' } },
      { text: 'A casa Verde fica na quarta posição (Casa 4) e seu morador bebe Café.', check: { type: 'same-house', cat1: 'cor', val1: 'Verde', cat2: 'bebida', val2: 'Café' } },
      { text: 'O morador da casa Vermelha joga Xadrez.', check: { type: 'same-house', cat1: 'cor', val1: 'Vermelha', cat2: 'esporte', val2: 'Xadrez' } },
      { text: 'O Italiano mora ao lado da casa Amarela.', check: { type: 'neighbor', cat1: 'nacionalidade', val1: 'Italiano', cat2: 'cor', val2: 'Amarela' } },
      { text: 'A casa Azul é a Casa 2 e seu morador bebe Chá.', check: { type: 'house-value', house: 1, category: 'cor', value: 'Azul' } },
      { text: 'O Espanhol bebe Leite.', check: { type: 'same-house', cat1: 'nacionalidade', val1: 'Espanhol', cat2: 'bebida', val2: 'Leite' } },
      { text: 'Quem joga Futebol mora na casa Amarela.', check: { type: 'same-house', cat1: 'esporte', val1: 'Futebol', cat2: 'cor', val2: 'Amarela' } },
      { text: 'O nadador (Natação) mora na casa Azul.', check: { type: 'same-house', cat1: 'esporte', val1: 'Natação', cat2: 'cor', val2: 'Azul' } },
      { text: 'O Francês joga Basquete.', check: { type: 'same-house', cat1: 'nacionalidade', val1: 'Francês', cat2: 'esporte', val2: 'Basquete' } },
      { text: 'A Casa 3 é Vermelha.', check: { type: 'house-value', house: 2, category: 'cor', value: 'Vermelha' } }
    ]
  },
  {
    id: 'einstein-5',
    title: 'O Enigma de Einstein (5 Casas)',
    houses: 5,
    categories: [
      { id: 'cor', label: 'Cor da Casa', values: ['Amarela', 'Azul', 'Vermelha', 'Verde', 'Branca'] },
      { id: 'nacionalidade', label: 'Nacionalidade', values: ['Norueguês', 'Dinamarquês', 'Inglês', 'Alemão', 'Sueco'] },
      { id: 'bebida', label: 'Bebida', values: ['Água', 'Chá', 'Leite', 'Café', 'Suco'] },
      { id: 'hobby', label: 'Hobby', values: ['Esportes', 'Leitura', 'Música', 'Xadrez', 'Fotografia'] },
      { id: 'animal', label: 'Animal', values: ['Gatos', 'Cavalo', 'Pássaro', 'Peixe', 'Cachorro'] }
    ],
    solution: [
      { cor: 'Amarela', nacionalidade: 'Norueguês', bebida: 'Água', hobby: 'Esportes', animal: 'Gatos' },
      { cor: 'Azul', nacionalidade: 'Dinamarquês', bebida: 'Chá', hobby: 'Leitura', animal: 'Cavalo' },
      { cor: 'Vermelha', nacionalidade: 'Inglês', bebida: 'Leite', hobby: 'Música', animal: 'Pássaro' },
      { cor: 'Verde', nacionalidade: 'Alemão', bebida: 'Café', hobby: 'Xadrez', animal: 'Peixe' },
      { cor: 'Branca', nacionalidade: 'Sueco', bebida: 'Suco', hobby: 'Fotografia', animal: 'Cachorro' }
    ],
    question: 'Resolva o enigma histórico: QUEM É O DONO DO PEIXE?',
    clues: [
      { text: '1. O Norueguês vive na primeira casa (Casa 1).', check: { type: 'house-value', house: 0, category: 'nacionalidade', value: 'Norueguês' } },
      { text: '2. O Inglês vive na casa Vermelha.', check: { type: 'same-house', cat1: 'nacionalidade', val1: 'Inglês', cat2: 'cor', val2: 'Vermelha' } },
      { text: '3. A casa Verde fica imediatamente à esquerda da casa Branca.', check: { type: 'left-of', cat1: 'cor', val1: 'Verde', cat2: 'cor', val2: 'Branca' } },
      { text: '4. O Dinamarquês bebe Chá.', check: { type: 'same-house', cat1: 'nacionalidade', val1: 'Dinamarquês', cat2: 'bebida', val2: 'Chá' } },
      { text: '5. Quem pratica Esportes mora na casa Amarela.', check: { type: 'same-house', cat1: 'hobby', val1: 'Esportes', cat2: 'cor', val2: 'Amarela' } },
      { text: '6. A pessoa que pratica Música cria Pássaros.', check: { type: 'same-house', cat1: 'hobby', val1: 'Música', cat2: 'animal', val2: 'Pássaro' } },
      { text: '7. O morador da casa do meio (Casa 3) bebe Leite.', check: { type: 'house-value', house: 2, category: 'bebida', value: 'Leite' } },
      { text: '8. O Alemão joga Xadrez.', check: { type: 'same-house', cat1: 'nacionalidade', val1: 'Alemão', cat2: 'hobby', val2: 'Xadrez' } },
      { text: '9. O Norueguês vive ao lado da casa Azul.', check: { type: 'neighbor', cat1: 'nacionalidade', val1: 'Norueguês', cat2: 'cor', val2: 'Azul' } },
      { text: '10. Quem pratica Leitura mora ao lado de quem cria Gatos.', check: { type: 'neighbor', cat1: 'hobby', val1: 'Leitura', cat2: 'animal', val2: 'Gatos' } },
      { text: '11. Quem cria Cavalos mora ao lado de quem pratica Esportes.', check: { type: 'neighbor', cat1: 'animal', val1: 'Cavalo', cat2: 'hobby', val2: 'Esportes' } },
      { text: '12. O morador da casa Verde bebe Café.', check: { type: 'same-house', cat1: 'cor', val1: 'Verde', cat2: 'bebida', val2: 'Café' } },
      { text: '13. Quem pratica Fotografia bebe Suco.', check: { type: 'same-house', cat1: 'hobby', val1: 'Fotografia', cat2: 'bebida', val2: 'Suco' } },
      { text: '14. O Sueco cria Cachorros.', check: { type: 'same-house', cat1: 'nacionalidade', val1: 'Sueco', cat2: 'animal', val2: 'Cachorro' } },
      { text: '15. Quem pratica Leitura é vizinho de quem bebe Água.', check: { type: 'neighbor', cat1: 'hobby', val1: 'Leitura', cat2: 'bebida', val2: 'Água' } }
    ]
  }
]);

export const HANOI_LEVELS = deepFreeze([
  {
    id: 'hanoi-3',
    title: '3 Discos (Básico)',
    discs: 3,
    minMoves: 7,
    description: 'Transfira todos os 3 discos da Haste A para a Haste C.'
  },
  {
    id: 'hanoi-4',
    title: '4 Discos (Intermediário)',
    discs: 4,
    minMoves: 15,
    description: 'Transfira todos os 4 discos com estratégia e sem erros.'
  },
  {
    id: 'hanoi-5',
    title: '5 Discos (Avançado)',
    discs: 5,
    minMoves: 31,
    description: 'Um teste avançado de planejamento sequencial e foco.'
  },
  {
    id: 'hanoi-6',
    title: '6 Discos (Mestre do QI)',
    discs: 6,
    minMoves: 63,
    description: 'O grande desafio de raciocínio recursivo: 63 movimentos perfeitos!'
  }
]);

export const TWENTYFOUR_LEVELS = deepFreeze([
  {
    id: 'tf-1',
    title: 'Nível 1 (Iniciante)',
    numbers: [2, 3, 4, 6],
    target: 24,
    description: 'Combine os 4 números com +, -, ×, ÷ e parênteses para obter exatamente 24.',
    hint: 'Dica: Você pode tentar agrupar (6 × 4) ou formar multiplicações simples.'
  },
  {
    id: 'tf-2',
    title: 'Nível 2 (Médio - Frações)',
    numbers: [1, 5, 5, 5],
    target: 24,
    description: 'Um clássico das olimpíadas de matemática: use divisão para criar uma fração intermediária!',
    hint: 'Dica: Pense em quanto vale 5 - 1/5 e multiplique pelo último 5!'
  },
  {
    id: 'tf-3',
    title: 'Nível 3 (Avançado)',
    numbers: [3, 3, 8, 8],
    target: 24,
    description: 'Desafio de alta dedução: a divisão pelo inverso fracionário.',
    hint: 'Dica: Quanto é 8 dividido por (3 - 8/3)?'
  },
  {
    id: 'tf-4',
    title: 'Nível 4 (Mestre Olímpico)',
    numbers: [4, 4, 10, 10],
    target: 24,
    description: 'Manipulação de centenas e divisão.',
    hint: 'Dica: Pense em (10 × 10 - 4) / 4.'
  }
]);

export const KAKURO_LEVELS = deepFreeze([
  {
    id: 'kakuro-3x3',
    title: 'Grid 3×3 (Introdução)',
    rows: 3,
    cols: 3,
    description: 'Preencha os espaços brancos com números de 1 a 9 para atingir as somas indicadas sem repetir dígitos no mesmo bloco.',
    grid: [
      [{ type: 'black' }, { type: 'clue', colClue: 4 }, { type: 'clue', colClue: 6 }],
      [{ type: 'clue', rowClue: 3 }, { type: 'white', row: 1, col: 1 }, { type: 'white', row: 1, col: 2 }],
      [{ type: 'clue', rowClue: 7 }, { type: 'white', row: 2, col: 1 }, { type: 'white', row: 2, col: 2 }]
    ],
    cells: [
      { row: 1, col: 1 },
      { row: 1, col: 2 },
      { row: 2, col: 1 },
      { row: 2, col: 2 }
    ],
    runs: [
      { id: 'r1', type: 'horizontal', clue: 3, cells: [[1, 1], [1, 2]] },
      { id: 'r2', type: 'horizontal', clue: 7, cells: [[2, 1], [2, 2]] },
      { id: 'c1', type: 'vertical', clue: 4, cells: [[1, 1], [2, 1]] },
      { id: 'c2', type: 'vertical', clue: 6, cells: [[1, 2], [2, 2]] }
    ],
    solution: {
      '1,1': 1,
      '1,2': 2,
      '2,1': 3,
      '2,2': 4
    }
  },
  {
    id: 'kakuro-4x4',
    title: 'Grid 4×4 (Médio)',
    rows: 4,
    cols: 4,
    description: 'Deduza combinações de 3 dígitos únicos por linha e coluna que somam as pistas indicadas.',
    grid: [
      [{ type: 'black' }, { type: 'clue', colClue: 16 }, { type: 'clue', colClue: 16 }, { type: 'clue', colClue: 8 }],
      [{ type: 'clue', rowClue: 17 }, { type: 'white', row: 1, col: 1 }, { type: 'white', row: 1, col: 2 }, { type: 'white', row: 1, col: 3 }],
      [{ type: 'clue', rowClue: 16 }, { type: 'white', row: 2, col: 1 }, { type: 'white', row: 2, col: 2 }, { type: 'white', row: 2, col: 3 }],
      [{ type: 'clue', rowClue: 7 }, { type: 'white', row: 3, col: 1 }, { type: 'white', row: 3, col: 2 }, { type: 'white', row: 3, col: 3 }]
    ],
    cells: [
      { row: 1, col: 1 }, { row: 1, col: 2 }, { row: 1, col: 3 },
      { row: 2, col: 1 }, { row: 2, col: 2 }, { row: 2, col: 3 },
      { row: 3, col: 1 }, { row: 3, col: 2 }, { row: 3, col: 3 }
    ],
    runs: [
      { id: 'r1', type: 'horizontal', clue: 17, cells: [[1, 1], [1, 2], [1, 3]] },
      { id: 'r2', type: 'horizontal', clue: 16, cells: [[2, 1], [2, 2], [2, 3]] },
      { id: 'r3', type: 'horizontal', clue: 7, cells: [[3, 1], [3, 2], [3, 3]] },
      { id: 'c1', type: 'vertical', clue: 16, cells: [[1, 1], [2, 1], [3, 1]] },
      { id: 'c2', type: 'vertical', clue: 16, cells: [[1, 2], [2, 2], [3, 2]] },
      { id: 'c3', type: 'vertical', clue: 8, cells: [[1, 3], [2, 3], [3, 3]] }
    ],
    solution: {
      '1,1': 7, '1,2': 9, '1,3': 1,
      '2,1': 8, '2,2': 5, '2,3': 3,
      '3,1': 1, '3,2': 2, '3,3': 4
    }
  },
  {
    id: 'kakuro-5x5',
    title: 'Grid 5×5 (Avançado Cruzado)',
    rows: 5,
    cols: 5,
    description: 'Desafio complexo de interseções e partições numéricas sem repetições.',
    grid: [
      [{ type: 'black' }, { type: 'clue', colClue: 14 }, { type: 'clue', colClue: 21 }, { type: 'black' }, { type: 'black' }],
      [{ type: 'clue', rowClue: 7 }, { type: 'white', row: 1, col: 1 }, { type: 'white', row: 1, col: 2 }, { type: 'clue', colClue: 21 }, { type: 'clue', colClue: 7 }],
      [{ type: 'clue', rowClue: 23 }, { type: 'white', row: 2, col: 1 }, { type: 'white', row: 2, col: 2 }, { type: 'white', row: 2, col: 3 }, { type: 'white', row: 2, col: 4 }],
      [{ type: 'clue', rowClue: 18 }, { type: 'white', row: 3, col: 1 }, { type: 'white', row: 3, col: 2 }, { type: 'white', row: 3, col: 3 }, { type: 'white', row: 3, col: 4 }],
      [{ type: 'clue', rowClue: 15 }, { type: 'white', row: 4, col: 1 }, { type: 'white', row: 4, col: 2 }, { type: 'white', row: 4, col: 3 }, { type: 'black' }]
    ],
    cells: [
      { row: 1, col: 1 }, { row: 1, col: 2 },
      { row: 2, col: 1 }, { row: 2, col: 2 }, { row: 2, col: 3 }, { row: 2, col: 4 },
      { row: 3, col: 1 }, { row: 3, col: 2 }, { row: 3, col: 3 }, { row: 3, col: 4 },
      { row: 4, col: 1 }, { row: 4, col: 2 }, { row: 4, col: 3 }
    ],
    runs: [
      { id: 'r1', type: 'horizontal', clue: 7, cells: [[1, 1], [1, 2]] },
      { id: 'r2', type: 'horizontal', clue: 23, cells: [[2, 1], [2, 2], [2, 3], [2, 4]] },
      { id: 'r3', type: 'horizontal', clue: 18, cells: [[3, 1], [3, 2], [3, 3], [3, 4]] },
      { id: 'r4', type: 'horizontal', clue: 15, cells: [[4, 1], [4, 2], [4, 3]] },
      { id: 'c1', type: 'vertical', clue: 14, cells: [[1, 1], [2, 1], [3, 1], [4, 1]] },
      { id: 'c2', type: 'vertical', clue: 21, cells: [[1, 2], [2, 2], [3, 2], [4, 2]] },
      { id: 'c3', type: 'vertical', clue: 21, cells: [[2, 3], [3, 3], [4, 3]] },
      { id: 'c4', type: 'vertical', clue: 7, cells: [[2, 4], [3, 4]] }
    ],
    solution: {
      '1,1': 3, '1,2': 4,
      '2,1': 8, '2,2': 1, '2,3': 9, '2,4': 5,
      '3,1': 1, '3,2': 7, '3,3': 8, '3,4': 2,
      '4,1': 2, '4,2': 9, '4,3': 4
    }
  }
]);

export const PYRAMID_LEVELS = deepFreeze([
  {
    id: 'pyr-1',
    type: 'pyramid',
    title: 'Pirâmide de Adição (3 Níveis)',
    op: '+',
    description: 'Cada tijolo superior é a SOMA dos dois tijolos diretamente abaixo dele.',
    layers: [
      [{ value: null, given: false }],
      [{ value: 8, given: true }, { value: null, given: false }],
      [{ value: 3, given: true }, { value: 5, given: true }, { value: 7, given: true }]
    ],
    solution: [
      [20],
      [8, 12],
      [3, 5, 7]
    ]
  },
  {
    id: 'pyr-2',
    type: 'pyramid',
    title: 'Pirâmide Inversa (4 Níveis)',
    op: '+',
    description: 'Use dedução direta e inversa (subtração) para preencher todos os tijolos vazios.',
    layers: [
      [{ value: 50, given: true }],
      [{ value: null, given: false }, { value: 28, given: true }],
      [{ value: 9, given: true }, { value: null, given: false }, { value: 15, given: true }],
      [{ value: 4, given: true }, { value: 5, given: true }, { value: null, given: false }, { value: 7, given: true }]
    ],
    solution: [
      [50],
      [22, 28],
      [9, 13, 15],
      [4, 5, 8, 7]
    ]
  },
  {
    id: 'magic-3x3',
    type: 'magicsquare',
    title: 'Quadrado Mágico 3×3 (Lo Shu)',
    size: 3,
    magicConstant: 15,
    description: 'Preencha com números de 1 a 9 sem repetir. Todas as 3 linhas, 3 colunas e 2 diagonais devem somar exatamente 15!',
    initialGrid: [
      [8, null, 6],
      [null, 5, null],
      [4, null, 2]
    ],
    solution: [
      [8, 1, 6],
      [3, 5, 7],
      [4, 9, 2]
    ]
  },
  {
    id: 'magic-4x4',
    type: 'magicsquare',
    title: 'Quadrado Mágico 4×4 de Dürer',
    size: 4,
    magicConstant: 34,
    description: 'Obra prima renascentista: use os números de 1 a 16 para que todas as linhas, colunas e diagonais somem 34!',
    initialGrid: [
      [16, 3, 2, null],
      [5, null, 11, 8],
      [null, 6, 7, 12],
      [4, 15, null, 1]
    ],
    solution: [
      [16, 3, 2, 13],
      [5, 10, 11, 8],
      [9, 6, 7, 12],
      [4, 15, 14, 1]
    ]
  }
]);

export const BALANCE_LEVELS = deepFreeze([
  {
    id: 'bal-1',
    title: 'Balança 1 (Dedução Direta)',
    description: 'Descubra a relação de peso entre as formas geométricas e equilibre a balança misteriosa!',
    shapes: [
      { id: 'circle', name: 'Círculo', icon: '🔵', weight: 2 },
      { id: 'triangle', name: 'Triângulo', icon: '🔺', weight: 3 },
      { id: 'square', name: 'Quadrado', icon: '🟩', weight: 5 }
    ],
    referenceScales: [
      {
        id: 'ref-1',
        title: 'Balança de Referência A',
        left: ['circle', 'circle', 'circle'], // 3 * 2 = 6
        right: ['triangle', 'triangle']       // 2 * 3 = 6
      },
      {
        id: 'ref-2',
        title: 'Balança de Referência B',
        left: ['square'],                     // 5
        right: ['triangle', 'circle']         // 3 + 2 = 5
      }
    ],
    mysteryScale: {
      id: 'mystery',
      title: 'Balança Misteriosa (Equilibre o prato direito)',
      left: ['square', 'triangle'], // 5 + 3 = 8
      allowedShapes: ['circle', 'triangle', 'square']
    },
    solution: {
      rightPan: ['square', 'triangle']
    },
    hint: '3 Círculos = 2 Triângulos e 1 Quadrado = 1 Triângulo + 1 Círculo. Quanto pesam juntos 1 Quadrado e 1 Triângulo?'
  },
  {
    id: 'bal-2',
    title: 'Balança 2 (Estrelas e Diamantes)',
    description: 'Analise o sistema de equilíbrio e coloque as peças necessárias no prato direito.',
    shapes: [
      { id: 'moon', name: 'Lua', icon: '🌙', weight: 2 },
      { id: 'diamond', name: 'Diamante', icon: '💎', weight: 4 },
      { id: 'star', name: 'Estrela', icon: '⭐', weight: 6 }
    ],
    referenceScales: [
      {
        id: 'ref-1',
        title: 'Balança de Referência A',
        left: ['star'],                       // 6
        right: ['diamond', 'moon']            // 4 + 2 = 6
      },
      {
        id: 'ref-2',
        title: 'Balança de Referência B',
        left: ['diamond'],                    // 4
        right: ['moon', 'moon']               // 2 + 2 = 4
      }
    ],
    mysteryScale: {
      id: 'mystery',
      title: 'Balança Misteriosa',
      left: ['star', 'diamond'], // 6 + 4 = 10
      allowedShapes: ['moon', 'diamond', 'star']
    },
    solution: {
      rightPan: ['star', 'diamond']
    },
    hint: '1 Diamante vale 2 Luas. 1 Estrela vale 1 Diamante + 1 Lua. Quantas Luas equivalem a 1 Estrela + 1 Diamante?'
  },
  {
    id: 'bal-3',
    title: 'Balança 3 (Sistema de 3 Incógnitas)',
    description: 'Deduza os pesos relativos com 3 tipos de blocos mágicos.',
    shapes: [
      { id: 'heart', name: 'Coração', icon: '❤️', weight: 3 },
      { id: 'gem', name: 'Gema Roxa', icon: '🔮', weight: 4 },
      { id: 'gold', name: 'Barra de Ouro', icon: '🪙', weight: 7 }
    ],
    referenceScales: [
      {
        id: 'ref-1',
        title: 'Balança 1',
        left: ['gold'],                       // 7
        right: ['gem', 'heart']               // 4 + 3 = 7
      },
      {
        id: 'ref-2',
        title: 'Balança 2',
        left: ['gem', 'gem', 'heart'],        // 4 + 4 + 3 = 11
        right: ['gold', 'gem']                // 7 + 4 = 11
      },
      {
        id: 'ref-3',
        title: 'Balança 3',
        left: ['gold', 'gold'],               // 14
        right: ['gem', 'gem', 'heart', 'heart'] // 8 + 6 = 14
      }
    ],
    mysteryScale: {
      id: 'mystery',
      title: 'Balança Misteriosa',
      left: ['gold', 'heart'], // 7 + 3 = 10
      allowedShapes: ['heart', 'gem', 'gold']
    },
    solution: {
      rightPan: ['gold', 'heart']
    },
    hint: '1 Barra de Ouro = 1 Gema + 1 Coração. Descubra como equilibrar 1 Barra de Ouro + 1 Coração.'
  },
  {
    id: 'bal-4',
    title: 'Balança 4 (Desafio dos Elementos Químicos)',
    description: 'Sistema algébrico com 4 substâncias em equilíbrio perfeito.',
    shapes: [
      { id: 'fire', name: 'Fogo', icon: '🔥', weight: 4 },
      { id: 'water', name: 'Água', icon: '💧', weight: 3 },
      { id: 'earth', name: 'Terra', icon: '🌿', weight: 7 },
      { id: 'air', name: 'Ar', icon: '💨', weight: 10 }
    ],
    referenceScales: [
      {
        id: 'ref-1',
        title: 'Balança A',
        left: ['air'],                        // 10
        right: ['earth', 'water']             // 7 + 3 = 10
      },
      {
        id: 'ref-2',
        title: 'Balança B',
        left: ['earth'],                      // 7
        right: ['fire', 'water']              // 4 + 3 = 7
      },
      {
        id: 'ref-3',
        title: 'Balança C',
        left: ['fire', 'water', 'water'],     // 4 + 3 + 3 = 10
        right: ['air']                        // 10
      }
    ],
    mysteryScale: {
      id: 'mystery',
      title: 'Balança Misteriosa',
      left: ['air', 'earth'], // 10 + 7 = 17
      allowedShapes: ['fire', 'water', 'earth', 'air']
    },
    solution: {
      rightPan: ['air', 'earth']
    },
    hint: 'Substitua as variáveis sucessivamente para encontrar a combinação de equilíbrio.'
  }
]);

export const PUZZLES = deepFreeze({
  tents: TENTS_LEVELS,
  words: WORD_LEVELS,
  bridges: BRIDGE_LEVELS,
  futoshiki: FUTOSHIKI_LEVELS,
  kenken: KENKEN_LEVELS,
  river: RIVER_LEVELS,
  einstein: EINSTEIN_LEVELS,
  hanoi: HANOI_LEVELS,
  twentyfour: TWENTYFOUR_LEVELS,
  kakuro: KAKURO_LEVELS,
  pyramid: PYRAMID_LEVELS,
  balance: BALANCE_LEVELS
});


