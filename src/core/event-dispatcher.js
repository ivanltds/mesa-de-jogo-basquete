// src/core/event-dispatcher.js
import { gameState } from './game-state.js';
import { computeDerivedState } from './selectors.js';
import { AudioDecisionEngine } from '../audio/audio-decision-engine.js';
import { AUDIO_CATALOG } from '../audio/audio-catalog.js';
import { AudioPlaybackQueue } from '../audio/audio-playback-queue.js';
import { AudioHistory } from '../audio/audio-history.js';

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

    // AUDIO DECISION
    const selectedAsset = AudioDecisionEngine.decide({
        event,
        state: gameState,
        catalog: AUDIO_CATALOG
    });

    if (selectedAsset) {
        const queueItem = {
            id: crypto.randomUUID(),
            assetId: selectedAsset.id,
            category: selectedAsset.tags[0] || 'auto',
            file: selectedAsset.file,
            sourceEventId: event.id,
            sourceEventType: event.type,
            requestedAt: Date.now()
        };

        AudioPlaybackQueue.addToQueue(queueItem.category, queueItem.file);
        AudioHistory.add(selectedAsset.id, event.id);
    }
    
    window.UIManager.updateLog();
    window.UIManager.updateScoreboard();

    return event;
}
