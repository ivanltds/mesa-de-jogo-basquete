# 🛡️ Plano de Validação E2E: FIBA Digital Scoreboard

Este documento detalha os cenários de teste de ponta a ponta que serão automatizados via Playwright para garantir a conformidade técnica e estética do sistema.

---

## 🎯 Escopo da Validação
O foco está na **integridade do fluxo de jogo**, garantindo que as regras FIBA 2024 sejam aplicadas visualmente e que a interface "Elite Arena" permaneça consistente.

---

## 🗺️ Mapeamento de Cenários Críticos

### 1. Ciclo de Vida da Partida (Setup to Tip-off)
- **Cenário**: Configuração completa de uma partida de elite.
- **Validação E2E**:
    - [ ] Inserir nomes dos times (ex: Flamengo vs Franca).
    - [ ] Adicionar 12 jogadores com números únicos em cada time.
    - [ ] Tentar iniciar com menos de 5 jogadores (Deve bloquear e mostrar Toast).
    - [ ] Iniciar com 5+ jogadores e validar transição para o Placar Principal.
    - [ ] **Expectativa**: O nome dos 5 primeiros jogadores deve aparecer nos cards de quadra.

### 2. Motor de Pontuação e Feedback Visual
- **Cenário**: Atribuição de cestas de diferentes valores.
- **Validação E2E**:
    - [ ] Clicar em "+3" no jogador #10.
    - [ ] Validar se o Placar Geral subiu 3 pontos.
    - [ ] Validar se o marcador individual do jogador subiu 3 pontos.
    - [ ] Verificar se a Fila de Áudio recebeu um evento de "cesta".
    - [ ] **Expectativa**: O DOM deve refletir a pontuação instantaneamente sem recarregar.

### 3. Gestão de Faltas e Regras de Exclusão (FIBA Art. 40/41)
- **Cenário**: Jogador atinge o limite de faltas.
- **Validação E2E**:
    - [ ] Adicionar 4 faltas ao Jogador #4.
    - [ ] Adicionar a 5ª falta.
    - [ ] **Validar**: O card do jogador deve ganhar a classe `.excluded` (estilo visual de alerta).
    - [ ] **Validar**: Os botões de pontos e faltas do jogador devem ficar desativados (`disabled`).
    - [ ] Adicionar faltas coletivas até 5.
    - [ ] **Validar**: O indicador de **BÔNUS** do time deve ficar ativo (cor do time/aceso).

### 4. Cronometragem e Trava de Segurança
- **Cenário**: Gestão de tempo e segurança de substituição.
- **Validação E2E**:
    - [ ] Ligar o cronômetro (START).
    - [ ] Tentar abrir o modal de Substituição (SUB).
    - [ ] **Expectativa**: O modal NÃO deve abrir (Trava de Bola Viva).
    - [ ] Pausar o cronômetro (STOP).
    - [ ] Abrir modal de SUB, realizar troca e validar atualização dos cards em quadra.

### 5. Transição de Período e Auditoria
- **Cenário**: Avanço de quarto e correção de erros.
- **Validação E2E**:
    - [ ] Adicionar 4 faltas coletivas ao Time A.
    - [ ] Clicar em "PRÓX. PERÍODO" (➔).
    - [ ] **Validar**: O período deve ir para 2.
    - [ ] **Validar**: As faltas coletivas do Time A devem voltar para **0**.
    - [ ] Reverter o último evento de ponto no log.
    - [ ] **Validar**: O placar deve subtrair os pontos e o item no log deve aparecer riscado.

---

## 📈 Critérios de Aceite E2E
1. **Conformidade**: O sistema nunca permite ações ilegais (ex: sub com bola viva).
2. **Estabilidade**: O estado do jogo (gameState) deve estar sempre sincronizado com o que o usuário vê (DOM).
3. **Resiliência**: Cliques rápidos ou em sequência não devem quebrar o fluxo de áudio ou as animações de placar.

---

## 🛠️ Próximos Passos de Automação
1. Criar `tests-e2e/setup_match.spec.js` (Cobre item 1).
2. Criar `tests-e2e/game_mechanics.spec.js` (Cobre itens 2 e 3).
3. Criar `tests-e2e/safety_locks.spec.js` (Cobre item 4).

---
