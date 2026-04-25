# Dicionário de Nomenclatura e Microcopy — Áudio e Escolha de Sons

## Objetivo
Padronizar a linguagem exibida ao operador final nas telas ligadas a áudio, com foco em **clareza operacional**, **remoção de termos técnicos desnecessários** e **coerência com o que já está implementado hoje no repositório**.

Este documento foi escrito considerando o estado atual do projeto, especialmente:
- a existência da tela `audio-policy-screen`
- a navegação para essa tela via `audio-policy-btn`
- a existência de perfis em `src/audio/audio-profiles.js`
- a lógica visual da tela em `src/ui/ui-manager.js`
- a arquitetura atual com `AudioDecisionEngine`, `AUDIO_CATALOG`, `triggerAudio(...)` e `triggerManualAudio(...)`

A intenção **não é renomear a estrutura técnica do código**, e sim definir com precisão **o que o operador deve ler na interface**.

---

# Regra principal

## O código pode continuar técnico; a interface não
Nomes internos como:
- `allowAutomaticAudio`
- `manualPriority`
- `scoreCategories`
- `eventCategories`
- `blockedCategories`
- `AudioDecisionEngine`
- `scoreByRecency`
- `cooldownMs`

podem continuar no código.

Mas a interface do operador deve usar uma linguagem:
- direta
- em português
- orientada à operação
- centrada em “resultado percebido”
- sem depender de conhecimento técnico do sistema

---

# Princípios de microcopy

## 1. Falar de comportamento, não de algoritmo
Evitar:
- score
- ranking
- breakdown
- cooldown
- intensity
- recency
- policy

Preferir:
- escolha
- ordem de preferência
- motivo da escolha
- evitar repetição
- força do som
- som recente
- comportamento do som

---

## 2. Falar da ação do operador
Evitar textos impessoais e técnicos.

Preferir textos que respondam perguntas como:
- o que acontece aqui?
- o que muda se eu ligar isso?
- por que esse som foi escolhido?
- como eu deixo o sistema mais animado ou mais controlado?

---

## 3. Usar nomes de tela com sentido operacional
Evitar nomes de tela que soem internos.

Preferir nomes que expliquem a função da tela.

---

## 4. Priorizar entendimento imediato
Se o operador precisar interpretar o termo antes de agir, o texto está ruim.

---

# Mapeamento oficial — nomes internos para interface

## 1. Tela principal de política de áudio

### Nome técnico atual
`audio-policy-screen`

### Texto recomendado para interface
**Comportamento do Som**

### Subtítulo recomendado
**Defina como o sistema reage em cada tela do jogo e da mesa de som.**

### Alternativas aceitáveis
- Ajuste do Som
- Regras do Som
- Controle dos Sons do Jogo

### Evitar
- Audio Policy
- Política de Áudio
- Smart Soundtrack
- Configuração de Engine

### Justificativa
A tela já existe para controlar comportamento por tela em `src/ui/ui-manager.js:338-401` e `404-461`, então “Comportamento do Som” descreve melhor o uso real do que “policy”.

---

## 2. Badge/título auxiliar da tela atual

### Texto atual no HTML
`SMART SOUNDTRACK`

### Texto recomendado
**O sistema escolhe os sons do jogo**

### Alternativas
- Ajuste automático dos sons
- Controle inteligente do som

### Evitar
- Smart Soundtrack
- AI Audio
- Audio Policy

### Justificativa
O operador não precisa saber que existe “smart soundtrack”; ele precisa entender o que a tela faz.

---

## 3. Seletor de tela

### Elemento atual
`policy-screen-selector`

### Título recomendado
**Onde você quer ajustar o som?**

### Texto de apoio recomendado
**Escolha a área do sistema em que esse comportamento deve valer.**

### Labels dos tiles
Usar os nomes que já existem nos perfis:
- `match-screen` → **Mesa de Jogo**
- `soundboard-screen` → **Mesa de Som**

### Justificativa
Os nomes amigáveis já existem em `src/audio/audio-profiles.js:4-42` como `name: 'Mesa de Jogo'` e `name: 'Mesa de Som'`.

---

## 4. allowAutomaticAudio

### Nome interno
`allowAutomaticAudio`

### Texto principal recomendado
**Permitir sons automáticos nesta tela**

### Texto de ajuda recomendado
**Quando ligado, o sistema toca sons sozinho em eventos do jogo.**

### Texto curto para switch
**Sons automáticos**

### Evitar
- Allow automatic audio
- Áudio automático habilitado
- Auto trigger

### Justificativa
Essa regra é aplicada diretamente no bridge em `src/audio/audio-bridge.js:63-66`.

---

## 5. manualPriority

### Nome interno
`manualPriority`

### Texto principal recomendado
**O comando manual tem prioridade**

### Texto de ajuda recomendado
**Quando você toca um som manualmente, ele pode interromper o som atual.**

### Texto curto para switch
**Prioridade do manual**

### Alternativas aceitáveis
- O botão manual interrompe o som atual
- Comando manual na frente do automático

### Evitar
- Manual priority
- Prioridade de source manual
- Override manual

### Justificativa
A regra já existe em `src/audio/audio-bridge.js:80-83` e `97-100`, mas “manual priority” é linguagem de implementação, não de operação.

---

## 6. scoreCategories

### Nome interno
`scoreCategories`

### Título recomendado
**Som usado em cada tipo de cesta**

### Texto de ajuda recomendado
**Escolha qual tipo de som o sistema deve usar para 1, 2 ou 3 pontos.**

### Labels dos campos
- `score-map-1` → **Cesta de 1 ponto**
- `score-map-2` → **Cesta de 2 pontos**
- `score-map-3` → **Cesta de 3 pontos**

### Placeholder recomendado
**Escolha um tipo de som**

### Opção vazia
**Nenhum som**

### Evitar
- Score map
- Score categories
- Mapping
- Tile select

### Justificativa
O operador pensa em tipo de cesta, não em “mapear score”.

---

## 7. eventCategories

### Nome interno
`eventCategories`

### Título recomendado
**Som usado em cada evento do jogo**

### Texto de ajuda recomendado
**Defina como o sistema reage quando certos eventos acontecem.**

### Labels recomendados
- `posse_24` → **Reposição / 24 segundos**
- `posse_14` → **Reposição / 14 segundos**
- `foul` → **Falta**
- `sub` → **Substituição**
- `timeout` → **Pedido de tempo**
- `period_end` → **Fim de período**
- `countdown_1m` → **Último minuto**
- `countdown_24s` → **Aviso dos 24 segundos**
- `countdown_10s` → **Últimos 10 segundos**
- `game_end` → **Fim de jogo**

### Opção vazia
**Não tocar som**

### Evitar
- Event map
- Event categories
- Trigger map
- Countdown

### Justificativa
`loadPolicyForScreen()` já popula esses campos em `src/ui/ui-manager.js:439-447`, então o ajuste é de texto, não de conceito.

---

## 8. blockedCategories

### Nome interno
`blockedCategories`

### Título recomendado
**Tipos de som desativados nesta tela**

### Texto de ajuda recomendado
**Desligue os tipos de som que não devem tocar aqui.**

### Texto do grid de categorias
**Toque permitido** / **Toque bloqueado**

### Evitar
- Blocked categories
- Mood grid
- Category policy

### Justificativa
Hoje o grid é renderizado em `src/ui/ui-manager.js:449-460`, mas o operador precisa entender isso como ativar/desativar tipos de som, não como política de categoria.

---

## 9. save-policy-btn

### Texto recomendado do botão
**Salvar mudanças**

### Feedback de sucesso recomendado
**Ajustes do som salvos**

### Feedback alternativo
**As mudanças já estão valendo nesta tela**

### Evitar
- Save policy
- Policy saved

---

# Nomenclatura recomendada para a futura tela de score do asset

## Nome técnico sugerido
`audio-scoring-screen`

## Nome recomendado na interface
**Escolha dos Áudios**

### Alternativas muito boas
- Inteligência do Som
- Como o sistema escolhe os áudios
- Motivos da escolha do áudio

### Evitar
- Audio Scoring
- Scoring Engine
- Ranking Engine
- Audio Decision Engine

### Justificativa
A tela vai existir para explicar e ajustar a escolha, não para ensinar engenharia de decisão.

---

# Textos recomendados para a futura tela de score

## Cabeçalho da tela

### Título
**Como o sistema escolhe os áudios**

### Subtítulo
**Veja o que influencia a escolha, ajuste os critérios e simule situações do jogo.**

### Versão mais curta
**Ajuste os critérios de escolha dos sons do jogo.**

---

## Seção 1 — pesos/regras

### Título recomendado
**O que influencia a escolha**

### Texto de apoio
**Aqui você define o que deve pesar mais na hora de escolher um áudio.**

### Evitar
- Score rules
- Scoring weights
- Engine weights

---

## Seção 2 — recency

### Título recomendado
**Evitar repetição**

### Texto de apoio
**Controle o quanto o sistema evita tocar o mesmo áudio muitas vezes em sequência.**

### Termos recomendados
- `recency` → **repetição recente**
- `recentWindow` → **janela de repetição** ou **quantidade de jogadas analisadas**
- `repeatPenaltyPerOccurrence` → **penalidade por repetição**
- `noRepeatBonus` → **bônus por variar o áudio**

### Evitar
- Recency
- Cooldown window
- Recent repeats

---

## Seção 3 — intensity

### Título recomendado
**Força da reação sonora**

### Texto de apoio
**Defina quando o sistema deve preferir sons mais fortes ou mais equilibrados.**

### Termos recomendados
- `intensity` → **força do som**
- `highIntensity...Bonus` → **preferir som forte**
- `mediumIntensityDefaultBonus` → **preferir som equilibrado**
- `lowIntensity...Penalty` → **reduzir chance de som fraco**

### Evitar
- Intensity
- High intensity bonus
- Medium default

---

## Seção 4 — clutch

### Termo técnico interno
`clutch`

### Texto recomendado na UI
**momento decisivo**

### Explicação curta recomendada
**Final apertado de jogo, quando a escolha do som precisa ser mais forte e certeira.**

### Evitar
- Clutch
- Clutch mode
- Clutch bonus

### Justificativa
`clutch` hoje existe como parte do estado derivado em `src/core/selectors.js:9-12`, mas o operador não precisa conhecer o termo em inglês.

---

## Seção 5 — official

### Texto recomendado na UI
**som oficial**

### Explicação curta recomendada
**Som mais neutro e padrão para eventos como fim de período, fim de jogo e pedidos de tempo.**

### Evitar
- Official tag
- Official asset

---

## Seção 6 — fun

### Texto recomendado na UI
**som descontraído**

### Alternativas
- som leve
- som divertido

### Evitar
- Fun tag

---

## Seção 7 — ranking

### Título recomendado
**Ordem de preferência dos áudios**

### Texto de apoio
**O sistema avalia os áudios possíveis e organiza do mais indicado ao menos indicado.**

### Evitar
- Ranking
- Candidate ranking
- Rank output

---

## Seção 8 — breakdown

### Título recomendado
**Motivos da escolha**

### Texto de apoio
**Veja o que aumentou ou reduziu a chance de cada áudio.**

### Evitar
- Breakdown
- Score breakdown
- Score decomposition

---

## Seção 9 — winner

### Título recomendado
**Áudio escolhido**

### Subtexto recomendado
**Este seria o áudio selecionado pelo sistema nessa situação.**

### Evitar
- Winner
- Top asset
- Selected candidate

---

## Seção 10 — simulation

### Título recomendado
**Simular uma situação do jogo**

### Texto de apoio
**Monte um cenário e veja qual áudio o sistema escolheria.**

### Evitar
- Simulation
- Event simulation
- Test scenario engine

---

# Exemplos de rótulos amigáveis para os controles futuros

## scoreMade.threePointBonus
**Dar mais peso para cesta de 3 pontos**

## scoreMade.closeGameBonus
**Dar mais peso para jogo apertado**

## scoreMade.clutchTagBonus
**Dar mais peso para som forte em momento decisivo**

## shotMissed.funTagBonus
**Favorecer som descontraído quando a jogada termina em erro**

## timeout.officialTagBonus
**Preferir som oficial em pedido de tempo**

## periodEnd.officialTagBonus
**Preferir som oficial no fim do período**

## gameEnd.officialTagBonus
**Preferir som oficial no fim do jogo**

## foulPersonal.regularFoulPenalty
**Reduzir chance de tocar som em falta comum**

## foulPersonal.exclusionOfficialBonus
**Preferir som oficial em falta que tira o jogador do jogo**

## recency.noRepeatBonus
**Dar preferência para áudio que não foi repetido**

## recency.repeatPenaltyPerOccurrence
**Diminuir a chance de repetir o mesmo áudio**

## recency.recentWindow
**Quantas jogadas recentes o sistema deve observar**

## intensity.highIntensityPeriodEndBonus
**Preferir som forte no fim do período**

## intensity.lowIntensityPeriodEndPenalty
**Evitar som fraco no fim do período**

## intensity.highIntensityClutchBonus
**Preferir som forte em momento decisivo**

## intensity.mediumIntensityDefaultBonus
**Preferir som equilibrado nas situações normais**

---

# Exemplos de mensagens explicativas do resultado

## Em vez de texto técnico
Evitar:
- `context: +12`
- `recency: +5`
- `intensity: +5`
- `total score: 22`

## Usar assim
- **Cesta de 3 pontos** aumentou a chance desse áudio
- **Jogo apertado** favoreceu essa escolha
- **Momento decisivo** valorizou sons mais fortes
- **Esse áudio não tocou recentemente**
- **Perfil forte para essa situação**

## Versão com número, se quiser manter transparência
- Cesta de 3 pontos: **+2**
- Jogo apertado: **+2**
- Momento decisivo: **+10**
- Sem repetição recente: **+5**
- Som forte para essa situação: **+5**

### Regra recomendada
Sempre mostrar primeiro a frase clara. O número pode aparecer em segundo plano.

---

# Estrutura recomendada de camadas de informação

## Camada 1 — simples
Voltada ao operador comum.

Mostrar:
- título claro
- motivo da escolha
- áudio escolhido
- controles com frases completas
- resultado em linguagem natural

## Camada 2 — detalhada
Voltada a usuários avançados.

Mostrar opcionalmente:
- score numérico
- nome interno da regra
- breakdown por bloco
- tags do asset
- intensidade numérica

### Regra
A camada técnica nunca deve ser a primeira informação exibida.

---

# Microcopy recomendada para feedbacks

## Ao salvar ajustes da política
**Ajustes salvos com sucesso**

## Ao salvar critérios de escolha
**Critérios de escolha atualizados**

## Ao resetar
**Os ajustes voltaram para o padrão**

## Ao não haver som configurado
**Nenhum som foi definido para essa situação**

## Ao não haver candidato elegível
**Nenhum áudio disponível combina com essa situação agora**

## Ao bloquear uma categoria
**Esse tipo de som não será usado nesta tela**

## Ao permitir uma categoria
**Esse tipo de som pode ser usado nesta tela**

---

# Termos que devem ser evitados na interface final

## Evitar sempre que possível
- policy
- scoring
- ranking
- breakdown
- recency
- intensity
- cooldown
- override
- trigger
- asset
- engine
- default behavior
- source
- mapping
- tiles
- category policy
- smart soundtrack
- clutch

## Exceção
Esses termos podem aparecer em modo avançado, logs técnicos, testes ou código — mas não como linguagem principal da operação.

---

# Regra de consistência com o repositório atual

## Não criar nomes que contradigam o sistema atual
Este dicionário foi alinhado ao que já existe hoje:
- `match-screen` = Mesa de Jogo
- `soundboard-screen` = Mesa de Som
- `audio-policy-screen` já existe e controla comportamento por tela
- `scoreCategories` já mapeia 1, 2 e 3 pontos
- `eventCategories` já mapeia eventos como timeout, foul e period_end
- a camada de escolha inteligente já existe no `AudioDecisionEngine`

### Portanto
A recomendação é:
- manter ids, estruturas e nomes internos atuais
- trocar apenas os textos exibidos ao operador
- introduzir os novos textos na futura tela de score sem mudar o contrato técnico do sistema

---

# Requisito final para UX/UI

Toda tela ligada a áudio deve conseguir responder, de forma simples, estas 4 perguntas:

1. **O que esta tela controla?**
2. **O que acontece se eu ligar ou desligar isso?**
3. **Por que esse áudio foi escolhido?**
4. **Como eu ajusto o comportamento sem precisar entender o código?**

Se a interface não responder essas quatro perguntas com clareza, ela ainda está técnica demais.
