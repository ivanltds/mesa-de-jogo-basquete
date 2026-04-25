# Plano Revisado e Operacional — Gestão de Áudio por Tela

## Objetivo
Implementar uma **gestão de áudio por tela** compatível com o código atual do projeto `mesa-de-jogo-basquete`, sem assumir uma arquitetura que ainda não existe.

Este plano foi revisado com base no estado real do código atual, especialmente em `main.js`, onde:
- o estado está centralizado em `gameState` (`main.js:1-11`)
- a decisão de áudio está em `SoundManager` (`main.js:13-76`)
- a troca de telas passa por `UIManager.switchScreen(screenId)` (`main.js:223-227`)
- o disparo de áudio ainda é feito por chamadas diretas como `SoundManager.play('cesta')` (`main.js:499`) e `SoundManager.play('buzina')` (`main.js:120`, `137`, `143`, `523`)

O foco aqui é criar uma solução **incremental, aplicável agora**, que permita administrar o comportamento sonoro de acordo com a tela ativa.

---

## O que significa “gestão por tela” neste momento do projeto

No código atual, “gestão por tela” não deve começar como um motor complexo de score por asset individual, porque hoje:
- os áudios são organizados só por categoria (`SoundManager.library`, `main.js:15-25`)
- a escolha dentro da categoria é aleatória com `Math.random()` (`main.js:27-33`)
- não existe catálogo com metadados por arquivo
- não existe `AudioDecisionEngine`
- não existe contexto persistido de tela ativa no estado

Portanto, a forma correta de implementar isso **agora** é:
- registrar qual tela está ativa
- centralizar o disparo de áudio em uma função única
- aplicar um perfil por tela para decidir **qual categoria tocar**, **se pode tocar**, e **como tratar eventos automáticos/manuais**
- criar uma interface de gestão simples para editar esse comportamento

---

## Escopo exato desta implementação

### Dentro do escopo
- rastrear `activeScreenId`
- criar perfis por tela
- centralizar o disparo de áudio
- controlar categoria por evento com base na tela
- configurar mapeamento de score (`+1`, `+2`, `+3`) por tela
- controlar categorias permitidas/bloqueadas por tela
- controlar se a tela permite áudio automático
- controlar prioridade manual vs automática por tela
- criar uma tela simples de administração dessas regras

### Fora do escopo nesta fase
- score avançado por asset individual
- breakdown detalhado por candidato
- catálogo rico com metadados por arquivo
- engine contextual completa com ranking multi-critério
- presets inteligentes por contexto de jogo

Esses itens podem entrar numa segunda fase, depois que a camada por tela estiver funcionando.

---

## Leitura do estado atual do código

### Estado global existente

```js
const gameState = {
  clock: 600000,
  shotClock: 24000,
  isActive: false,
  period: 1,
  teams: {
    home: { name: 'CASA', score: 0, fouls: 0, timeouts: 0, players: [], color: '#ff6b00' },
    away: { name: 'VISITANTE', score: 0, fouls: 0, timeouts: 0, players: [], color: '#2196f3' }
  },
  events: []
};
```

### Biblioteca atual de áudio

```js
library: {
  cesta: [...],
  errou: [...],
  divertido: [...],
  toco: [...],
  posse: [...],
  nba: [...],
  torcida: [...],
  buzina: [...],
  musica: [...]
}
```

### Pontos reais que já existem e devem ser usados
- `UIManager.switchScreen(screenId)` como ponto único de troca de tela
- `window.addPoints(team, num, pts)` como ponto único de score de jogador
- `SoundManager.play(category)` como ponto atual de disparo automático por categoria
- `SoundManager.playFile(filename)` como ponto atual de disparo manual por arquivo
- `UIManager.renderSoundQueue()` como ponto atual de visualização da fila

---

## Arquitetura alvo desta fase

### Componentes novos mínimos
1. `AudioScreenState` — guarda a tela ativa
2. `AUDIO_SCREEN_PROFILES` — configuração por tela
3. `triggerAudio(eventName, payload)` — ponto único de decisão de categoria
4. `resolveCategoryForEvent(eventName, payload, profile)` — roteamento por regra
5. `audio-policy-screen` — tela simples de gestão

### Princípio
A tela ativa não escolhe diretamente o arquivo de áudio; ela escolhe o **perfil** que influencia a categoria e a permissão de tocar áudio.

---

## Modelo de estado revisado

### Alteração mínima no `gameState`
Adicionar um bloco `ui`.

```js
const gameState = {
  clock: 600000,
  shotClock: 24000,
  isActive: false,
  period: 1,
  teams: {
    home: { name: 'CASA', score: 0, fouls: 0, timeouts: 0, players: [], color: '#ff6b00' },
    away: { name: 'VISITANTE', score: 0, fouls: 0, timeouts: 0, players: [], color: '#2196f3' }
  },
  events: [],
  ui: {
    activeScreenId: 'setup-screen'
  }
};
```

### Motivo
Esse é o menor ajuste possível para que a regra sonora passe a conhecer o contexto da tela sem reestruturar o app inteiro.

---

## Perfis por tela

### Conceito
Cada tela terá um perfil declarativo que diz:
- se pode tocar áudio automático
- se dá prioridade para origem manual
- quais categorias são permitidas
- quais categorias são bloqueadas
- qual categoria usar para score `+1`, `+2`, `+3`

### Estrutura proposta

```js
const AUDIO_SCREEN_PROFILES = {
  'setup-screen': {
    allowAutomaticAudio: false,
    manualPriority: false,
    scoreCategories: { 1: null, 2: null, 3: null },
    allowedCategories: [],
    blockedCategories: []
  },

  'match-screen': {
    allowAutomaticAudio: true,
    manualPriority: false,
    scoreCategories: { 1: 'cesta', 2: 'cesta', 3: 'cesta' },
    allowedCategories: ['cesta', 'buzina', 'posse'],
    blockedCategories: ['musica']
  },

  'dj-screen': {
    allowAutomaticAudio: true,
    manualPriority: true,
    scoreCategories: { 1: 'cesta', 2: 'cesta', 3: 'cesta' },
    allowedCategories: ['cesta', 'divertido', 'nba', 'torcida', 'musica', 'buzina', 'posse'],
    blockedCategories: []
  },

  'report-screen': {
    allowAutomaticAudio: false,
    manualPriority: false,
    scoreCategories: { 1: null, 2: null, 3: null },
    allowedCategories: [],
    blockedCategories: ['cesta', 'divertido', 'nba', 'torcida', 'musica', 'posse']
  },

  'default': {
    allowAutomaticAudio: true,
    manualPriority: false,
    scoreCategories: { 1: 'cesta', 2: 'cesta', 3: 'cesta' },
    allowedCategories: ['cesta', 'buzina'],
    blockedCategories: []
  }
};
```

### Observação importante
Os `screenId` reais usados devem refletir as telas que já existem no projeto. O ponto de verdade atual é `switchScreen(screenId)` (`main.js:223-227`) e os ids existentes nos HTMLs. Antes de finalizar essa estrutura, o agente deve levantar todos os `screenId` reais do projeto e preencher esse objeto com base neles.

---

## Registro da tela ativa

### Alteração necessária
Modificar `UIManager.switchScreen(screenId)`.

### Implementação sugerida

```js
switchScreen(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(screenId).classList.add('active');

  gameState.ui.activeScreenId = screenId;

  if (screenId === 'match-screen') this.initMatchUI();
}
```

### Critério de aceite
Toda troca de tela precisa atualizar `gameState.ui.activeScreenId` corretamente.

---

## Ponto único de disparo de áudio

### Problema atual
Hoje o áudio é disparado diretamente em vários pontos:
- `GameEngine.endGame()` → `SoundManager.play('buzina')`
- `ClockEngine.start()` → `SoundManager.play('buzina')`
- `window.addPoints()` → `SoundManager.play('cesta')`
- `window.addTimeout()` → `SoundManager.play('buzina')`
- botões DJ → `SoundManager.play(...)`

Isso impede gestão coerente por tela.

### Solução
Criar uma função única para disparo de áudio contextual.

```js
function triggerAudio(eventName, payload = {}, options = {}) {
  const screenId = gameState.ui?.activeScreenId || 'default';
  const profile = AUDIO_SCREEN_PROFILES[screenId] || AUDIO_SCREEN_PROFILES.default;
  const source = options.source || 'automatic';

  if (source === 'automatic' && !profile.allowAutomaticAudio) {
    return;
  }

  const category = resolveCategoryForEvent(eventName, payload, profile, source);
  if (!category) return;

  if (profile.blockedCategories.includes(category)) return;
  if (profile.allowedCategories.length > 0 && !profile.allowedCategories.includes(category)) return;

  SoundManager.play(category);
}
```

---

## Resolver categoria por evento

### Objetivo
Traduzir eventos do domínio atual para categorias existentes no `SoundManager.library`.

### Implementação sugerida

```js
function resolveCategoryForEvent(eventName, payload, profile, source) {
  if (source === 'manual' && payload.category) {
    return payload.category;
  }

  switch (eventName) {
    case 'score':
      return profile.scoreCategories?.[payload.points] ?? 'cesta';

    case 'timeout':
      return 'buzina';

    case 'period-end':
      return 'buzina';

    case 'shotclock-violation':
      return 'buzina';

    case 'game-end':
      return 'buzina';

    case 'manual-posse':
      return 'posse';

    case 'manual-fun':
      return 'divertido';

    case 'manual-nba':
      return 'nba';

    case 'manual-crowd':
      return 'torcida';

    case 'manual-music':
      return 'musica';

    default:
      return null;
  }
}
```

### Importante
Nesta fase, a regra continua baseada em **categoria**, porque é isso que o código suporta hoje.

---

## Refactor dos pontos atuais de disparo

## 1. Pontuação

### Hoje

```js
SoundManager.play('cesta');
```

### Fica

```js
triggerAudio('score', {
  team,
  playerNum: num,
  points: pts
}, { source: 'automatic' });
```

### Onde aplicar
`window.addPoints()` (`main.js:493-500`)

---

## 2. Fim de jogo

### Hoje

```js
SoundManager.play('buzina');
```

### Fica

```js
triggerAudio('game-end', {}, { source: 'automatic' });
```

### Onde aplicar
`GameEngine.endGame()` (`main.js:113-123`)

---

## 3. Estouro de 24s

### Hoje

```js
SoundManager.play('buzina');
```

### Fica

```js
triggerAudio('shotclock-violation', {}, { source: 'automatic' });
```

### Onde aplicar
`ClockEngine.start()` (`main.js:135-139`)

---

## 4. Fim de período

### Hoje

```js
SoundManager.play('buzina');
```

### Fica

```js
triggerAudio('period-end', {}, { source: 'automatic' });
```

### Onde aplicar
`ClockEngine.start()` (`main.js:142-145`)

---

## 5. Timeout

### Hoje

```js
SoundManager.play('buzina');
```

### Fica

```js
triggerAudio('timeout', { team }, { source: 'automatic' });
```

### Onde aplicar
`window.addTimeout()` (`main.js:519-524`)

---

## 6. Soundboard manual

### Hoje
Os botões usam `SoundManager.playFile(filename)` diretamente em `renderSoundboard()` (`main.js:348-367`).

### Ajuste recomendado
Adicionar uma camada para que até a ação manual saiba qual tela está ativa e obedeça à política.

```js
function triggerManualAudio(category, filename = null) {
  const screenId = gameState.ui?.activeScreenId || 'default';
  const profile = AUDIO_SCREEN_PROFILES[screenId] || AUDIO_SCREEN_PROFILES.default;

  if (profile.blockedCategories.includes(category)) return;
  if (profile.allowedCategories.length > 0 && !profile.allowedCategories.includes(category)) return;

  if (filename) {
    SoundManager.playFile(filename);
    return;
  }

  SoundManager.play(category);
}
```

E trocar o `onclick` gerado para usar essa função.

---

## Gestão por tela da pontuação

### O que isso significa de forma prática hoje
Como o projeto ainda não diferencia assets de score por arquivo, a gestão por tela da pontuação deve começar controlando o mapeamento de `+1`, `+2`, `+3` para categorias.

### Exemplo

```js
'match-screen': {
  scoreCategories: {
    1: 'cesta',
    2: 'cesta',
    3: 'cesta'
  }
}
```

### Evolução futura possível
Quando existir separação real de categorias como `cesta1`, `cesta2`, `cesta3`, esse mesmo contrato pode evoluir sem quebrar a estrutura.

```js
'match-screen': {
  scoreCategories: {
    1: 'cesta1',
    2: 'cesta2',
    3: 'cesta3'
  }
}
```

---

## Tela de gestão administrativa

## Objetivo
Criar uma tela simples de configuração das regras por tela, compatível com a estrutura atual.

## Nome sugerido
`audio-policy-screen`

## O que essa tela deve editar
Para cada tela cadastrada:
- `allowAutomaticAudio`
- `manualPriority`
- `scoreCategories[1]`
- `scoreCategories[2]`
- `scoreCategories[3]`
- `allowedCategories`
- `blockedCategories`

## O que essa tela não precisa fazer agora
- simular ranking por asset
- mostrar breakdown por candidato
- editar pesos complexos
- controlar cooldown por arquivo

---

## Layout funcional da tela de gestão

### Seção 1 — Seleção da tela
- dropdown com telas reais registradas

### Seção 2 — Configurações gerais
- checkbox: permitir áudio automático
- checkbox: priorizar ações manuais

### Seção 3 — Mapeamento de score
- select para `+1`
- select para `+2`
- select para `+3`

### Seção 4 — Categorias
- lista com todas as categorias do `SoundManager.library`
- toggle de permitido/bloqueado por categoria

### Seção 5 — Teste rápido
- botão: testar `score +1`
- botão: testar `score +2`
- botão: testar `score +3`
- botão: testar `timeout`
- botão: testar `buzina`
- botão: testar `divertido`

---

## Fonte de verdade das categorias

### Regra
A tela de gestão não deve hardcodar categorias manualmente; ela deve usar as chaves reais de `SoundManager.library`.

### Implementação sugerida

```js
function getAvailableAudioCategories() {
  return Object.keys(SoundManager.library);
}
```

Isso garante aderência ao código atual sem duplicação desnecessária.

---

## Persistência

### Fase atual
A forma mais segura é manter a configuração em memória primeiro e, se necessário, exportar/importar JSON manualmente.

### Shape proposto

```js
const audioPolicyState = {
  profiles: AUDIO_SCREEN_PROFILES
};
```

### Alternativas futuras
- salvar em backend
- salvar em Supabase
- salvar em arquivo JSON versionado

Nesta fase, evitar depender de infraestrutura nova é a escolha mais segura.

---

## Ordem de implementação recomendada

## Etapa 1 — Mapear telas reais

### Tarefas
- levantar todos os `screenId` reais do projeto
- identificar quais realmente disparam áudio
- montar lista oficial de telas que entram na gestão

### Critério de aceite
Existe uma lista única e confiável de `screenId` suportados.

---

## Etapa 2 — Registrar tela ativa

### Tarefas
- adicionar `gameState.ui.activeScreenId`
- atualizar `UIManager.switchScreen(screenId)`

### Critério de aceite
Toda troca de tela atualiza corretamente `activeScreenId`.

---

## Etapa 3 — Centralizar disparo de áudio

### Tarefas
- criar `triggerAudio(...)`
- criar `resolveCategoryForEvent(...)`
- trocar disparos diretos por chamadas centralizadas

### Critério de aceite
Nenhum evento automático chama `SoundManager.play(...)` diretamente.

---

## Etapa 4 — Criar perfis por tela

### Tarefas
- criar `AUDIO_SCREEN_PROFILES`
- definir perfis para telas reais
- implementar fallback `default`

### Critério de aceite
A categoria tocada e a permissão de tocar dependem da tela ativa.

---

## Etapa 5 — Adaptar soundboard manual

### Tarefas
- criar `triggerManualAudio(...)`
- adaptar `renderSoundboard()`
- respeitar bloqueios/permissões por tela

### Critério de aceite
A soundboard manual também respeita a política da tela.

---

## Etapa 6 — Criar tela de gestão

### Tarefas
- criar `audio-policy-screen`
- editar perfis por tela
- listar categorias disponíveis
- adicionar botões de teste rápido

### Critério de aceite
O operador consegue alterar o comportamento por tela sem editar código.

---

## Etapa 7 — Testes

### Testes mínimos sugeridos
- trocar tela atualiza `activeScreenId`
- `match-screen` permite score automático
- `report-screen` bloqueia score automático
- `triggerAudio('score', { points: 3 })` usa o mapeamento da tela ativa
- categorias bloqueadas não tocam
- ação manual respeita categorias permitidas

---

## Plano de trabalho no Antigravity

## Missão principal
Implementar gestão de áudio por tela no projeto atual, respeitando a arquitetura existente baseada em `main.js`, `gameState`, `SoundManager` e `UIManager.switchScreen()`.

---

## Prompt mestre para Antigravity

```text
Objetivo: implementar uma gestão de áudio por tela compatível com o código atual do projeto mesa-de-jogo-basquete.

Contexto do código atual:
- estado centralizado em main.js
- SoundManager com biblioteca por categoria e escolha aleatória por categoria
- troca de telas via UIManager.switchScreen(screenId)
- disparos de áudio automáticos espalhados em addPoints, addTimeout, ClockEngine e GameEngine
- soundboard manual renderizada a partir de SoundManager.library

Restrições:
- não assumir AudioDecisionEngine, catálogo rico por asset ou refactor total da arquitetura
- trabalhar em cima da estrutura atual
- a primeira fase deve gerenciar categoria e permissão por tela, não ranking por asset
- evitar quebrar o funcionamento atual da fila e da soundboard

Entregas obrigatórias:
1. adicionar activeScreenId ao estado
2. registrar tela ativa em switchScreen
3. criar AUDIO_SCREEN_PROFILES por tela real do sistema
4. criar triggerAudio(eventName, payload, options)
5. criar resolveCategoryForEvent(eventName, payload, profile, source)
6. substituir disparos diretos de SoundManager.play(...) por triggerAudio(...)
7. adaptar a soundboard manual para respeitar política por tela
8. criar uma tela simples de gestão chamada audio-policy-screen
9. adicionar testes cobrindo troca de tela, bloqueios e mapeamento de score por tela

Critérios técnicos:
- a tela ativa deve influenciar se o áudio toca e qual categoria é usada
- score +1/+2/+3 deve poder ser configurado por tela
- categorias permitidas/bloqueadas devem ser configuráveis por tela
- a solução deve ser incremental e compatível com o main.js atual
```

---

## Prompt por agente

### Agente 1 — Levantamento de telas e pontos de áudio
> Analise o projeto atual e liste todos os screenIds reais, todos os pontos onde SoundManager.play ou SoundManager.playFile são chamados, e todos os fluxos que disparam áudio automático e manual.

### Agente 2 — Estado de tela ativa
> Adicione o rastreamento de activeScreenId ao gameState e integre essa atualização ao UIManager.switchScreen sem alterar o comportamento atual das telas.

### Agente 3 — Centralização do disparo automático
> Crie triggerAudio(eventName, payload, options) e resolveCategoryForEvent(...), substituindo os disparos diretos de SoundManager.play nos fluxos automáticos do jogo.

### Agente 4 — Perfis por tela
> Crie AUDIO_SCREEN_PROFILES usando apenas telas reais do projeto e categorias existentes no SoundManager.library, incluindo fallback default.

### Agente 5 — Soundboard manual compatível
> Adapte a renderização da soundboard manual para que o disparo por arquivo/categoria respeite o perfil da tela ativa e as categorias permitidas/bloqueadas.

### Agente 6 — Tela de gestão
> Crie uma tela simples audio-policy-screen para editar allowAutomaticAudio, manualPriority, scoreCategories e allowed/blockedCategories por tela.

### Agente 7 — Testes
> Implemente testes cobrindo troca de tela, triggerAudio, bloqueio por categoria, e mapeamento de score por tela usando a arquitetura atual do projeto.

---

## Checklist final

- [ ] `gameState.ui.activeScreenId` criado
- [ ] `switchScreen()` atualiza a tela ativa
- [ ] `triggerAudio()` criado
- [ ] `resolveCategoryForEvent()` criado
- [ ] disparos automáticos centralizados
- [ ] perfis por tela criados
- [ ] `scoreCategories[1|2|3]` configuráveis por tela
- [ ] categories permitidas/bloqueadas por tela
- [ ] soundboard manual respeita política da tela
- [ ] `audio-policy-screen` criada
- [ ] testes mínimos implementados

---

## Critério final de sucesso

A feature estará pronta quando o mesmo evento sonoro puder se comportar de maneira diferente conforme a tela ativa, usando apenas a arquitetura atual do projeto, sem introduzir dependências estruturais que ainda não existem.
