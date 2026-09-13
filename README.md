# Mesa de Lógica

Uma coleção completa de 13 jogos de raciocínio lógico e matemático (45 desafios no total) criada para estudantes da Professora Tamiris (Ensino Fundamental, Médio e Técnico).

## 🧩 Jogos Disponíveis

1. **Barracas (Tents & Trees):** dedução espacial, contagem e regras de vizinhança (4 níveis).
2. **Caça-palavras:** atenção visual com vocabulário de negócios e gestão em inglês (3 níveis).
3. **Ilhas (Hashiwokakero / Bridges):** planejamento de rede, pontes e conectividade de grafos (3 níveis).
4. **Davi e Golias (Futoshiki):** ordenação numérica e inequações maior/menor (3 níveis).
5. **KenKen:** cálculo aritmético com 4 operações e matriz latina (3 níveis).
6. **Travessia do Rio:** logística clássica e o teste de QI japonês da travessia com barco (3 níveis).
7. **Enigma de Einstein (Zebra Puzzle):** dedução matricial de 3 a 5 casas com coloração automática (3 níveis).
8. **Torre de Hanói:** recursão, transferência e planejamento com contagem de movimentos (4 níveis).
9. **Jogo do 24:** expressões aritméticas com 4 cartas, parênteses e frações via parser seguro (4 níveis).
10. **Kakuro:** somas cruzadas numéricas com partição de inteiros únicos de 1 a 9 (3 níveis).
11. **Pirâmides & Quadrados Mágicos:** pirâmides aditivas/multiplicativas e matrizes mágicas de Lo Shu e Dürer (4 níveis).
12. **Balança Lógica:** dedução algébrica de pesos relativos com balança interativa e inclinação dinâmica (4 níveis).

O progresso é salvo no `localStorage` do navegador com persistência por nível e jogo. Não há cadastro, servidor ou coleta de dados.

## 🚀 Executar localmente

O site não exige build nem dependências de produção (Vanilla ES Modules puro):

```bash
npm start
# ou python3 -m http.server 4173
```

Abra `http://localhost:4173`.

## 🧪 Testes

Os testes usam o test runner nativo do Node.js:

```bash
npm test
```

## 📁 Estrutura

```text
index.html                Estrutura semântica dos 12 painéis
styles.css                Identidade visual neo-brutalista, responsividade e temas
js/app.js                 Navegação global, abas, perfil e barra de progresso
js/core.js                Gerenciador de estado reativo, persistência e efeitos
js/puzzles.js             Definições imutáveis dos 50 puzzles e soluções
js/rules.js               Regras puras de validação e parser de expressões
js/games/                 Controladores dos 13 jogos
assets/                   Marca e favicon
test/                     Testes automatizados com Node.js test runner
```

## ⌨️ Controles e acessibilidade

- A navegação entre jogos aceita setas direcionais, Home e End.
- Todos os tabuleiros podem ser operados por toque, mouse e teclado.
- Nas grades numéricas (Kakuro, Quadrados Mágicos, Futoshiki, KenKen), use as setas para navegar entre células.
- A interface respeita preferências do sistema operacional (tema claro/escuro e redução de movimento).

## 🌐 Publicação

O projeto é 100% estático e pode ser publicado diretamente pelo GitHub Pages a partir da raiz da branch principal.

## 🎓 Créditos

Desenvolvido para os alunos da **Professora Tamiris**. Inspirado na Oficina de Raciocínio Lógico do Professor Santinho.
