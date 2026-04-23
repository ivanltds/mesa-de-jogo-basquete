# PRD - FIBA Digital Scoreboard (Mesa de Jogo)

## 1. Visão Geral
O **FIBA Digital Scoreboard** é uma aplicação web "standalone" (sem necessidade de backend) projetada para automatizar e digitalizar a operação de mesa em jogos de basquete seguindo o padrão oficial da FIBA. O foco é substituir a súmula de papel por uma interface ágil, intuitiva e à prova de erros.

## 2. Objetivos do Produto
- **Agilidade Operacional**: Permitir que um único operador registre todos os eventos (pontos, faltas, tempos, subs) em tempo real.
- **Conformidade Normativa**: Aplicar automaticamente as regras FIBA 2024 (limite de faltas, timeouts, resets de shot clock).
- **Transparência**: Gerar um log detalhado e um relatório final (súmula digital) exportável.
- **Portabilidade**: Funcionar em qualquer navegador moderno (notebook/tablet) sem instalação.

## 3. Público-Alvo
- Operadores de mesa de federações e ligas amadoras/profissionais.
- Árbitros e coordenadores de torneios.
- Entusiastas de estatísticas de basquete.

## 4. Requisitos Funcionais

### 4.1. Módulo de Configuração (Pre-Game)
- **RF01**: Cadastro de dados da partida (Local, Data, Árbitros, Competição).
- **RF02**: Cadastro de Equipes (Nome, Sigla, Cores).
- **RF03**: Cadastro de Jogadores (Até 12 por time, números 0, 00, 1-99).
- **RF04**: Seleção obrigatória dos 5 titulares iniciais.
- **RF05**: Validação de duplicidade de números de camisa.

### 4.2. Controle de Cronômetros
- **RF06**: Cronômetro principal (10:00 descendente) com ajuste manual.
- **RF07**: Shot Clock (24s) com botões de reset rápido (24s e 14s).
- **RF08**: Parada automática do tempo em eventos de falta/timeout (configurável).

### 4.3. Registro de Eventos (In-Game)
- **RF09**: Pontuação (+1, +2, +3) vinculada ao jogador e time.
- **RF10**: Faltas (Pessoais, Técnicas, Antidesportivas, Desqualificantes).
- **RF11**: Pedidos de Tempo (Timeouts) com controle de limites FIBA (2 na 1ª metade, 3 na 2ª, max 2 nos últimos 2 min).
- **RF12**: Substituições (Troca rápida entre jogadores ativos e banco).
- **RF13**: Seta de Posse Alternada (Gestão automática e manual).

### 4.4. Inteligência de Regras (Thiago FIBA Rules)
- **RF14**: Alerta visual ao atingir a 5ª falta individual (exclusão).
- **RF15**: Sinalização de bônus de equipe (após 4 faltas coletivas no quarto).
- **RF16**: Gestão de Overtime (5 minutos extras em caso de empate).

### 4.5. Log e Relatórios
- **RF17**: Feed de eventos em tempo real com timestamp e descrição.
- **RF18**: Função "Undo" (Desfazer) para a última ação.
- **RF19**: Geração de Relatório Final em formato visual de súmula.
- **RF20**: Exportação para PDF e JSON.

## 5. Requisitos Não Funcionais
- **RNF01**: **Interface Dark Mode**: Alto contraste para ambientes de quadra.
- **RNF02**: **Performance**: Latência zero no registro de eventos.
- **RNF03**: **Responsividade**: Otimizado para telas 10" ou superiores (Tablet/Notebook).
- **RNF04**: **Offline First**: Funcionamento sem conexão à internet após o carregamento inicial.
- **RNF05**: **Clean Code**: Seguindo os padrões de Ivan Developer para manutenção facilitada.

## 6. Modelo de Dados (Schema Simplificado)
```json
{
  "matchInfo": { "id": "uuid", "competition": "string", "date": "iso-date" },
  "teams": {
    "home": { "name": "string", "players": [], "score": 0, "fouls": 0, "timeouts": [] },
    "away": { "name": "string", "players": [], "score": 0, "fouls": 0, "timeouts": [] }
  },
  "currentPeriod": 1,
  "gameClock": 600000,
  "shotClock": 24000,
  "possessionArrow": "home",
  "events": []
}
```

## 7. Fluxo do Usuário
1. **Setup**: Operador insere dados e escala times.
2. **Jump Ball**: Início do Q1 e ativação da interface de mesa.
3. **Live**: Registro frenético de ações; o app valida regras em tempo real.
4. **Halftime/Intervals**: Pausa automática, resumo estatístico.
5. **Final**: Encerramento, conferência de dados e exportação da súmula.

---
*Este PRD serve como guia mestre para o desenvolvimento. Qualquer desvio deve ser validado com os agentes Ivan e Thiago.*
