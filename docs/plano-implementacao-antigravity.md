# Plano de Implementação — Evolução da Arquitetura de Áudio Inteligente

## Objetivo
Evoluir a implementação atual do projeto `mesa-de-jogo-basquete` de uma seleção de áudio puramente aleatória para uma arquitetura orientada a eventos, com decisão sonora contextual, anti-repetição, catálogo com metadados e separação clara entre estado do jogo, decisão e reprodução.

Este plano foi montado com base no código atual do repositório, principalmente em `main.js`, sem assumir módulos ou estruturas que ainda não existem.

---

## Base atual observada no código

### Estrutura existente
- `gameState` centralizado em `main.js:1-11`
- `SoundManager` em `main.js:13-76`
- `GameEngine` em `main.js:78-124`
- `ClockEngine` em `main.js:126-165`
- avanço de período em `main.js:167-215`
- `UIManager` no restante do arquivo

### Limitações concretas da implementação atual
1. Seleção de áudio por categoria com `Math.random()` em `SoundManager.play()` (`main.js:27-33`)
2. Catálogo de áudio embutido em código, sem metadados (`main.js:15-25`)
3. Fila de áudio com shape mínimo `{ id, category, file }` (`main.js:44-49`)
4. Reprodução diretamente acoplada ao browser player em `processQueue()` (`main.js:51-60`)
5. Eventos de jogo registrados como mensagem livre em `GameEngine.logEvent()` (`main.js:90-111`)
6. Chamadas diretas a `SoundManager.play(...)` espalhadas no fluxo (`main.js:119-120`, `137`, `143`)
7. Estado do jogo sem contexto derivado suficiente para decisão sonora (`main.js:1-11`)

---

## Resultado esperado

Ao final da implementação, o sistema deve:
- escolher áudio com base no evento do jogo, e não apenas em categoria manual
- evitar repetição imediata e repetição dentro de janela de cooldown
- usar contexto do jogo para priorizar áudios mais adequados
- manter a reprodução desacoplada da lógica de escolha
- permitir adicionar novas regras sem alterar UI nem espalhar `if/else`
- ser testável por unidade e por integração

---

## Arquitetura alvo

### Camadas
1. **Game State**: estado bruto e derivado do jogo
2. **Game Event Factory / Dispatcher**: criação e publicação de eventos tipados
3. **Audio Catalog**: inventário de faixas com metadados
4. **Audio Decision Engine**: seleção da melhor faixa para cada evento
5. **Audio Playback Queue**: fila e execução de áudio
6. **UI Layer**: renderização e interação

### Fluxo alvo
1. Uma ação do operador gera um evento de domínio (`score.made`, `foul.personal`, `turnover`, `period.end`)
2. O estado do jogo é atualizado
3. O contexto derivado é calculado
4. O `AudioDecisionEngine` recebe o evento + contexto
5. O engine seleciona um asset do catálogo
6. O item escolhido entra na fila de reprodução
7. O player executa o áudio
8. O histórico da escolha é registrado para cooldown / anti-repetição

---

## Estrutura de arquivos proposta

```text
src/
  core/
    game-state.js
    event-dispatcher.js
    event-types.js
    selectors.js
  audio/
    audio-catalog.js
    audio-decision-engine.js
    audio-playback-queue.js
    audio-history.js
    audio-policies.js
  ui/
    ui-manager.js
  app/
    bootstrap.js
```

### Observação
Como o projeto atual concentra tudo em `main.js`, a migração deve ser incremental. O primeiro passo não é reescrever tudo, e sim extrair blocos para módulos sem alterar comportamento externo.

---

## Modelo de domínio proposto

### 1. Estado do jogo

```js
export const gameState = {
  clock: 600000,
  shotClock: 24000,
  isActive: false,
  period: 1,
  possession: null,
  teams: {
    home: { name: 'CASA', score: 0, fouls: 0, timeouts: 0, players: [], color: '#ff6b00' },
    away: { name: 'VISITANTE', score: 0, fouls: 0, timeouts: 0, players: [], color: '#2196f3' }
  },
  events: [],
  derived: {
    lastEventType: null,
    scoreDiff: 0,
    leader: null,
    clutch: false,
    scoringRun: { team: null, points: 0 },
    recentEvents: []
  },
  audio: {
    history: [],
    queue: [],
    current: null
  }
};
```

### 2. Tipos de evento

```js
export const EVENT_TYPES = {
  SCORE_MADE: 'score.made',
  SHOT_MISSED: 'shot.missed',
  FOUL_PERSONAL: 'foul.personal',
  TURNOVER: 'turnover',
  SUBSTITUTION: 'substitution',
  PERIOD_START: 'period.start',
  PERIOD_END: 'period.end',
  GAME_END: 'game.end',
  SHOT_CLOCK_VIOLATION: 'shotclock.violation'
};
```

### 3. Evento tipado

```js
export function createGameEvent(type, payload = {}, context = {}) {
  return {
    id: crypto.randomUUID(),
    type,
    at: Date.now(),
    payload,
    context
  };
}
```

---

## Catálogo de áudio proposto

### Problema atual
O catálogo atual é um objeto simples `categoria -> arquivos`, o que impede decisão baseada em metadados.

### Novo shape

```js
export const AUDIO_CATALOG = [
  {
    id: 'score_hype_01',
    file: 'cesta-10.mp3',
    eventTypes: ['score.made'],
    tags: ['score', 'hype'],
    intensity: 4,
    cooldownMs: 60000,
    maxRepeatWindow: 10,
    enabled: true
  },
  {
    id: 'score_clutch_01',
    file: 'cesta-11.mp3',
    eventTypes: ['score.made'],
    tags: ['score', 'clutch'],
    intensity: 5,
    cooldownMs: 120000,
    maxRepeatWindow: 20,
    enabled: true
  },
  {
    id: 'miss_fun_01',
    file: 'errou-1.mp3',
    eventTypes: ['shot.missed'],
    tags: ['miss', 'fun'],
    intensity: 2,
    cooldownMs: 45000,
    maxRepeatWindow: 8,
    enabled: true
  },
  {
    id: 'turnover_01',
    file: 'posse-1.mp3',
    eventTypes: ['turnover'],
    tags: ['turnover'],
    intensity: 2,
    cooldownMs: 20000,
    maxRepeatWindow: 6,
    enabled: true
  },
  {
    id: 'buzzer_01',
    file: 'Buzina.mp3',
    eventTypes: ['period.end', 'shotclock.violation', 'game.end'],
    tags: ['official'],
    intensity: 5,
    cooldownMs: 0,
    maxRepeatWindow: 0,
    enabled: true
  }
];
```

### Regras para catalogação
- Cada asset deve ter `id` estável
- O nome físico do arquivo não deve ser a identidade lógica da faixa
- Intensidade deve ser um campo explícito
- Cooldown deve ser por faixa
- Tags devem representar uso e intenção, não só categoria física
- Todo asset deve mapear para pelo menos um `eventType`

---

## Motor de decisão sonora

### Responsabilidade
Receber um evento tipado com contexto do jogo e retornar o melhor asset elegível.

### Interface proposta

```js
export const AudioDecisionEngine = {
  decide({ event, state, catalog, history }) {
    const candidates = this.getCandidates(event, catalog);
    const eligible = candidates.filter(asset => this.isEligible(asset, event, history));
    const ranked = eligible
      .map(asset => ({ asset, score: this.score(asset, event, state, history) }))
      .sort((a, b) => b.score - a.score);

    return ranked[0]?.asset ?? null;
  },

  getCandidates(event, catalog) {
    return catalog.filter(asset => asset.enabled && asset.eventTypes.includes(event.type));
  },

  isEligible(asset, event, history) {
    const now = event.at;
    const lastPlay = history.findLast(h => h.assetId === asset.id);
    if (!lastPlay) return true;
    if (asset.cooldownMs > 0 && now - lastPlay.at < asset.cooldownMs) return false;
    return true;
  },

  score(asset, event, state, history) {
    let score = 0;

    score += this.scoreByContext(asset, event, state);
    score += this.scoreByRecency(asset, history);
    score += this.scoreByIntensity(asset, event, state);

    return score;
  },

  scoreByContext(asset, event, state) {
    let score = 0;

    if (event.type === 'score.made') {
      if (event.payload.points === 3) score += 2;
      if (state.derived.clutch) score += asset.tags.includes('clutch') ? 4 : 0;
      if (state.derived.scoreDiff <= 6) score += 2;
    }

    if (event.type === 'shot.missed') {
      if (asset.tags.includes('fun')) score += 1;
    }

    return score;
  },

  scoreByRecency(asset, history) {
    const recent = history.slice(-10);
    const repeated = recent.filter(h => h.assetId === asset.id).length;
    return repeated > 0 ? repeated * -10 : 2;
  },

  scoreByIntensity(asset, event, state) {
    if (event.type === 'period.end') return asset.intensity >= 5 ? 5 : -5;
    if (state.derived.clutch) return asset.intensity;
    return 0;
  }
};
```

### Regras mínimas de decisão da primeira versão
1. Nunca repetir o mesmo asset dentro do cooldown
2. Penalizar asset repetido na janela dos últimos N plays
3. Priorizar assets com tag `clutch` nos 2 minutos finais de jogo apertado
4. Priorizar assets de maior intensidade em fim de período / fim de jogo
5. Permitir retorno `null` quando nenhum asset for elegível

---

## Fila de reprodução

### Problema atual
A fila atual só armazena `id`, `category` e `file`.

### Shape proposto

```js
export const AudioPlaybackQueue = {
  queue: [],
  currentAudio: null,
  currentItem: null,

  enqueue(item) {
    this.queue.push(item);
    this.queue.sort((a, b) => b.priority - a.priority || a.requestedAt - b.requestedAt);
    if (!this.currentItem) this.process();
  },

  async process() {
    if (this.currentItem || this.queue.length === 0) return;

    this.currentItem = this.queue.shift();
    this.currentAudio = new Audio(`audios/${this.currentItem.file}`);

    this.currentAudio.onended = () => {
      this.currentAudio = null;
      this.currentItem = null;
      this.process();
    };

    try {
      await this.currentAudio.play();
    } catch (error) {
      this.currentAudio = null;
      this.currentItem = null;
      this.process();
    }
  },

  skipCurrent() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
      this.currentItem = null;
      this.process();
    }
  },

  remove(id) {
    this.queue = this.queue.filter(item => item.id !== id);
  }
};
```

### Shape do item de fila

```js
{
  id: crypto.randomUUID(),
  assetId: 'score_clutch_01',
  file: 'cesta-11.mp3',
  sourceEventId: 'event-id',
  sourceEventType: 'score.made',
  priority: 10,
  requestedAt: Date.now(),
  debug: {
    score: 12,
    reasons: ['clutch', '3pt', 'not-recent']
  }
}
```

---

## Estado derivado do jogo

### Objetivo
Adicionar contexto calculado para o motor de áudio sem espalhar regra por vários pontos.

### Selectors propostos

```js
export function computeDerivedState(state) {
  const home = state.teams.home.score;
  const away = state.teams.away.score;
  const scoreDiff = Math.abs(home - away);
  const leader = home === away ? null : home > away ? 'home' : 'away';
  const clutch = typeof state.period === 'number' && state.period >= 4 && state.clock <= 120000 && scoreDiff <= 6;

  return {
    ...state.derived,
    scoreDiff,
    leader,
    clutch,
    lastEventType: state.events.at(-1)?.type ?? null,
    recentEvents: state.events.slice(-5).map(e => e.type)
  };
}
```

### Contextos mínimos que o áudio deve enxergar
- período atual
- tempo restante
- diferença no placar
- líder / empate
- sequência recente de eventos
- posse atual, quando existir
- faltas coletivas por time
- último áudio executado

---

## Dispatcher central de eventos

### Objetivo
Parar de tocar áudio diretamente a partir de pontos isolados da aplicação.

### Interface proposta

```js
export function dispatchGameEvent(type, payload = {}) {
  const context = buildGameContext(gameState);
  const event = createGameEvent(type, payload, context);

  gameState.events.push(event);
  gameState.derived = computeDerivedState(gameState);

  const selectedAsset = AudioDecisionEngine.decide({
    event,
    state: gameState,
    catalog: AUDIO_CATALOG,
    history: gameState.audio.history
  });

  if (selectedAsset) {
    const queueItem = {
      id: crypto.randomUUID(),
      assetId: selectedAsset.id,
      file: selectedAsset.file,
      sourceEventId: event.id,
      sourceEventType: event.type,
      priority: resolvePriority(event),
      requestedAt: Date.now()
    };

    AudioPlaybackQueue.enqueue(queueItem);
    gameState.audio.history.push({
      assetId: selectedAsset.id,
      eventId: event.id,
      at: Date.now()
    });
  }

  return event;
}
```

---

## Migração do código atual

## Fase 1 — Extrair sem mudar comportamento

### Objetivo
Separar blocos do `main.js` em módulos mantendo a lógica atual.

### Tarefas
- Extrair `gameState` para `game-state.js`
- Extrair `SoundManager` para `audio-playback-queue.js` temporário
- Extrair `GameEngine` e `ClockEngine`
- Exportar/importar funções mantendo chamadas existentes

### Critério de aceite
- Aplicação continua funcionando igual
- Nenhuma regressão nos fluxos atuais de pontuação, falta e relógio

---

## Fase 2 — Tipar eventos do domínio

### Objetivo
Parar de depender de `message` como fonte de semântica.

### Tarefas
- Criar `EVENT_TYPES`
- Criar `createGameEvent`
- Alterar `GameEngine.logEvent()` para salvar `{ type, payload, context }`
- Manter geração de mensagem como função auxiliar para UI/log

### Refactor recomendado
Substituir isso:

```js
GameEngine.logEvent(`${player.name} +${points}pts`, 'score', teamKey, player.number, points)
```

por algo nesta linha:

```js
dispatchGameEvent(EVENT_TYPES.SCORE_MADE, {
  teamKey,
  playerNum: player.number,
  points
});
```

### Critério de aceite
- Todo evento relevante de jogo possui `type`
- O log continua renderizando corretamente

---

## Fase 3 — Criar catálogo com metadados

### Objetivo
Trocar arrays de string por catálogo rico.

### Tarefas
- Migrar `SoundManager.library` para `AUDIO_CATALOG`
- Mapear todos os arquivos existentes
- Adicionar `id`, `eventTypes`, `tags`, `intensity`, `cooldownMs`, `enabled`
- Validar arquivos órfãos ou com nomes inconsistentes

### Critério de aceite
- Todo áudio usado pelo sistema vem do catálogo novo
- Nenhum uso depende mais de `category -> file[]`

---

## Fase 4 — Implementar anti-repetição

### Objetivo
Resolver o problema mais imediato sem depender de toda a inteligência contextual.

### Tarefas
- Criar `gameState.audio.history`
- Implementar `wasRecentlyPlayed(assetId, cooldownMs)`
- Aplicar exclusão por cooldown antes da escolha
- Adicionar penalidade por repetição na janela dos últimos N plays

### Critério de aceite
- O mesmo asset não toca em sequência curta
- O mesmo asset respeita cooldown configurado

---

## Fase 5 — Introduzir decisão por contexto

### Objetivo
Permitir escolha baseada em estado do jogo.

### Regras sugeridas para primeira entrega
- `score.made`:
  - +2 para cesta de 3
  - +4 para `clutch`
  - +2 para placar apertado
- `period.end`:
  - priorizar `official` e intensidade alta
- `game.end`:
  - usar asset determinístico ou de prioridade máxima
- `shot.missed`:
  - usar assets leves, com cooldown maior

### Tarefas
- Criar `computeDerivedState`
- Criar `AudioDecisionEngine.score()`
- Registrar debug da decisão

### Critério de aceite
- Escolha muda conforme evento/contexto
- Decisão pode ser auditada por score/reasons

---

## Fase 6 — Desacoplar chamadas diretas a áudio

### Objetivo
Eliminar `SoundManager.play(...)` espalhado.

### Pontos de troca identificados no código atual
- `GameEngine.endGame()` (`main.js:119-120`)
- `ClockEngine.start()` no estouro de 24s (`main.js:135-139`)
- `ClockEngine.start()` no fim do período (`main.js:142-145`)

### Tarefas
- Substituir chamadas diretas por `dispatchGameEvent(...)`
- Deixar o áudio ser consequência do evento

### Critério de aceite
- Nenhuma regra de escolha sonora fica em `ClockEngine`, `GameEngine` ou UI

---

## Fase 7 — Melhorar a fila com prioridade e controle real

### Objetivo
Permitir controle operacional melhor sobre reprodução.

### Tarefas
- Guardar referência do `Audio` atual
- Implementar `skipCurrent()` real
- Suportar `priority`
- Separar item em execução de itens pendentes

### Critério de aceite
- `skip` interrompe o áudio atual
- Itens críticos podem ultrapassar itens menos importantes

---

## Fase 8 — Testes automatizados

### Objetivo
Dar segurança para evoluir regras.

### Testes unitários mínimos

#### `audio-decision-engine.test.js`
- não repetir asset dentro do cooldown
- priorizar asset `clutch` em fim de jogo apertado
- retornar `null` sem candidatos elegíveis
- penalizar repetição recente

#### `selectors.test.js`
- detectar `clutch` corretamente
- calcular `scoreDiff`
- identificar `leader`

#### `event-dispatcher.test.js`
- criar evento tipado
- empilhar item de fila quando houver asset elegível
- registrar histórico de áudio

### Testes de integração
- cesta de 3 no 4º período com jogo apertado seleciona áudio de maior intensidade
- fim de período gera buzina
- repetição consecutiva do mesmo evento não repete o mesmo asset se houver alternativas

---

## Plano de execução no Antigravity

## Missão principal
Refatorar a arquitetura sonora do projeto `mesa-de-jogo-basquete` de seleção aleatória por categoria para decisão orientada a eventos com contexto de jogo, anti-repetição e catálogo com metadados, sem quebrar os fluxos atuais.

## Sequência recomendada de agentes/tarefas

### Agente 1 — Mapeamento do estado atual
**Objetivo**: catalogar pontos de entrada, produtores de eventos, e chamadas de áudio.

**Prompt sugerido**:
> Analise `main.js` e liste todos os pontos onde o estado do jogo é alterado, onde eventos são registrados, e onde áudios são disparados. Gere uma tabela com função, linhas, efeito colateral e dependências.

**Saída esperada**:
- mapa de mutações de estado
- mapa de chamadas `SoundManager.play(...)`
- mapa de geração de eventos

### Agente 2 — Refactor estrutural
**Objetivo**: extrair `gameState`, `SoundManager`, `GameEngine` e `ClockEngine` em módulos sem alterar comportamento.

**Prompt sugerido**:
> Extraia os blocos centrais de `main.js` para módulos ESM mantendo comportamento idêntico. Não altere regras; apenas reorganize responsabilidades e ajuste imports/exports.

**Saída esperada**:
- módulos criados
- app funcionando sem regressão

### Agente 3 — Modelagem de eventos
**Objetivo**: introduzir `EVENT_TYPES`, `createGameEvent` e `dispatchGameEvent`.

**Prompt sugerido**:
> Substitua o modelo de eventos baseado em mensagem livre por eventos tipados com `type`, `payload` e `context`, mantendo a UI do log funcional.

**Saída esperada**:
- dispatcher central
- eventos tipados
- log ainda operacional

### Agente 4 — Catálogo de áudio
**Objetivo**: migrar biblioteca atual para catálogo com metadados.

**Prompt sugerido**:
> Converta a biblioteca de áudios atual para um catálogo rico com `id`, `file`, `eventTypes`, `tags`, `intensity`, `cooldownMs` e `enabled`. Não invente arquivos novos; use apenas os existentes no projeto.

**Saída esperada**:
- catálogo validado
- arquivos mapeados
- detecção de nomes inconsistentes

### Agente 5 — Motor de decisão
**Objetivo**: implementar `AudioDecisionEngine` v1.

**Prompt sugerido**:
> Crie um motor de decisão de áudio que receba evento tipado, estado e histórico; aplique elegibilidade por cooldown, penalidade por repetição recente e ranking por contexto.

**Saída esperada**:
- engine funcional
- critérios auditáveis

### Agente 6 — Integração com fila
**Objetivo**: conectar dispatcher -> decision engine -> playback queue.

**Prompt sugerido**:
> Integre o dispatcher de eventos ao motor de decisão e à fila de reprodução. Remova chamadas diretas de reprodução espalhadas pelo fluxo de jogo.

**Saída esperada**:
- áudio como consequência do evento
- histórico de reprodução

### Agente 7 — Testes
**Objetivo**: blindar a arquitetura nova com testes.

**Prompt sugerido**:
> Implemente testes unitários e de integração para catálogo, decisão sonora, derived state e dispatcher, cobrindo anti-repetição, clutch e buzina de fim de período.

**Saída esperada**:
- suíte mínima confiável
- cenários críticos cobertos

---

## Checklist de implementação

### Estrutura
- [ ] Extrair módulos do `main.js`
- [ ] Criar `event-types.js`
- [ ] Criar `event-dispatcher.js`
- [ ] Criar `audio-catalog.js`
- [ ] Criar `audio-decision-engine.js`
- [ ] Criar `audio-playback-queue.js`
- [ ] Criar `selectors.js`

### Domínio
- [ ] Tipar eventos principais
- [ ] Adicionar `possession` ao estado se já existir no fluxo real
- [ ] Adicionar `derived` ao estado
- [ ] Registrar histórico de áudio

### Áudio
- [ ] Migrar biblioteca atual para catálogo rico
- [ ] Implementar cooldown
- [ ] Implementar anti-repetição recente
- [ ] Implementar ranking por contexto
- [ ] Implementar prioridade de fila
- [ ] Persistir referência do áudio atual

### Integração
- [ ] Substituir `SoundManager.play(...)` direto por `dispatchGameEvent(...)`
- [ ] Atualizar UI da fila para novo shape
- [ ] Manter soundboard manual funcionando

### Qualidade
- [ ] Testes unitários do engine
- [ ] Testes dos selectors
- [ ] Testes do dispatcher
- [ ] Testes de integração do fluxo crítico

---

## Riscos técnicos

### 1. Regressão funcional no fluxo atual
Mitigação: fazer Fase 1 sem alterar regra; só depois introduzir novos comportamentos.

### 2. Acoplamento excessivo entre UI e estado
Mitigação: isolar dispatcher e selectors antes de mexer nas regras de áudio.

### 3. Catálogo inconsistente por nome de arquivos
Mitigação: gerar inventário automático de `public/audios` e validar existência de cada referência.

### 4. Crescimento de regras no engine virar novo monólito
Mitigação: separar scoring por política (`scoreByContext`, `scoreByRecency`, `scoreByIntensity`).

---

## Critérios finais de aceite

A implementação será considerada concluída quando:
- não existir mais seleção aleatória direta por `Math.random()` na decisão principal de áudio
- todo áudio automático for consequência de evento tipado
- houver anti-repetição e cooldown funcionando
- a decisão usar pelo menos período, tempo restante e diferença no placar
- a fila suportar item atual e pendentes separadamente
- o log de eventos continuar funcional
- houver testes cobrindo os cenários críticos

---

## Entrega incremental ideal

### Sprint 1
- extração modular
- eventos tipados
- catálogo novo

### Sprint 2
- anti-repetição
- decision engine v1
- dispatcher central

### Sprint 3
- prioridade de fila
- debug de decisão
- testes de integração

---

## Prompt mestre para Antigravity

```text
Objetivo: refatorar a arquitetura de áudio do projeto mesa-de-jogo-basquete para substituir a seleção aleatória por categoria por uma arquitetura orientada a eventos com contexto do jogo.

Restrições:
- não quebrar os fluxos atuais do app
- não inventar arquivos de áudio inexistentes
- usar apenas o código existente como base
- manter a UI atual funcional
- focar em arquitetura e lógica, não em redesign visual

Entregas obrigatórias:
1. extração incremental do main.js em módulos
2. criação de eventos tipados (`type`, `payload`, `context`)
3. criação de catálogo de áudio com metadados
4. criação de AudioDecisionEngine com cooldown, anti-repetição e ranking contextual
5. criação de fila de reprodução com item atual + pendentes + prioridade
6. substituição de chamadas diretas de áudio por dispatcher central
7. testes unitários e de integração para a nova arquitetura

Critérios técnicos:
- decisão sonora não pode depender de `Math.random()` puro
- todo áudio automático deve ser traçável ao evento que o originou
- engine deve ser testável sem tocar áudio real
- contexto mínimo da decisão: período, tempo restante, diferença no placar, últimos eventos
- código deve permanecer simples e incremental, compatível com a base atual
```
