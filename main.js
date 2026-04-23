// ==========================================
// GLOBALS & NAVIGATION
// ==========================================
window.openSoundboard = () => {
    console.log("🎚️ Abrindo Mesa de Som...");
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('soundboard-screen').classList.add('active');
};

window.closeSoundboard = () => {
    console.log("🔙 Voltando para o Setup...");
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('setup-screen').classList.add('active');
};

// ==========================================
// CONSTANTS & STATE
// ==========================================
const FIBA_CONSTANTS = {
    PERIOD_DURATION: 600000, // 10 min
    SHOT_CLOCK_FULL: 24000,
    SHOT_CLOCK_RESET: 14000,
    MAX_PLAYERS: 12,
    FOULS_LIMIT: 5
};

const getInitialState = () => ({
    matchInfo: { competition: 'NBB 2024' },
    teams: {
        home: { name: 'CASA', color: '#ff6b00', players: [], score: 0, fouls: 0, timeoutsUsed: 0 },
        away: { name: 'VISITANTE', color: '#2196f3', players: [], score: 0, fouls: 0, timeoutsUsed: 0 }
    },
    period: 1,
    clock: FIBA_CONSTANTS.PERIOD_DURATION,
    shotClock: FIBA_CONSTANTS.SHOT_CLOCK_FULL,
    isActive: false,
    events: []
});

let gameState = getInitialState();

// ==========================================
// NOTIFICATION SYSTEM (TOAST)
// ==========================================
const notify = (message, type = 'error') => {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerText = message;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
};

// ==========================================
// ENGINE & LOGIC
// ==========================================
const GameEngine = {
    addPlayer(teamKey, name, number) {
        const team = gameState.teams[teamKey];
        const isValidNum = /^(0|00|[1-9][0-9]?)$/.test(number);
        if (!name || !number) return notify("Preencha nome e número!");
        if (!isValidNum) return notify("Número inválido! (0, 00, 1-99)");
        if (team.players.length >= FIBA_CONSTANTS.MAX_PLAYERS) return notify("Máximo de 12 jogadores!");
        if (team.players.find(p => p.number === number)) return notify("Número de camisa já existe!");

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
        
        gameState.events.push({ 
            id: Date.now() + Math.random(),
            time: gameState.clock, 
            message, icon, type, teamKey, playerNum, value,
            pInNum, pOutNum, reverted: false 
        });
        UIManager.updateLog();
    }
};

// ==========================================
// SOUND SYSTEM
// ==========================================
const SoundManager = {
    library: {
        posse: ['posse.mp3', 'posse-1.mp3', 'posse-2.mp3', 'posse-3.mp3', 'posse-4.mp3', 'posse-5.mp3', 'posse-6.mp3', 'posse-7.mp3', 'posse-8.mp3'],
        cesta: [
            'cesta.mp3', 'cesta-.mp3', 'cesta-1.mp3', 'cesta-3.mp3', 'cesta-4.mp3', 'cesta-5.mp3', 
            'cesta-6.mp3', 'cesta-7.mp3', 'cesta-8.mp3', 'cesta-9.mp3', 'cesta-10.mp3', 
            'cesta-11.mp3', 'cesta-12.mp3', 'cesta-13.mp3', 'cesta-14.mp3', 'cesta-15.mp3',
            'cesta- (2).mp3', 'cesta- (3).mp3'
        ],
        errou: [
            'errou.mp3', 'errou-.mp3', 'errou-1.mp3', 'errou-2.mp3', 'errou-3.mp3', 'errou-4.mp3', 
            'errou-5.mp3', 'errou-6.mp3', 'errou-7.mp3', 'errou-8.mp3', 'errou-9.mp3', 
            'errou (2).mp3', 'errou (3).mp3', 'errou (4).mp3', 'errou].mp3'
        ],
        esquisito: [
            'esquisito.mp3', 'esquisito-.mp3', 'esquisito-1.mp3', 'esquisito-2.mp3', 
            'esquisito-3.mp3', 'esquisito-4.mp3'
        ],
        divertido: [
            'divertido.mp3', 'divertido (2).mp3', 'divertido (3).mp3', 'divertido (4).mp3', 
            'divertido (5).mp3', 'divertido (6).mp3', 'divertido (7).mp3', 'divertido (8).mp3', 
            'divertido (9).mp3', 'divertido (10).mp3', 'divertido (11).mp3'
        ],
        nba: ['nba.mp3', 'nba(1).mp3', 'nba (2).mp3', 'nba (3).mp3', 'nba (4).mp3'],
        torcida: ['torcida.mp3', 'torcida (2).mp3', 'torcida (3).mp3'],
        musica: [
            'musica- Bow Basketball.mp3', 
            'musica- Can\'t Hold Us.mp3', 
            'musica- I Believe I Can Fly.mp3', 
            'musica- O JOGO É SÉRIO.mp3', 
            'musica-Hino Nacional Brasileiro.mp3'
        ],
        toco: [
            'toco.mp3', 'toco-.mp3', 'toco-1.mp3', 'toco (2).mp3', 'toco (3).mp3', 
            'toco (4).mp3', 'toco (5).mp3', 'toco (6).mp3', 'toco (7).mp3'
        ],
        buzina: 'Buzina.mp3'
    },
    queue: [],
    isPlaying: false,
    currentAudio: null,

    play(category) {
        const list = this.library[category];
        if (!list) return;
        const filename = typeof list === 'string' ? list : list[Math.floor(Math.random() * list.length)];
        this.queue.push({ category, filename, id: Date.now() + Math.random() });
        UIManager.renderSoundQueue();
        this.processQueue();
    },

    playFile(filename) {
        let category = 'Manual';
        for (const cat in this.library) {
            if (Array.isArray(this.library[cat]) && this.library[cat].includes(filename)) { category = cat; break; }
        }
        this.queue.push({ category: category, filename, id: Date.now() + Math.random() });
        UIManager.renderSoundQueue();
        this.processQueue();
    },

    skip() {
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio = null;
            this.isPlaying = false;
            this.processQueue();
        }
    },

    removeFromQueue(id) {
        this.queue = this.queue.filter(item => item.id !== id);
        UIManager.renderSoundQueue();
    },

    processQueue() {
        if (this.isPlaying || this.queue.length === 0) return;
        this.isPlaying = true;
        const { category, filename } = this.queue.shift();
        UIManager.renderSoundQueue();
        this.currentAudio = new Audio(`/audios/${filename}`);
        this.currentAudio.onended = () => { this.currentAudio = null; this.isPlaying = false; this.processQueue(); };
        this.currentAudio.play().catch(() => { this.isPlaying = false; this.processQueue(); });
    }
};

window.revertEvent = (id) => {
    const ev = gameState.events.find(e => e.id === id);
    if (!ev || ev.reverted) return;
    ev.reverted = true;
    const team = gameState.teams[ev.teamKey];
    if (ev.type === 'points') {
        team.score -= ev.value;
        const p = team.players.find(x => x.number == ev.playerNum);
        if (p) p.points -= ev.value;
    } else if (ev.type === 'foul') {
        team.fouls -= 1;
        const p = team.players.find(x => x.number == ev.playerNum);
        if (p) p.fouls -= 1;
    } else if (ev.type === 'sub') {
        const pIn = team.players.find(x => x.number == ev.pInNum);
        const pOut = team.players.find(x => x.number == ev.pOutNum);
        if (pIn) pIn.inCourt = false;
        if (pOut) pOut.inCourt = true;
        UIManager.renderActivePlayers(ev.teamKey);
    }
    UIManager.updateScoreboard();
    UIManager.updateLog();
};

const ClockEngine = {
    toggle() {
        if (!gameState.isActive) {
            if (gameState.clock <= 0) return notify("Período encerrado!");
            gameState.isActive = true;
            gameInterval = setInterval(ClockEngine.tick, 100);
            document.getElementById('toggle-clock-btn').innerText = "PAUSE";
        } else { ClockEngine.pause(); }
    },
    pause() { 
        gameState.isActive = false; 
        clearInterval(gameInterval); 
        document.getElementById('toggle-clock-btn').innerText = "START";
    },
    tick() {
        if (gameState.clock > 0) gameState.clock -= 100; else ClockEngine.pause();
        if (gameState.shotClock > 0) gameState.shotClock -= 100; else ClockEngine.pause();
        UIManager.updateClocks();
    }
};

let gameInterval = null;

const UIManager = {
    switchScreen(id) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById(id).classList.add('active');
        if (id === 'match-screen') UIManager.initMatchUI();
    },

    renderPlayerList(teamKey) {
        const list = document.getElementById(`${teamKey}-players-list`);
        if (!list) return;
        list.innerHTML = gameState.teams[teamKey].players.map((p, i) => `
            <div class="player-row">
                <span>#${p.number} <b>${p.name}</b></span>
                <button class="btn btn-danger btn-xs" onclick="window.removePlayer('${teamKey}', ${i})">×</button>
            </div>
        `).join('');
    },

    initMatchUI() {
        document.getElementById('display-home-name').innerText = gameState.teams.home.name;
        document.getElementById('display-away-name').innerText = gameState.teams.away.name;
        UIManager.updateScoreboard();
    },

    updateScoreboard() {
        document.getElementById('home-score').innerText = gameState.teams.home.score;
        document.getElementById('away-score').innerText = gameState.teams.away.score;
        document.getElementById('fouls-home').innerText = gameState.teams.home.fouls;
        document.getElementById('fouls-away').innerText = gameState.teams.away.fouls;
        
        const homeBonus = document.getElementById('home-bonus');
        const awayBonus = document.getElementById('away-bonus');
        if (homeBonus) homeBonus.classList.toggle('active', gameState.teams.home.fouls >= 4);
        if (awayBonus) awayBonus.classList.toggle('active', gameState.teams.away.fouls >= 4);

        UIManager.renderActivePlayers('home');
        UIManager.renderActivePlayers('away');
        UIManager.updateClocks();
    },

    renderSoundQueue() {
        const html = SoundManager.queue.map(item => `
            <div class="queue-item dj-queue-item">
                <span>${item.category}</span>
                <span class="q-remove" onclick="SoundManager.removeFromQueue(${item.id})">✕</span>
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
        
        container.innerHTML = active.map(p => `
            <div class="player-match-card" style="border-left: 5px solid ${team.color}">
                <div class="p-info">
                    <span class="p-num">#${p.number}</span>
                    <span class="p-name">${p.name}</span>
                    <span class="p-fouls">${p.fouls}F</span>
                </div>
                <div class="player-actions">
                    <button class="btn btn-xs" onclick="window.addPoints('${teamKey}', '${p.number}', 1)">+1</button>
                    <button class="btn btn-xs" onclick="window.addPoints('${teamKey}', '${p.number}', 2)">+2</button>
                    <button class="btn btn-xs" onclick="window.addPoints('${teamKey}', '${p.number}', 3)">+3</button>
                    <button class="btn btn-xs btn-warning" onclick="window.addFoul('${teamKey}', '${p.number}')">FOUL</button>
                    <button class="btn btn-xs btn-danger" onclick="window.openSubModal('${teamKey}', '${p.number}')">SUB</button>
                </div>
            </div>
        `).join('');
    },

    updateLog() {
        const log = document.getElementById('event-log');
        if (!log) return;
        log.innerHTML = gameState.events.slice(-10).map(e => `
            <div class="log-entry ${e.reverted ? 'reverted' : ''}">
                <span>${e.icon} ${e.message}</span>
                <button class="btn btn-xs" onclick="window.revertEvent(${e.id})">↩️</button>
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

        onBenchList.innerHTML = team.players.filter(p => !p.inCourt).map(p => `
            <div class="sub-item ${subState.inPlayerNum === p.number ? 'selected' : ''}" onclick="window.selectSubPlayer('in', '${p.number}')">
                #${p.number} ${p.name}
            </div>
        `).join('');
    }
};

let subState = { teamKey: null, outPlayerNum: null, inPlayerNum: null };

window.openSubModal = (teamKey, outPlayerNum = null) => {
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
        pOut.inCourt = false; pIn.inCourt = true;
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
        p.fouls++;
        gameState.teams[team].fouls++;
        GameEngine.logEvent(`Falta #${num}`, 'foul', team, num);
        if (p.fouls >= 5) notify(`JOGADOR #${num} EXCLUÍDO!`);
        UIManager.updateScoreboard();
    }
};

window.removePlayer = (team, i) => {
    gameState.teams[team].players.splice(i, 1);
    UIManager.renderPlayerList(team);
};

document.addEventListener('DOMContentLoaded', () => {
    const sbHero = document.querySelector('.btn-soundboard-hero');
    if (sbHero) sbHero.onclick = window.openSoundboard;

    document.getElementById('start-match-btn').onclick = () => {
        gameState.teams.home.name = document.getElementById('home-name').value || 'CASA';
        gameState.teams.away.name = document.getElementById('away-name').value || 'VISITANTE';
        if (gameState.teams.home.players.length < 5 || gameState.teams.away.players.length < 5) return notify("Mínimo de 5 jogadores!");
        gameState.teams.home.players.slice(0, 5).forEach(p => p.inCourt = true);
        gameState.teams.away.players.slice(0, 5).forEach(p => p.inCourt = true);
        UIManager.switchScreen('match-screen');
    };

    document.getElementById('btn-add-home-p').onclick = () => GameEngine.addPlayer('home', document.getElementById('home-p-name').value, document.getElementById('home-p-num').value);
    document.getElementById('btn-add-away-p').onclick = () => GameEngine.addPlayer('away', document.getElementById('away-p-name').value, document.getElementById('away-p-num').value);
    
    document.getElementById('mock-data-btn').onclick = () => {
        const names = ["LeBron", "Stephen", "Kevin", "Luka", "Giannis", "Joel", "Jayson", "Jimmy", "Anthony", "Kyrie"];
        gameState.teams.home.players = names.slice(0,5).map((n,i)=>({name:n,number:i+1,points:0,fouls:0,inCourt:false}));
        gameState.teams.away.players = names.slice(5,10).map((n,i)=>({name:n,number:i+11,points:0,fouls:0,inCourt:false}));
        UIManager.renderPlayerList('home'); UIManager.renderPlayerList('away');
    };

    document.getElementById('toggle-clock-btn').onclick = ClockEngine.toggle;
    if (document.getElementById('nba-btn')) document.getElementById('nba-btn').onclick = () => SoundManager.play('nba');
    if (document.getElementById('torcida-btn')) document.getElementById('torcida-btn').onclick = () => SoundManager.play('torcida');
    if (document.getElementById('musica-btn')) document.getElementById('musica-btn').onclick = () => SoundManager.play('musica');
    if (document.getElementById('skip-audio-btn')) document.getElementById('skip-audio-btn').onclick = () => SoundManager.skip();
    if (document.getElementById('close-sub-modal')) document.getElementById('close-sub-modal').onclick = () => document.getElementById('sub-modal').classList.remove('active');
});

window.SoundManager = SoundManager;
setTimeout(() => UIManager.renderSoundboard(), 500);
