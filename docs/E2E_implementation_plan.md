# 🚀 Plano de Implementação: Testes E2E (Geovane QA)

**Objetivo**: Garantir a integridade da jornada do usuário desde a configuração inicial até o estouro do cronômetro final, validando interações de UI, estados visuais e persistência de dados no DOM.

---

## 🏗️ Stack Tecnológica
- **Framework**: [Playwright](https://playwright.dev/)
- **Linguagem**: JavaScript/TypeScript
- **Validação Visual**: Playwright Screenshots (Pixel-match)
- **Relatórios**: HTML Reporter + Trace Viewer

---

## 🗺️ Mapeamento de Cenários Críticos

### 1. Fluxo de Setup (Configuração)
- **Cenário 1.1**: Adição de times (Nome, Cor) e validação de persistência visual.
- **Cenário 1.2**: Cadastro de 12 jogadores por time e remoção de atletas.
- **Cenário 1.3**: Bloqueio de início de partida com menos de 5 jogadores ativos.
- **Cenário 1.4**: Transição suave da tela de Setup para a tela de Jogo.

### 2. Operação de Partida (Real-time)
- **Cenário 2.1**: Atribuição de pontos (1, 2, 3) e reflexo imediato no placar gigante.
- **Cenário 2.2**: Registro de faltas e ativação visual do indicador de **BÔNUS**.
- **Cenário 2.3**: Exclusão de jogador: verificar se o card fica vermelho, com ícone de proibido e botões desativados.
- **Cenário 2.4**: Cronômetro: Start, Pause e sincronia com o Shot Clock (24s).

### 3. Dinâmica de Substituição
- **Cenário 3.1**: Abertura do modal de SUB e seleção de entrada/saída.
- **Cenário 3.2**: Validação da trava de "Bola Viva": o modal não deve abrir se o tempo estiver rodando.
- **Cenário 3.3**: Impedir entrada de jogador já excluído (5 faltas).

### 4. Auditoria e Mesa de Som
- **Cenário 4.1**: Reversão de eventos (Undo) via log: verificar se o placar volta ao valor anterior e se o log risca o item.
- **Cenário 4.2**: Soundboard: clicar nos pads de efeito e validar se a fila de áudio é populada corretamente.

---

## 📅 Cronograma de Execução (Fases)

### Fase 1: Infraestrutura (Onde estamos agora)
- Instalação do `@playwright/test`.
- Configuração do arquivo `playwright.config.js`.
- Criação do primeiro teste de fumaça (Smoke Test).

### Fase 2: Jornada de Setup
- Testes automatizados para a tela de configuração inicial.
- Validação de seletores CSS e IDs únicos.

### Fase 3: Motor de Jogo (Gameplay)
- Implementação dos cenários de pontuação, faltas e tempo.
- Testes de concorrência (ex: ponto durante estouro de cronômetro).

### Fase 4: Visual Regression & Polish
- Captura de "Base Screenshots" para garantir que atualizações de CSS não quebrem o layout.
- Testes de responsividade (resoluções 1080p e 4K).

---

> [!TIP]
> **Dica do Geovane**: Vamos focar em testes que usem o "Role" (ex: `getByRole('button', { name: 'SUB' })`) em vez de seletores CSS frágeis. Isso torna nossos testes muito mais resilientes a mudanças de design!

---
