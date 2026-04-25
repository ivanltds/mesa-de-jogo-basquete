// src/audio/audio-history.js
import { gameState } from '../core/game-state.js';

export const AudioHistory = {
    add(assetId, eventId) {
        if (!gameState?.audio?.history) return;
        
        gameState.audio.history.push({
            assetId,
            eventId,
            at: Date.now()
        });
        
        // Keep history manageable
        if (gameState.audio.history.length > 50) {
            gameState.audio.history.shift();
        }
    },

    getLastPlayed(assetId) {
        return gameState?.audio?.history?.findLast?.(h => h.assetId === assetId);
    },

    wasRecentlyPlayed(assetId, cooldownMs) {
        const lastPlay = this.getLastPlayed(assetId);
        if (!lastPlay) return false;
        return (Date.now() - lastPlay.at) < cooldownMs;
    },

    getRecentRepeats(assetId, windowSize = 10) {
        const history = gameState?.audio?.history || [];
        const recent = history.slice(-windowSize);
        return recent.filter(h => h.assetId === assetId).length;
    }
};
