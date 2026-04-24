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

const SoundManager = {
    queue: [],
    library: {
        cesta: ["cesta (10).mp3", "cesta (2).mp3", "cesta (3).mp3", "cesta (4).mp3", "cesta (5).mp3", "cesta (6).mp3", "cesta (7).mp3", "cesta (8).mp3", "cesta (9).mp3", "cesta- (2).mp3", "cesta- (3).mp3", "cesta-.mp3", "cesta-1.mp3", "cesta-10.mp3", "cesta-11.mp3", "cesta-12.mp3", "cesta-13.mp3", "cesta-14.mp3", "cesta-15.mp3", "cesta-3.mp3", "cesta-4.mp3", "cesta-5.mp3", "cesta-6.mp3", "cesta-7.mp3", "cesta-8.mp3", "cesta-9.mp3", "cesta.mp3"],
        errou: ["errou (2).mp3", "errou (3).mp3", "errou (4).mp3", "errou-.mp3", "errou-1.mp3", "errou-2.mp3", "errou-3.mp3", "errou-4.mp3", "errou-5.mp3", "errou-6.mp3", "errou-7.mp3", "errou-8.mp3", "errou-9.mp3", "errou.mp3", "errou].mp3"],
        divertido: ["divertido (10).mp3", "divertido (11).mp3", "divertido (2).mp3", "divertido (3).mp3", "divertido (4).mp3", "divertido (5).mp3", "divertido (6).mp3", "divertido (7).mp3", "divertido (8).mp3", "divertido (9).mp3", "divertido.mp3", "esquisito-.mp3", "esquisito-1.mp3", "esquisito-2.mp3", "esquisito-3.mp3", "esquisito-4.mp3", "esquisito.mp3"],
        toco: ["toco (2).mp3", "toco (3).mp3", "toco (4).mp3", "toco (5).mp3", "toco (6).mp3", "toco (7).mp3", "toco-.mp3", "toco-1.mp3", "toco.mp3"],
        posse: ["posse-1.mp3", "posse-2.mp3", "posse-3.mp3", "posse-4.mp3", "posse-5.mp3", "posse-6.mp3", "posse-7.mp3", "posse-8.mp3", "posse.mp3"],
        nba: ["nba (2).mp3", "nba (3).mp3", "nba (4).mp3", "nba(1).mp3", "nba.mp3"],
        torcida: ["torcida (2).mp3", "torcida (3).mp3", "torcida.mp3"],
        buzina: ["Buzina.mp3"],
        musica: ["musica- Bow Basketball.mp3", "musica- Can't Hold Us.mp3", "musica- I Believe I Can Fly.mp3", "musica- O JOGO É SÉRIO.mp3", "musica-Hino Nacional Brasileiro.mp3"]
    },
    
    play(category) {
        const files = this.library[category];
        if (files) {
            const file = files[Math.floor(Math.random() * files.length)];
            this.addToQueue(category, file);
        }
    },

    playFile(filename) {
        for (const cat in this.library) {
            if (this.library[cat].includes(filename)) {
                this.addToQueue(cat, filename);
                break;
            }
        }
    },

    addToQueue(category, file) {
        const id = Date.now() + Math.random();
        this.queue.push({ id, category, file });
        UIManager.renderSoundQueue();
        if (this.queue.length === 1) this.processQueue();
    },

    async processQueue() {
        if (this.queue.length === 0) return;
        const item = this.queue[0];
        const audio = new Audio(`audios/${item.file}`);
        audio.onended = () => {
            this.queue.shift();
            UIManager.renderSoundQueue();
            this.processQueue();
        };
        await audio.play().catch(e => console.log("Erro audio:", e));
    },

    skip() {
        if (this.queue.length > 0) {
            notify("Áudio pulado");
            this.queue.shift();
            UIManager.renderSoundQueue();
            this.processQueue();
        }
    },

    removeFromQueue(id) {
        this.queue = this.queue.filter(item => item.id !== id);
        UIManager.renderSoundQueue();
    }
};

const GameEngine = {
    addPlayer(teamKey, name, number) {
        if (!name || !number) return notify("Preencha nome e número!");
        const team = gameState.teams[teamKey];
        if (team.players.find(p => p.number === number)) return notify("Número já existe!");
        team.players.push({ name, number, points: 0, fouls: 0, inCourt: false });
        UIManager.renderPlayerList(teamKey);
        document.getElementById(`${teamKey}-p-num`).value = '';
        document.getElementById(`${teamKey}-p-name`).value = '';
        document.getElementById(`${teamKey}-p-num`).focus();
    },

    logEvent(message, type = 'info', teamKey = null, playerNum = null, value = 0, pInNum = null, pOutNum = null) {
        let icon = "📝";
        if (message.includes("pts")) icon = "🏀";
        if (message.includes("Falta")) icon = "⚠️";
        if (message.includes("SUB")) icon = "🔄";
        
        const event = {
            id: Date.now(),
            message,
            type,
            icon,
            teamKey,
            playerNum,
            value,
            pInNum,
            pOutNum,
            reverted: false,
            timestamp: new Date().toLocaleTimeString()
        };
        gameState.events.push(event);
        UIManager.updateLog();
    },

    endGame() {
        const homeScore = gameState.teams.home.score;
        const awayScore = gameState.teams.away.score;
        const winnerKey = homeScore > awayScore ? 'home' : 'away';
        const winner = gameState.teams[winnerKey];
        
        this.logEvent(`FIM DE JOGO! Vitória de ${winner.name}`, 'info');
        SoundManager.play('buzina');
        
        UIManager.showVictoryModal(winnerKey);
    }
};

const ClockEngine = {
    timer: null,
    start() {
        if (gameState.isActive) return;
        gameState.isActive = true;
        this.timer = setInterval(() => {
            if (gameState.clock > 0) {
                gameState.clock -= 100;
                gameState.shotClock -= 100;
                if (gameState.shotClock <= 0) {
                    this.stop();
                    SoundManager.play('buzina');
                    notify("ESTOURO DE 24s!", "error");
                }
                UIManager.updateClocks();
            } else {
                this.stop();
                SoundManager.play('buzina');
                notify("FIM DE PERÍODO!");
            }
        }, 100);
    },
    stop() {
        gameState.isActive = false;
        clearInterval(this.timer);
        UIManager.updateClocks();
    },
    toggle() {
        gameState.isActive ? ClockEngine.stop() : ClockEngine.start();
    },
    resetShotClock(time = 24000) {
        gameState.shotClock = time;
        UIManager.updateClocks();
    },
    setTestTime() {
        gameState.clock = 10000;
        UIManager.updateClocks();
        notify("MODO TESTE: Tempo definido para 10s");
    }
};

window.nextPeriod = () => {
    // 1. Valida se o relógio zerou
    if (gameState.clock > 0) {
        notify("O relógio precisa estar em 00:00 para avançar de período!", "error");
        return;
    }

    // Para a bola antes de avançar o período
    ClockEngine.stop();

    // 2. Fim de jogo? (4º período em diante, desde que não haja empate)
    const homeScore = gameState.teams.home.score;
    const awayScore = gameState.teams.away.score;
    
    if (gameState.period >= 4 || String(gameState.period).startsWith('OT')) {
        if (homeScore !== awayScore) {
            GameEngine.endGame();
            return;
        }
    }

    if (gameState.period < 4) {
        gameState.period++;
        gameState.clock = 600000; // 10 minutos
        gameState.shotClock = 24000;
        
        // Faltas coletivas zeram em quartos normais
        gameState.teams.home.fouls = 0;
        gameState.teams.away.fouls = 0;
        
        notify(`Início do Período ${gameState.period}! Faltas coletivas zeradas. Relógios reiniciados.`, 'info');
    } else {
        // Se já chegou no 4º quarto, vai para o OT
        if (gameState.period === 'OT') {
            gameState.period = 'OT2';
        } else {
            gameState.period = 'OT';
        }
        
        gameState.clock = 300000; // 5 minutos para Overtime
        gameState.shotClock = 24000;
        
        // FIBA Rule: Faltas de equipe NÃO são zeradas para o Overtime
        notify(`Início do ${gameState.period}! Faltas coletivas MANTIDAS. Relógio em 5:00.`, 'info');
    }
    
    GameEngine.logEvent(`Avançou para o ${gameState.period}`, 'info');
    UIManager.updateScoreboard();
};

window.showReport = () => {
    document.getElementById('victory-modal').classList.remove('active');
    UIManager.switchScreen('report-screen');
};

const UIManager = {
    switchScreen(screenId) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById(screenId).classList.add('active');
        if (screenId === 'match-screen') this.initMatchUI();
    },

    showVictoryModal(winnerKey) {
        const modal = document.getElementById('victory-modal');
        const winner = gameState.teams[winnerKey];
        const card = document.getElementById('victory-card');
        
        document.getElementById('victory-winner-name').innerText = `${winner.name} VENCEU!`;
        document.getElementById('victory-home-score').innerText = gameState.teams.home.score;
        document.getElementById('victory-away-score').innerText = gameState.teams.away.score;
        document.getElementById('v-home-name').innerText = gameState.teams.home.name;
        document.getElementById('v-away-name').innerText = gameState.teams.away.name;
        
        // Aplica o glow da cor do time ganhador
        card.style.boxShadow = `0 0 100px rgba(0, 0, 0, 0.9), inset 0 0 50px ${winner.color}44`;
        document.getElementById('victory-winner-name').style.color = winner.color;
        
        modal.classList.add('active');
        
        // Explode os confetes
        if (window.confetti) {
            const colors = [winner.color, '#ffffff', '#ffd700'];
            const duration = 5 * 1000;
            const end = Date.now() + duration;

            (function frame() {
                window.confetti({
                    particleCount: 5,
                    angle: 60,
                    spread: 55,
                    origin: { x: 0 },
                    colors: colors
                });
                window.confetti({
                    particleCount: 5,
                    angle: 120,
                    spread: 55,
                    origin: { x: 1 },
                    colors: colors
                });

                if (Date.now() < end) {
                    requestAnimationFrame(frame);
                }
            }());
        }
    },

    initMatchUI() {
        document.getElementById('display-home-name').innerText = gameState.teams.home.name;
        document.getElementById('display-away-name').innerText = gameState.teams.away.name;
        
        const hPanel = document.querySelector('.team-panel.home');
        const aPanel = document.querySelector('.team-panel.away');
        if (hPanel) hPanel.style.setProperty('--team-color', gameState.teams.home.color);
        if (aPanel) aPanel.style.setProperty('--team-color', gameState.teams.away.color);
        
        UIManager.updateScoreboard();
    },

    updateScoreboard() {
        const hScore = document.getElementById('home-score');
        const aScore = document.getElementById('away-score');
        if (hScore) {
            hScore.innerText = gameState.teams.home.score;
            hScore.style.color = gameState.teams.home.color;
        }
        if (aScore) {
            aScore.innerText = gameState.teams.away.score;
            aScore.style.color = gameState.teams.away.color;
        }

        const hFouls = document.getElementById('fouls-home');
        const aFouls = document.getElementById('fouls-away');
        if (hFouls) hFouls.innerText = gameState.teams.home.fouls;
        if (aFouls) aFouls.innerText = gameState.teams.away.fouls;
        
        const homeBonus = document.getElementById('home-bonus');
        const awayBonus = document.getElementById('away-bonus');
        if (homeBonus) {
            homeBonus.classList.toggle('active', gameState.teams.home.fouls >= 4);
            homeBonus.style.background = gameState.teams.home.fouls >= 4 ? gameState.teams.home.color : 'transparent';
        }
        if (awayBonus) {
            awayBonus.classList.toggle('active', gameState.teams.away.fouls >= 4);
            awayBonus.style.background = gameState.teams.away.fouls >= 4 ? gameState.teams.away.color : 'transparent';
        }

        ['home', 'away'].forEach(t => {
            const container = document.getElementById(`${t}-timeouts`);
            if (container) {
                const dots = container.querySelectorAll('.dot');
                dots.forEach((dot, i) => {
                    dot.classList.toggle('active', i < gameState.teams[t].timeouts);
                });
            }
        });

        UIManager.renderActivePlayers('home');
        UIManager.renderActivePlayers('away');
        const periodDisplay = document.getElementById('display-period');
        if (periodDisplay) periodDisplay.textContent = gameState.period;
        UIManager.updateLog();
        UIManager.updateClocks();
    },

    renderSoundQueue() {
        const html = SoundManager.queue.map(item => `
            <div class="queue-item dj-queue-item">
                <span>${item.category}</span>
                <span class="q-remove" onclick="SoundManager.removeFromQueue(${item.id})">✖</span>
            </div>
        `).join('');
        const matchQ = document.getElementById('audio-queue');
        const djQ = document.getElementById('dj-audio-queue');
        if (matchQ) matchQ.innerHTML = html || 'Fila vazia';
        if (djQ) djQ.innerHTML = html || 'Fila vazia';
    },

    renderSoundboard() {
        const container = document.getElementById('dj-pads-grid');
        if (!container) return;
        let html = '';
        for (const cat in SoundManager.library) {
            const files = SoundManager.library[cat];
            if (!Array.isArray(files)) continue;
            html += `
                <div class="dj-cat-block">
                    <h2>${cat.toUpperCase()}</h2>
                    <div class="dj-pads-grid">
                        ${files.map(f => {
                            const escapedFile = f.replace(/'/g, "\\'");
                            return `<button class="dj-pad ${cat}" onclick="SoundManager.playFile('${escapedFile}')" title="${f}"></button>`;
                        }).join('')}
                    </div>
                </div>
            `;
        }
        container.innerHTML = html;
    },

    updateClocks() {
        const gc = document.getElementById('game-clock');
        const sc = document.getElementById('shot-clock');
        if (!gc || !sc) return;

        const mins = Math.floor(gameState.clock / 60000);
        const secs = Math.floor((gameState.clock % 60000) / 1000);
        gc.innerText = `${mins}:${secs.toString().padStart(2, '0')}`;
        sc.innerText = Math.ceil(gameState.shotClock / 1000);
        
        const toggleBtn = document.getElementById('toggle-clock-btn');
        if (toggleBtn) toggleBtn.innerText = gameState.isActive ? "PAUSE" : "START";
    },

    renderActivePlayers(teamKey) {
        const container = document.getElementById(`${teamKey}-active-players`);
        if (!container) return;
        const team = gameState.teams[teamKey];
        const active = team.players.filter(p => p.inCourt);
        
        container.innerHTML = active.map(p => {
            const isExcluded = p.fouls >= 5;
            return `
                <div class="player-match-card ${isExcluded ? 'excluded' : ''}" style="border-color: ${isExcluded ? '#ff0000' : 'var(--team-color)'}">
                    <div class="p-info">
                        <span class="p-num" style="color: ${isExcluded ? '#ff0000' : 'var(--team-color)'}">#${p.number}</span>
                        <span class="p-name">${p.name}</span>
                        <span class="p-fouls" style="color: ${isExcluded ? '#ff0000' : 'inherit'}">${p.fouls}F ${isExcluded ? '🚫' : ''}</span>
                    </div>
                    <div class="player-actions">
                        <button class="btn btn-xs btn-team" ${isExcluded ? 'disabled' : ''} onclick="window.addPoints('${teamKey}', '${p.number}', 1)">+1</button>
                        <button class="btn btn-xs btn-team" ${isExcluded ? 'disabled' : ''} onclick="window.addPoints('${teamKey}', '${p.number}', 2)">+2</button>
                        <button class="btn btn-xs btn-team" ${isExcluded ? 'disabled' : ''} onclick="window.addPoints('${teamKey}', '${p.number}', 3)">+3</button>
                        <button class="btn btn-xs btn-team btn-warning" ${isExcluded ? 'disabled' : ''} onclick="window.addFoul('${teamKey}', '${p.number}')">FOUL</button>
                        <button class="btn btn-xs btn-team btn-danger" onclick="window.openSubModal('${teamKey}', '${p.number}')">SUB</button>
                    </div>
                </div>
            `;
        }).join('');
    },

    renderPlayerList(teamKey) {
        const list = document.getElementById(`${teamKey}-players-list`);
        if (!list) return;
        list.innerHTML = gameState.teams[teamKey].players.map((p, i) => `
            <div class="player-row">
                <div class="p-info">
                    <span class="p-num-badge">${p.number}</span>
                    <span class="p-name">${p.name}</span>
                </div>
                <button class="btn btn-danger btn-xs" onclick="window.removePlayer('${teamKey}', ${i})">✖</button>
            </div>
        `).join('');
    },

    updateLog() {
        const log = document.getElementById('event-log');
        if (!log) return;
        log.innerHTML = gameState.events.slice(-15).map(e => `
            <div class="log-entry ${e.reverted ? 'reverted' : ''}">
                <div class="log-entry-content">
                    <span class="log-icon">${e.icon}</span>
                    <span class="log-text" style="${e.reverted ? 'text-decoration: line-through; opacity: 0.5;' : ''}">${e.message}</span>
                </div>
                <button class="btn btn-xs ${e.reverted ? 'btn-success' : ''}" onclick="window.revertEvent(${e.id})" title="${e.reverted ? 'Restaurar' : 'Reverter'}">
                    ${e.reverted ? '✅' : '🚫'}
                </button>
            </div>
        `).reverse().join('');
    },

    renderSubLists() {
        const team = gameState.teams[subState.teamKey];
        const inCourtList = document.getElementById('players-in-court');
        const onBenchList = document.getElementById('players-on-bench');
        if (!inCourtList || !onBenchList) return;
        
        inCourtList.innerHTML = team.players.filter(p => p.inCourt).map(p => `
            <div class="sub-item ${subState.outPlayerNum === p.number ? 'selected' : ''}" onclick="window.selectSubPlayer('out', '${p.number}')">
                #${p.number} ${p.name}
            </div>
        `).join('');

        onBenchList.innerHTML = team.players.filter(p => !p.inCourt).map(p => {
            const isExcluded = p.fouls >= 5;
            return `
                <div class="sub-item ${subState.inPlayerNum === p.number ? 'selected' : ''} ${isExcluded ? 'excluded' : ''}" 
                     onclick="${isExcluded ? '' : `window.selectSubPlayer('in', '${p.number}')`}">
                    <span class="sub-num">#${p.number}</span>
                    <span class="sub-name">${p.name}</span>
                    <span class="sub-fouls">${p.fouls}F ${isExcluded ? '🚫' : ''}</span>
                </div>
            `;
        }).join('');
    }
};

let subState = { teamKey: null, outPlayerNum: null, inPlayerNum: null };

window.openSubModal = (teamKey, outPlayerNum = null) => {
    if (gameState.isActive) return notify("Substituição apenas com bola morta!", "error");
    subState = { teamKey, outPlayerNum, inPlayerNum: null };
    document.getElementById('sub-modal').classList.add('active');
    UIManager.renderSubLists();
};

window.selectSubPlayer = (type, num) => {
    if (type === 'out') subState.outPlayerNum = num; else subState.inPlayerNum = num;
    if (subState.outPlayerNum && subState.inPlayerNum) {
        const team = gameState.teams[subState.teamKey];
        const pOut = team.players.find(p => p.number === subState.outPlayerNum);
        const pIn = team.players.find(p => p.number === subState.inPlayerNum);
        
        if (pIn.fouls >= 5) return notify("Jogador com 5 faltas não pode entrar!", "error");
        
        pOut.inCourt = false; 
        pIn.inCourt = true;
        GameEngine.logEvent(`SUB: #${pIn.number} entra, #${pOut.number} sai`, 'sub', subState.teamKey, null, 0, pIn.number, pOut.number);
        document.getElementById('sub-modal').classList.remove('active');
        UIManager.updateScoreboard();
    } else UIManager.renderSubLists();
};

window.addPoints = (team, num, pts) => {
    const p = gameState.teams[team].players.find(x => x.number == num);
    if (p) {
        p.points += pts;
        gameState.teams[team].score += pts;
        GameEngine.logEvent(`${pts} pts para #${num}`, 'points', team, num, pts);
        SoundManager.play('cesta');
        UIManager.updateScoreboard();
    }
};

window.addFoul = (team, num) => {
    const p = gameState.teams[team].players.find(x => x.number == num);
    if (p) {
        if (p.fouls >= 5) return notify(`JOGADOR #${num} JÁ ESTÁ EXCLUÍDO!`);
        p.fouls++;
        gameState.teams[team].fouls++;
        GameEngine.logEvent(`Falta #${num}`, 'foul', team, num);
        if (p.fouls >= 5) {
            notify(`JOGADOR #${num} EXCLUÍDO (5 FALTAS)!`, 'error');
            SoundManager.play('buzina');
        }
        UIManager.updateScoreboard();
    }
};

window.addTimeout = (team) => {
    if (gameState.teams[team].timeouts >= 5) return notify("Limite de tempos atingido!");
    gameState.teams[team].timeouts++;
    GameEngine.logEvent(`TIMEOUT ${gameState.teams[team].name}`, 'timeout', team);
    SoundManager.play('buzina');
    UIManager.updateScoreboard();
};

window.revertEvent = (id) => {
    const e = gameState.events.find(x => x.id === id);
    if (!e) return;
    
    const isReverting = !e.reverted;
    const modifier = isReverting ? -1 : 1;

    if (e.type === 'points') {
        gameState.teams[e.teamKey].score += (e.value * modifier);
        const p = gameState.teams[e.teamKey].players.find(x => x.number == e.playerNum);
        if (p) p.points += (e.value * modifier);
    } else if (e.type === 'foul') {
        gameState.teams[e.teamKey].fouls += modifier;
        const p = gameState.teams[e.teamKey].players.find(x => x.number == e.playerNum);
        if (p) p.fouls += modifier;
    } else if (e.type === 'timeout') {
        gameState.teams[e.teamKey].timeouts += modifier;
    } else if (e.type === 'sub') {
        const team = gameState.teams[e.teamKey];
        const pIn = team.players.find(p => p.number === e.pInNum);
        const pOut = team.players.find(p => p.number === e.pOutNum);
        if (pIn && pOut) {
            pIn.inCourt = !isReverting;
            pOut.inCourt = isReverting;
        }
    }
    
    e.reverted = isReverting;
    notify(isReverting ? 'Evento revertido!' : 'Evento restaurado!');
    UIManager.updateScoreboard();
};

window.removePlayer = (team, i) => {
    gameState.teams[team].players.splice(i, 1);
    UIManager.renderPlayerList(team);
};

window.notify = (msg, type = 'info') => {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerText = msg;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
};

window.openSoundboard = () => {
    UIManager.switchScreen('soundboard-screen');
};

document.addEventListener('DOMContentLoaded', () => {
    const sbHero = document.querySelector('.btn-soundboard-hero');
    if (sbHero) sbHero.onclick = window.openSoundboard;

    const startBtn = document.getElementById('start-match-btn');
    if (startBtn) {
        startBtn.onclick = () => {
            const hName = document.getElementById('home-name');
            const aName = document.getElementById('away-name');
            const hColor = document.getElementById('home-color');
            const aColor = document.getElementById('away-color');

            gameState.teams.home.name = (hName ? hName.value : '') || 'CASA';
            gameState.teams.away.name = (aName ? aName.value : '') || 'VISITANTE';
            gameState.teams.home.color = hColor ? hColor.value : '#ff0000';
            gameState.teams.away.color = aColor ? aColor.value : '#0000ff';
            
            if (gameState.teams.home.players.length < 5 || gameState.teams.away.players.length < 5) return notify("Mínimo de 5 jogadores!");
            gameState.teams.home.players.slice(0, 5).forEach(p => p.inCourt = true);
            gameState.teams.away.players.slice(0, 5).forEach(p => p.inCourt = true);
            UIManager.switchScreen('match-screen');
        };
    }

    const addHomeBtn = document.getElementById('btn-add-home-p');
    if (addHomeBtn) {
        addHomeBtn.onclick = () => {
            const name = document.getElementById('home-p-name');
            const num = document.getElementById('home-p-num');
            GameEngine.addPlayer('home', name ? name.value : '', num ? num.value : '');
        };
    }

    const addAwayBtn = document.getElementById('btn-add-away-p');
    if (addAwayBtn) {
        addAwayBtn.onclick = () => {
            const name = document.getElementById('away-p-name');
            const num = document.getElementById('away-p-num');
            GameEngine.addPlayer('away', name ? name.value : '', num ? num.value : '');
        };
    }
    
    const mockBtn = document.getElementById('mock-data-btn');
    if (mockBtn) {
        mockBtn.onclick = () => {
            gameState.teams.home.name = "FLAMENGO";
            gameState.teams.home.color = "#ff0000";
            gameState.teams.home.players = [
                { number: '4', name: 'Yago Mateus', fouls: 0, points: 0, inCourt: false },
                { number: '9', name: 'Marcelinho Huertas', fouls: 0, points: 0, inCourt: false },
                { number: '11', name: 'Marquinhos Sousa', fouls: 0, points: 0, inCourt: false },
                { number: '17', name: 'Anderson Varejão', fouls: 0, points: 0, inCourt: false },
                { number: '25', name: 'Olivinha Rodriguez', fouls: 0, points: 0, inCourt: false },
                { number: '10', name: 'Gabriel Jaú', fouls: 0, points: 0, inCourt: false },
                { number: '32', name: 'Rafael Mineiro', fouls: 0, points: 0, inCourt: false },
                { number: '6', name: 'Franco Balbi', fouls: 0, points: 0, inCourt: false },
                { number: '8', name: 'Vitor Benite', fouls: 0, points: 0, inCourt: false },
                { number: '14', name: 'Rafael Hettsheimeir', fouls: 0, points: 0, inCourt: false },
                { number: '20', name: 'Dar Tucker', fouls: 0, points: 0, inCourt: false },
                { number: '44', name: 'Martín Cuello', fouls: 0, points: 0, inCourt: false }
            ];
            gameState.teams.away.name = "FRANCA";
            gameState.teams.away.color = "#2196f3";
            gameState.teams.away.players = [
                { number: '7', name: 'Jhonatan Luz', fouls: 0, points: 0, inCourt: false },
                { number: '14', name: 'Lucas Dias', fouls: 0, points: 0, inCourt: false },
                { number: '28', name: 'Lucas Mariano', fouls: 0, points: 0, inCourt: false },
                { number: '32', name: 'David Jackson', fouls: 0, points: 0, inCourt: false },
                { number: '9', name: 'Santiago Scala', fouls: 0, points: 0, inCourt: false },
                { number: '3', name: 'Marcio Santos', fouls: 0, points: 0, inCourt: false },
                { number: '5', name: 'Elinho Corazza', fouls: 0, points: 0, inCourt: false },
                { number: '11', name: 'Edu Elevi', fouls: 0, points: 0, inCourt: false },
                { number: '15', name: 'Guilherme Cipolini', fouls: 0, points: 0, inCourt: false },
                { number: '21', name: 'Reynan Camilo', fouls: 0, points: 0, inCourt: false },
                { number: '25', name: 'Georginho de Paula', fouls: 0, points: 0, inCourt: false },
                { number: '33', name: 'Heissler Guillent', fouls: 0, points: 0, inCourt: false }
            ];
            UIManager.renderPlayerList('home');
            UIManager.renderPlayerList('away');
            
            const hName = document.getElementById('home-name');
            const aName = document.getElementById('away-name');
            const hColor = document.getElementById('home-color');
            const aColor = document.getElementById('away-color');

            if (hName) hName.value = "FLAMENGO";
            if (aName) aName.value = "FRANCA";
            if (hColor) hColor.value = "#ff0000";
            if (aColor) aColor.value = "#2196f3";
            notify("Times de Elite carregados!");
        };
    }

    if(document.getElementById('toggle-clock-btn')) document.getElementById('toggle-clock-btn').onclick = ClockEngine.toggle;
    if(document.getElementById('reset-24-btn')) document.getElementById('reset-24-btn').onclick = () => ClockEngine.resetShotClock(24000);
    if(document.getElementById('reset-14-btn')) document.getElementById('reset-14-btn').onclick = () => ClockEngine.resetShotClock(14000);
    if(document.getElementById('next-period-btn')) document.getElementById('next-period-btn').onclick = () => window.nextPeriod();
    if(document.getElementById('fast-forward-btn')) document.getElementById('fast-forward-btn').onclick = () => ClockEngine.setTestTime();
    
    if (document.getElementById('mystery-btn')) document.getElementById('mystery-btn').onclick = () => SoundManager.play('posse');
    if (document.getElementById('fun-btn')) document.getElementById('fun-btn').onclick = () => SoundManager.play('divertido');
    
    if (document.getElementById('nba-btn')) document.getElementById('nba-btn').onclick = () => SoundManager.play('nba');
    if (document.getElementById('torcida-btn')) document.getElementById('torcida-btn').onclick = () => SoundManager.play('torcida');
    if (document.getElementById('musica-btn')) document.getElementById('musica-btn').onclick = () => SoundManager.play('musica');
    if (document.getElementById('skip-audio-btn')) document.getElementById('skip-audio-btn').onclick = () => SoundManager.skip();
    if (document.getElementById('close-sub-modal')) document.getElementById('close-sub-modal').onclick = () => document.getElementById('sub-modal').classList.remove('active');
});

window.SoundManager = SoundManager;
setTimeout(() => UIManager.renderSoundboard(), 500);

// EXPORTS PARA TESTES
if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test' && typeof module !== 'undefined') {
    module.exports = { gameState, GameEngine, ClockEngine, UIManager, SoundManager };
}

// VINCULAÇÃO GLOBAL PARA TESTES E ACESSO EXTERNO
window.gameState = gameState;
window.GameEngine = GameEngine;
window.UIManager = UIManager;
window.ClockEngine = ClockEngine;
window.SoundManager = SoundManager;
