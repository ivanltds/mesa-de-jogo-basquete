# 🏀 FIBA Digital Scoreboard (Elite Edition 2024)

![FIBA Approved](https://img.shields.io/badge/FIBA-Approved_Rules_2024-orange)
![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Build Status](https://img.shields.io/badge/tests-100%25_Passing-brightgreen)

Um sistema de gerenciamento de partidas de basquete de alto nível, projetado para conformidade total com as regras da FIBA 2024. Focado em estética premium, estabilidade técnica e facilidade de operação para oficiais de mesa.

---

## ✨ Principais Funcionalidades

### 🎮 Gerenciamento de Partida (Elite Interface)
- **Controle de Cronômetro**: Gestão de tempo de jogo e *Shot Clock* (24s/14s) com precisão de milissegundos.
- **Regras FIBA Integradas**: 
    - Exclusão automática após a 5ª falta individual (Art. 40).
    - Indicador visual de Bônus de Equipe (Art. 41).
    - Trava de segurança para substituições durante "Bola Viva".
- **Gestão de Períodos**: Transição automática de quartos com reset de faltas coletivas.

### 🔊 Arena Soundboard (Modo DJ)
- Mixer integrado para efeitos sonoros de arena (Buzzer, Defesa, Cesta, Música).
- Fila de áudio dinâmica que prioriza sons críticos (Buzzer) sobre sons de entretenimento.

### 📑 Auditoria e Segurança
- **Histórico em Tempo Real**: Log detalhado de todos os eventos da partida.
- **Sistema de Undo**: Reversão instantânea de qualquer ação (pontos, faltas) com ajuste automático do placar e estado do jogo.

---

## 🛠️ Tech Stack

- **Frontend**: Vanilla Javascript (ESM), HTML5 Semântico, CSS3 (Design System Customizado).
- **Tooling**: [Vite](https://vitejs.dev/) para build e desenvolvimento rápido.
- **Testes Unitários**: [Vitest](https://vitest.dev/) para validação de lógica de negócio.
- **Testes E2E**: [Playwright](https://playwright.dev/) para automação de jornada do usuário e conformidade visual.
- **Garantia de Qualidade**: [Husky](https://typicode.github.io/husky/) para Git Hooks (Pre-push).

---

## 🚀 Como Começar

### Pré-requisitos
- Node.js (v18 ou superior)
- npm

### Instalação
```bash
# Clone o repositório
git clone <url-do-repositorio>

# Entre no diretório
cd mesa

# Instale as dependências
npm install

# Instale os navegadores do Playwright
npx playwright install chromium
```

### Desenvolvimento
```bash
# Inicie o servidor de desenvolvimento
npm run dev
```
O placar estará disponível em `http://localhost:3000`.

---

## 🧪 Suíte de Testes

O projeto adota uma política de **Zero Bugs** através de testes automatizados obrigatórios.

### Testes Unitários (Lógica FIBA)
Valida cálculos de pontos, acúmulo de faltas e transições de estado.
```bash
npm test
```

### Testes E2E (Jornada do Operador)
Valida a interface, travas de segurança e fluxo completo de jogo.
```bash
npm run test:e2e
```

### Blindagem de Push
O sistema impede o `git push` se qualquer teste (Unitário ou E2E) falhar, garantindo a integridade do branch principal.

---

## 📂 Estrutura do Projeto

```text
├── docs/               # Documentação técnica e planos de validação
├── tests/              # Testes unitários (Vitest)
├── tests-e2e/          # Testes de ponta a ponta (Playwright)
├── assets/             # Áudios e recursos estáticos
├── index.html          # Estrutura principal (Semântica)
├── main.js             # Motor de lógica (Engine)
├── style.css           # Design System (Elite Arena Aesthetics)
└── playwright.config.js # Configuração de automação E2E
```

---

## 👨‍💻 Créditos
Desenvolvido por **Ivan Developer** & **Geovane QA** (Antigravity AI Pair).
