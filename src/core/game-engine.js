// src/core/game-engine.js
import { gameState } from './game-state.js';
import { AudioPlaybackQueue as SoundManager } from '../audio/audio-playback-queue.js';
import { dispatchGameEvent } from './event-dispatcher.js';
import { EVENT_TYPES } from './event-types.js';

export const GameEngine = {
    addPlayer(teamKey, name, number) {
        if (!name || !number) return window.notify("Preencha nome e número!");
        const team = gameState.teams[teamKey];
        if (team.players.find(p => p.number === number)) return window.notify("Número já existe!");
        team.players.push({ name, number, points: 0, fouls: 0, inCourt: false });
        window.UIManager.renderPlayerList(teamKey);
        document.getElementById(`${teamKey}-p-num`).value = '';
        document.getElementById(`${teamKey}-p-name`).value = '';
        document.getElementById(`${teamKey}-p-num`).focus();
    },

    logEvent(message, type = 'info', teamKey = null, playerNum = null, value = 0, pInNum = null, pOutNum = null, isExclusion = false) {
        let icon = "📝";
        if (message.includes("pts")) icon = "🏀";
        if (message.includes("Falta")) icon = "⚠️";
        if (message.includes("SUB")) icon = "🔄";
        
        let eventType = EVENT_TYPES.TURNOVER; // Default fallback
        if (type === 'points') eventType = EVENT_TYPES.SCORE_MADE;
        else if (type === 'foul') eventType = EVENT_TYPES.FOUL_PERSONAL;
        else if (type === 'sub') eventType = EVENT_TYPES.SUBSTITUTION;
        else if (type === 'timeout') eventType = EVENT_TYPES.TIMEOUT;

        const payload = {
            message,
            icon,
            teamKey,
            playerNum,
            value,
            pInNum,
            pOutNum,
            isExclusion
        };

        // Enrichment with names
        if (teamKey) {
            const team = gameState.teams[teamKey];
            if (playerNum) {
                const p = team.players.find(x => x.number == playerNum);
                if (p) payload.playerName = p.name;
            }
            if (pInNum) {
                const pIn = team.players.find(x => x.number == pInNum);
                if (pIn) payload.playerNameIn = pIn.name;
            }
            if (pOutNum) {
                const pOut = team.players.find(x => x.number == pOutNum);
                if (pOut) payload.playerNameOut = pOut.name;
            }
        }

        dispatchGameEvent(eventType, payload);
    },

    endGame() {
        const homeScore = gameState.teams.home.score;
        const awayScore = gameState.teams.away.score;
        const winnerKey = homeScore > awayScore ? 'home' : 'away';
        const winner = gameState.teams[winnerKey];
        
        dispatchGameEvent(EVENT_TYPES.GAME_END, {
            message: `FIM DE JOGO! Vitória de ${winner.name}`,
            icon: "🏆",
            winnerKey
        });

        window.UIManager.showVictoryModal(winnerKey);
    }
};
