// src/app/bootstrap.js
import { gameState } from '../core/game-state.js';
import { AudioPlaybackQueue as SoundManager } from '../audio/audio-playback-queue.js';
import { GameEngine } from '../core/game-engine.js';
import { ClockEngine } from '../core/clock-engine.js';
import { triggerAudio, triggerManualAudio } from '../audio/audio-bridge.js';
import { INITIAL_AUDIO_PROFILES } from '../audio/audio-profiles.js';
import { DEFAULT_AUDIO_SCORING_RULES } from '../audio/audio-scoring-rules.js';

window.triggerAudio = triggerAudio;
window.triggerManualAudio = triggerManualAudio;
import { UIManager } from '../ui/ui-manager.js';
import { EVENT_TYPES } from '../core/event-types.js';
import { dispatchGameEvent } from '../core/event-dispatcher.js';

// Expose to window for HTML compatibility (onclick handlers)
window.gameState = gameState;
window.SoundManager = SoundManager;
window.GameEngine = GameEngine;
window.ClockEngine = ClockEngine;
window.UIManager = UIManager;

let subState = { teamKey: null, outPlayerNum: null, inPlayerNum: null };

export const openSubModal = (teamKey, outPlayerNum = null) => {
    if (gameState.isActive) return window.notify("Substituição apenas com bola morta!", "error");
    subState = { teamKey, outPlayerNum, inPlayerNum: null };
    document.getElementById('sub-modal').classList.add('active');
    UIManager.renderSubLists(subState);
};
window.openSubModal = openSubModal;

export const selectSubPlayer = (type, num) => {
    if (type === 'out') subState.outPlayerNum = num; else subState.inPlayerNum = num;
    if (subState.outPlayerNum && subState.inPlayerNum) {
        const team = gameState.teams[subState.teamKey];
        const pOut = team.players.find(p => p.number === subState.outPlayerNum);
        const pIn = team.players.find(p => p.number === subState.inPlayerNum);
        
        if (pIn.fouls >= 5) return window.notify("Jogador com 5 faltas não pode entrar!", "error");
        
        pOut.inCourt = false; 
        pIn.inCourt = true;
        GameEngine.logEvent(`SUB: #${pIn.number} entra, #${pOut.number} sai`, 'sub', subState.teamKey, null, 0, pIn.number, pOut.number);
        document.getElementById('sub-modal').classList.remove('active');
        UIManager.updateScoreboard();
    } else UIManager.renderSubLists(subState);
};
window.selectSubPlayer = selectSubPlayer;

export const addPoints = (team, num, pts) => {
    const p = gameState.teams[team].players.find(x => x.number == num);
    if (p) {
        p.points += pts;
        gameState.teams[team].score += pts;
        GameEngine.logEvent(`${pts} pts para #${num}`, 'points', team, num, pts);
        UIManager.updateScoreboard();
    }
};
window.addPoints = addPoints;

export const addFoul = (team, num) => {
    const p = gameState.teams[team].players.find(x => x.number == num);
    if (p) {
        if (p.fouls >= 5) return window.notify(`JOGADOR #${num} JÁ ESTÁ EXCLUÍDO!`);
        p.fouls++;
        gameState.teams[team].fouls++;
        GameEngine.logEvent(`Falta #${num}`, 'foul', team, num, 0, null, null, p.fouls >= 5);
        if (p.fouls >= 5) {
            window.notify(`JOGADOR #${num} EXCLUÍDO (5 FALTAS)!`, 'error');
        }
        UIManager.updateScoreboard();
    }
};
window.addFoul = addFoul;

export const addTimeout = (team) => {
    if (gameState.teams[team].timeouts >= 5) return window.notify("Limite de tempos atingido!");
    gameState.teams[team].timeouts++;
    GameEngine.logEvent(`TIMEOUT ${gameState.teams[team].name}`, 'timeout', team);
    UIManager.updateScoreboard();
};
window.addTimeout = addTimeout;

export const revertEvent = (id) => {
    const e = gameState.events.find(x => x.id === id);
    if (!e) return;
    
    const isReverting = !e.reverted;
    const modifier = isReverting ? -1 : 1;

    if (e.type === EVENT_TYPES.SCORE_MADE) {
        gameState.teams[e.payload.teamKey].score += (e.payload.value * modifier);
        const p = gameState.teams[e.payload.teamKey].players.find(x => x.number == e.payload.playerNum);
        if (p) p.points += (e.payload.value * modifier);
    } else if (e.type === EVENT_TYPES.FOUL_PERSONAL) {
        gameState.teams[e.payload.teamKey].fouls += modifier;
        const p = gameState.teams[e.payload.teamKey].players.find(x => x.number == e.payload.playerNum);
        if (p) p.fouls += modifier;
    } else if (e.type === EVENT_TYPES.TIMEOUT) {
        gameState.teams[e.payload.teamKey].timeouts += modifier;
    } else if (e.type === EVENT_TYPES.SUBSTITUTION) {
        const team = gameState.teams[e.payload.teamKey];
        const pIn = team.players.find(p => p.number === e.payload.pInNum);
        const pOut = team.players.find(p => p.number === e.payload.pOutNum);
        if (pIn && pOut) {
            pIn.inCourt = !isReverting;
            pOut.inCourt = isReverting;
        }
    }
    
    e.reverted = isReverting;
    window.notify(isReverting ? 'Evento revertido!' : 'Evento restaurado!');
    UIManager.updateScoreboard();
};
window.revertEvent = revertEvent;

window.removePlayer = (team, i) => {
    gameState.teams[team].players.splice(i, 1);
    UIManager.renderPlayerList(team);
};

export const notify = (msg, type = 'info') => {
    const container = document.getElementById('toast-container');
    if (!container) {
        console.log(`[Notification] ${type}: ${msg}`);
        return;
    }
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerText = msg;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
};
window.notify = notify;

export const openSoundboard = () => {
    UIManager.switchScreen('soundboard-screen');
};
window.openSoundboard = openSoundboard;

export const nextPeriod = () => {
    if (gameState.clock >= 1000) {
        window.notify("O relógio precisa estar em 00:00 para avançar de período!", "error");
        return;
    }

    ClockEngine.stop();

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
        gameState.clock = 600000;
        gameState.shotClock = 24000;
        gameState.teams.home.fouls = 0;
        gameState.teams.away.fouls = 0;
        
        dispatchGameEvent(EVENT_TYPES.PERIOD_START, {
            message: `Início do Período ${gameState.period}! Faltas coletivas zeradas. Relógios reiniciados.`,
            icon: "🏀"
        });
        window.notify(`Início do Período ${gameState.period}! Faltas coletivas zeradas. Relógios reiniciados.`, 'info');
    } else {
        if (gameState.period === 'OT') {
            gameState.period = 'OT2';
        } else {
            gameState.period = 'OT';
        }
        gameState.clock = 300000;
        gameState.shotClock = 24000;

        dispatchGameEvent(EVENT_TYPES.PERIOD_START, {
            message: `Início do ${gameState.period}! Faltas coletivas MANTIDAS. Relógio em 5:00.`,
            icon: "🏀"
        });
        window.notify(`Início do ${gameState.period}! Faltas coletivas MANTIDAS. Relógio em 5:00.`, 'info');
    }
    
    GameEngine.logEvent(`Avançou para o ${gameState.period}`, 'info');
    UIManager.updateScoreboard();
};

window.nextPeriod = nextPeriod;

export const togglePossession = () => {
    gameState.possession = gameState.possession === 'home' ? 'away' : 'home';
    UIManager.updateScoreboard();
};
window.togglePossession = togglePossession;

export const showReport = () => {
    const victoryModal = document.getElementById('victory-modal');
    if (victoryModal) victoryModal.classList.remove('active');
    UIManager.renderReport();
    UIManager.switchScreen('report-screen');
};
window.showReport = showReport;

export const saveState = () => {
    try {
        localStorage.setItem('ritmo_de_jogo_state', JSON.stringify(gameState));
    } catch (e) {
        console.error("Erro ao salvar estado:", e);
    }
};
window.saveState = saveState;

export const loadState = () => {
    try {
        const saved = localStorage.getItem('ritmo_de_jogo_state');
        if (saved) {
            const parsed = JSON.parse(saved);
            Object.assign(gameState, parsed);
            UIManager.updateScoreboard();
        }
    } catch (e) {
        console.error("Erro ao carregar estado:", e);
    }
};
window.loadState = loadState;

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
            
            if (gameState.teams.home.players.length < 5 || gameState.teams.away.players.length < 5) return window.notify("Mínimo de 5 jogadores!");
            gameState.teams.home.players.slice(0, 5).forEach(p => p.inCourt = true);
            gameState.teams.away.players.slice(0, 5).forEach(p => p.inCourt = true);
            UIManager.switchScreen('match-screen');
            window.saveState();
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
            // Reset state first
            gameState.events = [];
            gameState.teams.home.score = 0;
            gameState.teams.away.score = 0;
            gameState.teams.home.fouls = 0;
            gameState.teams.away.fouls = 0;
            gameState.teams.home.timeouts = 0;
            gameState.teams.away.timeouts = 0;
            gameState.clock = 600000;
            gameState.shotClock = 24000;
            gameState.period = 1;
            gameState.isActive = false;
            gameState.possession = 'home';
            gameState.audio.history = [];
            
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
            window.notify("Times de Elite carregados!");
        };
    }

    // 1. Botão REINICIAR PARTIDA (Mesa de Jogo)
    const restartMatchBtn = document.getElementById('restart-match-btn');
    if (restartMatchBtn) {
        restartMatchBtn.onclick = () => {
            const modal = document.getElementById('restart-modal');
            if (modal) modal.classList.add('active');
        };
    }

    const confirmRestartBtn = document.getElementById('confirm-restart-btn');
    if (confirmRestartBtn) {
        confirmRestartBtn.onclick = () => {
            // Soft Reset: Preserve teams/players, reset match stats
            gameState.events = [];
            gameState.clock = 600000;
            gameState.shotClock = 24000;
            gameState.period = 1;
            gameState.isActive = false;
            gameState.possession = 'home';
            
            ['home', 'away'].forEach(t => {
                gameState.teams[t].score = 0;
                gameState.teams[t].fouls = 0;
                gameState.teams[t].timeouts = 0;
                gameState.teams[t].players.forEach(p => {
                    p.points = 0;
                    p.fouls = 0;
                    p.inCourt = false; // Reset court status
                });
            });

            if (gameState.audio) gameState.audio.history = [];

            UIManager.updateScoreboard();
            UIManager.renderPlayerList('home');
            UIManager.renderPlayerList('away');
            UIManager.switchScreen('setup-screen');
            
            document.getElementById('restart-modal').classList.remove('active');
            window.notify("Partida reiniciada! Times preservados.");
            window.saveState();
        };
    }

    // 2. Botão LIMPAR TUDO (Configuração)
    const clearAllBtn = document.getElementById('clear-all-btn');
    if (clearAllBtn) {
        clearAllBtn.onclick = () => {
            const modal = document.getElementById('clear-all-modal');
            if (modal) modal.classList.add('active');
        };
    }

    const confirmClearAllBtn = document.getElementById('confirm-clear-all-btn');
    if (confirmClearAllBtn) {
        confirmClearAllBtn.onclick = () => {
            localStorage.removeItem('ritmo_de_jogo_state');
            location.reload();
        };
    }

    if(document.getElementById('toggle-clock-btn')) document.getElementById('toggle-clock-btn').onclick = ClockEngine.toggle;
    if (document.getElementById('reset-24-btn')) document.getElementById('reset-24-btn').onclick = () => {
        ClockEngine.resetShotClock(24000);
        window.togglePossession();
    };
    if(document.getElementById('reset-14-btn')) document.getElementById('reset-14-btn').onclick = () => ClockEngine.resetShotClock(14000);
    if(document.getElementById('next-period-btn')) document.getElementById('next-period-btn').onclick = () => window.nextPeriod();
    if(document.getElementById('fast-forward-btn')) document.getElementById('fast-forward-btn').onclick = () => ClockEngine.setTestTime();
    
    if (document.getElementById('audio-policy-btn')) document.getElementById('audio-policy-btn').onclick = () => {
        UIManager.switchScreen('audio-policy-screen');
        UIManager.initAudioPolicyScreen();
    };

    if (document.getElementById('audio-scoring-btn')) document.getElementById('audio-scoring-btn').onclick = () => {
        UIManager.switchScreen('audio-scoring-screen');
        UIManager.initAudioScoringScreen();
    };

    if (document.getElementById('mystery-btn')) document.getElementById('mystery-btn').onclick = () => window.triggerManualAudio('esquisito');
    if (document.getElementById('fun-btn')) document.getElementById('fun-btn').onclick = () => window.triggerManualAudio('divertido');
    
    if (document.getElementById('nba-btn')) document.getElementById('nba-btn').onclick = () => window.triggerManualAudio('nba');
    if (document.getElementById('torcida-btn')) document.getElementById('torcida-btn').onclick = () => window.triggerManualAudio('torcida');
    if (document.getElementById('musica-btn')) document.getElementById('musica-btn').onclick = () => window.triggerManualAudio('musica');
    if (document.getElementById('skip-audio-btn')) document.getElementById('skip-audio-btn').onclick = () => SoundManager.skip();
    if (document.getElementById('close-sub-modal')) document.getElementById('close-sub-modal').onclick = () => document.getElementById('sub-modal').classList.remove('active');

    window.loadState();
    
    // Inicializa políticas de áudio se não existirem
    if (!gameState.audio.policies) {
        gameState.audio.policies = JSON.parse(JSON.stringify(INITIAL_AUDIO_PROFILES));
    }

    // Inicializa regras de score se não existirem
    if (!gameState.audio.scoringRules) {
        gameState.audio.scoringRules = JSON.parse(JSON.stringify(DEFAULT_AUDIO_SCORING_RULES));
    }

    UIManager.updateScoreboard();

    // Inicializa a Mesa de Som se estiver na tela correta
    if (document.getElementById('soundboard-screen')) {
        gameState.ui.activeScreenId = 'soundboard-screen';
        UIManager.renderSoundboard();
        UIManager.renderSoundQueue();
    }

    const isMainApp = document.getElementById('setup-screen') && document.getElementById('match-screen');
    
    if (isMainApp) {
        const hasActiveMatch = gameState.events.length > 0 || gameState.teams.home.score > 0 || gameState.teams.away.score > 0;
        
        if (hasActiveMatch) {
            UIManager.switchScreen('match-screen');
            const recoveryModal = document.getElementById('recovery-modal');
            if (recoveryModal) recoveryModal.classList.add('active');
        } else {
            UIManager.switchScreen('setup-screen');
        }
    }

    // Handlers do Modal de Recuperação
    const confirmContinueBtn = document.getElementById('confirm-continue-btn');
    if (confirmContinueBtn) {
        confirmContinueBtn.onclick = () => {
            document.getElementById('recovery-modal').classList.remove('active');
            window.notify("Partida retomada!");
        };
    }

    const recoveryRestartBtn = document.getElementById('recovery-restart-btn');
    if (recoveryRestartBtn) {
        recoveryRestartBtn.onclick = () => {
            // Reutiliza a lógica de reinício (soft reset) que preserva os times
            const restartBtn = document.getElementById('confirm-restart-btn');
            if (restartBtn) restartBtn.click();
            document.getElementById('recovery-modal').classList.remove('active');
        };
    }
});
