# Registro de Melhorias e Validações (Thiago FIBA Rules)

Este documento registra as validações de cada fase e as melhorias sugeridas pelo especialista em regras FIBA.

## Fase 1: Fundação e Design System
**Status:** ✅ Validado
**Data:** 22/04/2026

### 📝 Observações de Melhoria (Pendentes)
1.  **Flexibilidade de Período**: O estado inicial define `period: 1`, mas devemos garantir que a UI e o motor suportem `OT1`, `OT2`, etc., não apenas números.
2.  **Constantes de Shot Clock**: Recomendo mover os valores `24000` e `14000` para uma constante `FIBA_CONSTANTS` para facilitar ajustes futuros caso a regra mude.
3.  **Acessibilidade de Cores**: As cores dos times (Red/Blue no mock) devem ter um indicador de contraste para garantir que o número do jogador seja sempre legível sobre o fundo.

### ⚠️ Críticas (Impedimentos - Corrigir Agora)
- *Nenhum impedimento crítico encontrado nesta fase.*

---

## Fase 2: Configuração e Estado Inicial
**Status:** ✅ Validado (com ressalvas)
**Data:** 22/04/2026

### 📝 Observações de Melhoria (Pendentes)
1.  **Interface de Cadastro**: O uso de `prompt()` é funcional para TDD, mas deve ser substituído por um modal customizado para melhor UX.
2.  **Seleção de Titulares**: Atualmente o sistema assume os primeiros 5. Deve haver uma seleção explícita de quem inicia em quadra.

### ⚠️ Críticas (Impedimentos - Corrigir Agora)
1.  **Validação de Números**: A regra FIBA permite apenas 0, 00 e 1-99. O sistema atual aceita qualquer texto. **[RESOLVIDO]**
2.  **Diferenciação 0 vs 00**: O sistema deve tratar "0" e "00" como números distintos e válidos. **[RESOLVIDO]**

---

## Fase 3: Motores de Tempo
**Status:** ✅ Validado
**Data:** 22/04/2026

### 📝 Observações de Melhoria (Pendentes)
1.  **Décimos de Segundo**: Conforme regra FIBA, no último minuto do quarto, o cronômetro deve exibir décimos de segundo. Atualmente exibe apenas segundos.
2.  **Sincronização**: O Shot Clock deve pausar automaticamente sempre que o Game Clock pausar. **[RESOLVIDO]**

---

## Fase 4: Interface de Jogo (Live Match)
**Status:** ✅ Validado
**Data:** 22/04/2026

### 📝 Observações de Melhoria (Pendentes)
1.  **Indicador de Bônus**: Falta um alerta visual claro (Luz vermelha) quando um time atinge 4 faltas coletivas. (Mapeado para Fase 5).
2.  **Visual de Exclusão**: Jogadores com 5 faltas devem ficar cinzas ou riscados na lista, não apenas disparar um alert.
3.  **Substituições em Lote**: A interface atual é 1x1. Para o início de períodos, seria bom uma seleção em lote.

### ⚠️ Críticas (Impedimentos - Corrigir Agora)
- *Nenhum impedimento crítico. A base está sólida para seguir para as regras complexas da Fase 5.*

---
