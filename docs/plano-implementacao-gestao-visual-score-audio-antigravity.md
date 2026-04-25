# Plano de Implementação — Gestão Visual do Score de Áudio

## Objetivo
Implementar uma camada **explícita, configurável e visual** para o score de seleção de áudios no projeto `mesa-de-jogo-basquete`, com base **somente no que já existe no código atual**.

Este plano existe porque, no estado atual do repositório:
- já existe um `AudioDecisionEngine` com heurísticas reais de score em `src/audio/audio-decision-engine.js`
- já existe um `AUDIO_CATALOG` com metadados por asset em `src/audio/audio-catalog.js`
- já existe uma tela de política por tela em `src/ui/ui-manager.js`
- **mas ainda não existe uma forma explícita, visual e operável de entender, editar e simular o score de um áudio**

O objetivo desta implementação é permitir que o operador:
1. veja claramente **como o score é calculado**
2. altere os **pesos do algoritmo** sem editar código
3. simule contextos de jogo
4. veja o ranking dos áudios candidatos com **breakdown visual do score**
5. tenha base concreta para evoluir a inteligência do sistema

---

# Escopo

## Está dentro do escopo
- extrair pesos hardcoded do `AudioDecisionEngine`
- criar uma estrutura declarativa de regras/pesos de score
- adaptar o engine para usar essa estrutura
- adicionar API de ranking explicável (`rank` / `explainDecision`)
- criar estado para configuração do score
- criar interface visual de gestão do score
- criar simulador visual de evento/contexto
- criar tabela/lista de candidatos com breakdown
- permitir salvar/aplicar alterações em memória
- permitir reset para defaults
- adicionar testes unitários e E2E mínimos

## Não está dentro do escopo
- backend
- persistência remota
- Supabase
- múltiplos perfis de score por campeonato
- versionamento de regras
- machine learning
- geração automática de score
- recomendação automática de pesos
- troca total da arquitetura de áudio

---

# Base real do código atual

## Arquivos já existentes e relevantes
- `src/audio/audio-decision-engine.js`
- `src/audio/audio-catalog.js`
- `src/audio/audio-history.js`
- `src/audio/audio-profiles.js`
- `src/audio/audio-bridge.js`
- `src/core/game-state.js`
- `src/core/selectors.js`
- `src/core/event-types.js`
- `src/ui/ui-manager.js`
- `src/app/bootstrap.js`

## Observação importante
A implementação deve **reaproveitar** a arquitetura existente. Não criar um sistema paralelo.

---

# Problema atual a ser resolvido

Hoje o score de um asset existe, mas está implícito dentro de funções hardcoded do `AudioDecisionEngine`:
- `scoreByContext(...)`
- `scoreByRecency(...)`
- `scoreByIntensity(...)`

Os pesos atuais estão embutidos no código como números literais (`+2`, `+10`, `+20`, `-100`, `+5`, `-10`, etc.).

Isso gera 4 problemas práticos:
1. o operador não entende por que um áudio ganhou
2. o operador não consegue editar o score sem mexer em código
3. não existe uma tela de inspeção do ranking
4. a evolução da inteligência fica opaca e pouco governável

---

# Resultado esperado

Ao final da implementação, o sistema deve permitir:

## 1. Configuração explícita dos pesos
O projeto deve possuir um objeto/config único contendo todos os pesos do algoritmo de score.

## 2. Engine sem números mágicos
`AudioDecisionEngine` não deve mais conter pesos numéricos hardcoded espalhados.

## 3. Ranking explicável
O engine deve ser capaz de retornar:
- candidatos elegíveis
- breakdown por componente de score
- score final por asset
- asset vencedor

## 4. Gestão visual
Deve existir uma tela visual onde seja possível:
- editar os pesos
- simular um evento
- visualizar o ranking
- entender por que cada asset recebeu sua pontuação

## 5. Integração com o estado atual
A configuração deve ficar acessível pelo `gameState.audio` ou outro ponto central coerente com a arquitetura atual.

---

# Diretriz arquitetural

## Regra principal
A tela visual de score **não substitui** a política por tela.

Ela complementa a arquitetura atual separando claramente duas camadas:

### Camada 1 — Política por tela
Responsável por:
- permitir/bloquear áudio automático
- priorizar manual
- mapear categorias por tela

### Camada 2 — Score de seleção do asset
Responsável por:
- ranquear os áudios elegíveis
- explicar por que um asset venceu
- expor pesos configuráveis do algoritmo

Essas duas camadas não devem ser misturadas na UI nem no código.

---

# Entregáveis obrigatórios

## Entregável 1 — Novo arquivo de regras de score
Criar um arquivo novo, por exemplo:

`src/audio/audio-scoring-rules.js`

Esse arquivo deve exportar um objeto default com a configuração completa de score.

### Estrutura obrigatória
A estrutura precisa refletir o engine atual.

```js
export const DEFAULT_AUDIO_SCORING_RULES = {
  context: {
    scoreMade: {
      threePointBonus: 2,
      closeGameBonus: 2,
      clutchTagBonus: 10
    },
    shotMissed: {
      funTagBonus: 1
    },
    timeout: {
      officialTagBonus: 20
    },
    periodEnd: {
      officialTagBonus: 20
    },
    gameEnd: {
      officialTagBonus: 20
    },
    foulPersonal: {
      regularFoulPenalty: -100,
      exclusionOfficialBonus: 20
    }
  },
  recency: {
    noRepeatBonus: 5,
    repeatPenaltyPerOccurrence: -10,
    recentWindow: 10
  },
  intensity: {
    highIntensityPeriodEndBonus: 10,
    lowIntensityPeriodEndPenalty: -5,
    highIntensityClutchBonus: 5,
    mediumIntensityDefaultBonus: 2
  }
};
```

## Requisitos obrigatórios
- nomes claros
- valores numéricos
- mesma semântica do engine atual
- sem remover nenhuma regra já existente no comportamento atual

---

## Entregável 2 — Inicialização do estado de score
Adicionar ao estado global uma referência para as regras ativas.

### Local esperado
`src/core/game-state.js`

### Estrutura mínima
```js
audio: {
  history: [],
  queue: [],
  current: null,
  policies: null,
  scoringRules: null
}
```

### Requisito
No bootstrap da aplicação, `scoringRules` deve ser inicializado a partir de `DEFAULT_AUDIO_SCORING_RULES` com cópia segura, para permitir edição sem mutar o objeto default diretamente.

---

## Entregável 3 — Refactor completo do AudioDecisionEngine
Atualizar `src/audio/audio-decision-engine.js`.

## Requisitos obrigatórios

### 3.1 Receber regras explicitamente
A engine deve aceitar `rules` por parâmetro ou buscar `state.audio.scoringRules`.

### 3.2 Remover números mágicos
Todos os pesos atualmente hardcoded devem ser substituídos por leitura da configuração.

### 3.3 Manter comportamento equivalente
Se `DEFAULT_AUDIO_SCORING_RULES` for usado sem alteração, o comportamento da engine deve continuar equivalente ao atual.

### 3.4 Expor breakdown detalhado
Criar uma função nova obrigatória.

#### Nome sugerido
`rank({ event, state, catalog, rules })`

### Saída obrigatória
A função deve retornar uma lista ordenada assim:

```js
[
  {
    asset: { ... },
    eligible: true,
    breakdown: {
      context: 12,
      recency: 5,
      intensity: 5,
      total: 22,
      reasons: [
        { key: 'scoreMade.threePointBonus', value: 2, label: 'Cesta de 3 pontos' },
        { key: 'scoreMade.clutchTagBonus', value: 10, label: 'Tag clutch em momento clutch' },
        { key: 'recency.noRepeatBonus', value: 5, label: 'Sem repetição recente' },
        { key: 'intensity.highIntensityClutchBonus', value: 5, label: 'Alta intensidade em clutch' }
      ]
    }
  }
]
```

### Requisitos obrigatórios da função `rank`
- considerar apenas assets `enabled`
- respeitar `eventTypes`
- respeitar cooldown/recência
- incluir breakdown completo
- ordenar por `breakdown.total` desc
- não tocar áudio
- não mutar estado

### 3.5 Atualizar `decide(...)`
`decide(...)` deve passar a usar `rank(...)` internamente.

### Comportamento esperado
```js
decide({ event, state, catalog, rules }) {
  const ranked = this.rank({ event, state, catalog, rules });
  return ranked[0]?.asset ?? null;
}
```

---

## Entregável 4 — Funções utilitárias para UI
Criar funções auxiliares para alimentar a interface visual.

### Arquivo sugerido
Pode ser no próprio `audio-decision-engine.js` ou em `src/audio/audio-scoring-utils.js`

### Funções obrigatórias

#### `getScoringRulesSnapshot()`
Retorna regras atuais em formato serializável.

#### `resetScoringRules()`
Restaura a configuração default.

#### `buildSimulationEvent(formValues)`
Transforma o estado do formulário visual em um evento compatível com a engine.

#### `buildSimulationState(formValues, baseState)`
Monta um estado derivado mínimo para simulação.

### Requisito
Essas funções devem ser puras sempre que possível.

---

## Entregável 5 — Tela visual de gestão do score
Criar uma nova tela dedicada.

### Nome obrigatório da tela
`audio-scoring-screen`

### Onde ela deve existir
Nos HTMLs / fluxo atual de telas, do mesmo jeito que a tela de política já é acessada.

### Navegação obrigatória
Adicionar botão ou entrada clara para abrir essa tela.

### A tela deve conter 4 blocos obrigatórios

---

# Bloco A — Regras de score

## Objetivo
Permitir editar os pesos do algoritmo.

## Campos obrigatórios

### Context / Score made
- `threePointBonus`
- `closeGameBonus`
- `clutchTagBonus`

### Context / Shot missed
- `funTagBonus`

### Context / Timeout
- `officialTagBonus`

### Context / Period end
- `officialTagBonus`

### Context / Game end
- `officialTagBonus`

### Context / Foul personal
- `regularFoulPenalty`
- `exclusionOfficialBonus`

### Recency
- `noRepeatBonus`
- `repeatPenaltyPerOccurrence`
- `recentWindow`

### Intensity
- `highIntensityPeriodEndBonus`
- `lowIntensityPeriodEndPenalty`
- `highIntensityClutchBonus`
- `mediumIntensityDefaultBonus`

## Requisitos de UI obrigatórios
- cada campo deve ter label clara
- cada campo deve ter descrição curta
- cada campo deve aceitar número inteiro
- mudanças não devem quebrar a página
- valores inválidos devem ser tratados com fallback
- deve existir botão “Salvar regras”
- deve existir botão “Resetar para padrão”

---

# Bloco B — Simulador de contexto

## Objetivo
Permitir criar manualmente um cenário e ver o ranking resultante.

## Campos obrigatórios

### Evento
Select com pelo menos:
- `score.made`
- `shot.missed`
- `timeout`
- `period.end`
- `game.end`
- `foul.personal`

### Dados do evento
Mostrar dinamicamente conforme o tipo.

#### Para `score.made`
- valor da cesta: `1`, `2`, `3`

#### Para `foul.personal`
- `isExclusion`: `true/false`

#### Para os demais
- sem payload adicional obrigatório

### Estado do jogo
- `period`
- `clock` em ms ou interface simplificada equivalente
- `scoreDiff`
- `clutch` override opcional

### Histórico recente
- quantidade de repetições recentes por asset selecionável **ou** uma forma simplificada de simular recência

## Requisito importante
Se a UI optar por simplificar a recência, ela deve ao menos permitir informar manualmente quantas repetições recentes um asset teve no horizonte configurado.

---

# Bloco C — Ranking dos candidatos

## Objetivo
Mostrar o resultado do cálculo.

## Requisitos obrigatórios
Exibir, para cada candidato:
- posição no ranking
- `asset.id`
- nome do arquivo
- tags
- intensidade
- score total
- score de contexto
- score de recência
- score de intensidade
- elegível / inelegível
- motivo de inelegibilidade quando aplicável

## Requisitos visuais obrigatórios
- destacar o primeiro colocado
- mostrar breakdown expandível ou sempre visível
- mostrar lista de razões
- exibir quando um asset foi eliminado por cooldown

## Exemplo de razões esperadas
- “Cesta de 3 pontos: +2”
- “Tag clutch em momento clutch: +10”
- “Sem repetição recente: +5”
- “Alta intensidade em clutch: +5”
- “Penalidade por repetição: -20”

---

# Bloco D — Resultado final

## Objetivo
Explicitar qual asset seria escolhido.

## Requisitos obrigatórios
- card de destaque com asset vencedor
- score final
- resumo do porquê venceu
- botão “Tocar preview” opcional, somente se já existir infraestrutura estável para isso

## Observação
Se preview real complicar a entrega, deixar fora desta fase. O foco é clareza da decisão.

---

## Entregável 6 — Integração com UIManager
Atualizar `src/ui/ui-manager.js`.

## Requisitos obrigatórios
Criar métodos dedicados para:
- inicializar a tela de score
- popular inputs com regras atuais
- ler formulário e salvar regras
- resetar regras
- executar simulação
- renderizar ranking
- renderizar vencedor

### Nomes sugeridos
- `initAudioScoringScreen()`
- `populateScoringRulesForm()`
- `saveScoringRules()`
- `resetScoringRules()`
- `runAudioScoringSimulation()`
- `renderAudioScoringRanking(results)`
- `renderAudioScoringWinner(result)`

## Requisito importante
Não misturar esse fluxo com `initAudioPolicyScreen()` nem reaproveitar variáveis de forma confusa.

---

## Entregável 7 — Integração com bootstrap
Atualizar `src/app/bootstrap.js`.

## Requisitos obrigatórios
- adicionar navegação para `audio-scoring-screen`
- registrar handlers da nova tela
- garantir inicialização de `gameState.audio.scoringRules`
- garantir que a tela funcione depois de reload da aplicação

---

## Entregável 8 — Testes unitários
Criar ou atualizar testes.

### Arquivo sugerido
`tests/audio-decision-engine.test.js`

## Casos obrigatórios

### Caso 1
Com regras default, `rank()` deve retornar candidatos ordenados por score total.

### Caso 2
`decide()` deve retornar o primeiro asset do ranking.

### Caso 3
Alterar `threePointBonus` deve impactar score de um evento `score.made` com valor 3.

### Caso 4
Alterar `repeatPenaltyPerOccurrence` deve impactar score de recência.

### Caso 5
Asset inelegível por cooldown não deve aparecer como elegível.

### Caso 6
`foul.personal` sem exclusão deve aplicar a penalidade configurada.

### Caso 7
`period.end` e `game.end` devem favorecer `official` com base nas regras configuradas.

---

## Entregável 9 — Testes E2E mínimos
Criar ou atualizar teste de interface.

### Arquivo sugerido
`tests-e2e/audio-scoring.spec.js`

## Casos obrigatórios
- abrir tela `audio-scoring-screen`
- alterar um peso
- salvar
- rodar simulação de `score.made` com valor 3
- verificar que ranking aparece
- verificar que vencedor aparece
- resetar regras
- verificar retorno aos valores padrão

---

# Regras de implementação importantes

## Regra 1 — Não criar backend
Tudo deve funcionar no front atual.

## Regra 2 — Não duplicar catálogo
A tela deve usar `AUDIO_CATALOG` existente.

## Regra 3 — Não criar segunda engine
A implementação deve evoluir o `AudioDecisionEngine` atual.

## Regra 4 — Não hardcodar assets na UI
A lista de candidatos deve vir do catálogo real.

## Regra 5 — Não misturar política por tela com score de asset
A UI nova deve tratar score/ranking. A UI antiga continua tratando política por tela.

## Regra 6 — Não usar valores implícitos escondidos
Todos os pesos precisam estar visíveis em uma estrutura explícita.

## Regra 7 — Não quebrar o comportamento atual
Se o operador não mexer nas regras, o sistema deve continuar equivalente ao estado atual.

---

# Estrutura visual recomendada

## Seção 1
Cabeçalho da tela
- título: “Scoring de Áudio”
- subtítulo curto explicando que a tela controla o ranking dos assets

## Seção 2
Painel esquerdo: regras

## Seção 3
Painel central: simulador

## Seção 4
Painel direito ou área inferior: ranking + vencedor

## Requisito de UX
A leitura da decisão precisa ser óbvia até para alguém que não abriu o código.

---

# Prompt mestre para Antigravity

```text
Objetivo: implementar uma gestão visual do score de seleção de áudio no projeto mesa-de-jogo-basquete, com base na arquitetura atual já existente.

Contexto técnico já existente:
- existe um AudioDecisionEngine em src/audio/audio-decision-engine.js
- existe um AUDIO_CATALOG em src/audio/audio-catalog.js
- existe estado global em src/core/game-state.js
- existe UIManager em src/ui/ui-manager.js
- existe uma tela de política de áudio por tela, mas ainda não existe uma tela de gestão visual do score do asset
- hoje os pesos do score estão hardcoded dentro do engine

Problema a resolver:
- tornar explícito como o score é calculado
- permitir editar os pesos sem mexer no código
- permitir simular eventos/contextos
- mostrar ranking dos assets com breakdown detalhado

Entregas obrigatórias:
1. criar src/audio/audio-scoring-rules.js com a configuração default completa dos pesos
2. adicionar gameState.audio.scoringRules
3. inicializar scoringRules no bootstrap com cópia segura dos defaults
4. refatorar AudioDecisionEngine para remover números mágicos e usar rules
5. implementar rank({ event, state, catalog, rules }) com breakdown detalhado e razões por asset
6. fazer decide() usar rank()
7. criar tela audio-scoring-screen
8. criar UI para editar pesos do score
9. criar simulador visual de evento/contexto
10. renderizar ranking completo dos candidatos
11. renderizar vencedor da simulação
12. adicionar salvar e resetar regras
13. adicionar testes unitários e E2E mínimos

Restrições:
- não criar backend
- não duplicar catálogo
- não criar uma segunda engine
- não misturar política por tela com score de asset
- manter comportamento equivalente ao atual quando usar as regras default
- reaproveitar a arquitetura existente

Requisitos de qualidade:
- nomes claros
- funções pequenas
- sem números mágicos hardcoded no engine
- ranking explicável
- UI legível
- tratamento de fallback para inputs inválidos
- testes cobrindo cálculo, ranking e UI
```

---

# Execução por agentes no Antigravity

## Agente 1 — Modelagem das regras
Responsável por criar `audio-scoring-rules.js` e integrar `scoringRules` ao estado.

### Tarefas
- criar objeto default completo
- adicionar `gameState.audio.scoringRules`
- inicializar no bootstrap com deep clone seguro

### Critério de aceite
As regras existem fora do engine e podem ser lidas/modificadas sem alterar o default.

---

## Agente 2 — Refactor do engine
Responsável por remover números mágicos e criar `rank()`.

### Tarefas
- ler regras do estado/parâmetro
- refatorar `scoreByContext`
- refatorar `scoreByRecency`
- refatorar `scoreByIntensity`
- criar `rank()`
- adaptar `decide()`

### Critério de aceite
O engine retorna breakdown detalhado e mantém compatibilidade comportamental com as regras default.

---

## Agente 3 — Utilitários de simulação
Responsável por criar helpers puros de transformação do formulário em `event/state` simulados.

### Tarefas
- criar `buildSimulationEvent`
- criar `buildSimulationState`
- criar snapshot/reset helpers

### Critério de aceite
A UI consegue simular contexto sem depender do fluxo real da partida.

---

## Agente 4 — Tela visual
Responsável por criar `audio-scoring-screen` e a estrutura visual completa.

### Tarefas
- criar HTML da tela
- criar inputs dos pesos
- criar área do simulador
- criar área do ranking
- criar card do vencedor

### Critério de aceite
A tela é navegável, compreensível e mostra o ranking completo.

---

## Agente 5 — Integração com UIManager
Responsável por toda lógica da tela nova.

### Tarefas
- inicialização
- popular formulário
- salvar
- resetar
- simular
- renderizar resultados

### Critério de aceite
As interações da tela funcionam sem quebrar outras telas.

---

## Agente 6 — Testes
Responsável por testes unitários e E2E.

### Tarefas
- cobrir `rank()`
- cobrir `decide()`
- cobrir alteração de pesos
- cobrir reset
- cobrir tela visual e simulação

### Critério de aceite
A suíte cobre cálculo, UI e fluxo principal da tela.

---

# Checklist final detalhado

- [ ] existe `src/audio/audio-scoring-rules.js`
- [ ] existe `DEFAULT_AUDIO_SCORING_RULES`
- [ ] existe `gameState.audio.scoringRules`
- [ ] bootstrap inicializa `scoringRules`
- [ ] engine não tem números mágicos dispersos
- [ ] engine usa rules explicitamente
- [ ] existe `rank()`
- [ ] `rank()` retorna breakdown com razões
- [ ] `decide()` usa `rank()`
- [ ] existe `audio-scoring-screen`
- [ ] há inputs visuais para todos os pesos
- [ ] há simulador de evento/contexto
- [ ] há ranking completo dos assets
- [ ] há destaque do vencedor
- [ ] há botão salvar
- [ ] há botão resetar para padrão
- [ ] há tratamento de input inválido
- [ ] há teste unitário do ranking
- [ ] há teste unitário das regras
- [ ] há teste E2E da tela

---

# Critério final de sucesso

A implementação estará correta quando o operador conseguir, sem abrir o código:
- entender quais fatores compõem o score de um áudio
- alterar os pesos do algoritmo
- simular um evento de jogo
- ver o ranking dos candidatos
- entender por que o asset vencedor venceu
- resetar tudo para os valores padrão

Essa é a definição de pronto desta fase.
