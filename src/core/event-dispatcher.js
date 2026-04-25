// src/core/event-dispatcher.js
import { gameState } from './game-state.js';
import { computeDerivedState } from './selectors.js';
import { triggerAudio } from '../audio/audio-bridge.js';
import { EVENT_TYPES } from './event-types.js';

export function createGameEvent(type, payload = {}, context = {}) {
    return {
        id: crypto.randomUUID(),
        type,
        at: Date.now(),
        payload,
        context,
        reverted: false,
        timestamp: new Date().toLocaleTimeString()
    };
}

export function dispatchGameEvent(type, payload = {}) {
    const context = {
        clock: gameState.clock,
        period: gameState.period,
        score: {
            home: gameState.teams.home.score,
            away: gameState.teams.away.score
        }
    };
    
    const event = createGameEvent(type, payload, context);

    // Maintain compatibility with the old log message for now
    event.message = payload.message || `Event: ${type}`;
    event.icon = payload.icon || "📝";

    gameState.events.push(event);
    gameState.derived = computeDerivedState(gameState);

    // AUDIO DECISION VIA BRIDGE
    // Mapeia EVENT_TYPES para os eventNames do triggerAudio
    let audioEvent = null;
    if (type === EVENT_TYPES.SCORE_MADE) audioEvent = 'score';
    else if (type === EVENT_TYPES.TIMEOUT) audioEvent = 'timeout';
    else if (type === EVENT_TYPES.FOUL_PERSONAL) audioEvent = 'foul';
    else if (type === EVENT_TYPES.SUBSTITUTION) audioEvent = 'sub';
    else if (type === EVENT_TYPES.POSSE_24) audioEvent = 'posse_24';
    else if (type === EVENT_TYPES.POSSE_14) audioEvent = 'posse_14';
    else if (type === EVENT_TYPES.PERIOD_END) audioEvent = 'period_end';
    else if (type === EVENT_TYPES.COUNTDOWN_1M) audioEvent = 'countdown_1m';
    else if (type === EVENT_TYPES.COUNTDOWN_24S) audioEvent = 'countdown_24s';
    else if (type === EVENT_TYPES.COUNTDOWN_10S) audioEvent = 'countdown_10s';
    else if (type === EVENT_TYPES.GAME_END) audioEvent = 'game_end';
    else if (type === EVENT_TYPES.PERIOD_START) audioEvent = 'period_start';
    
    if (audioEvent) {
        triggerAudio(audioEvent, payload, { source: 'automatic' });
    }
    
    window.UIManager.updateLog();
    window.UIManager.updateScoreboard();

    return event;
}
