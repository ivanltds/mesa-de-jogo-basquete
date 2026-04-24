// src/audio/audio-decision-engine.js
import { AudioHistory } from './audio-history.js';
import { EVENT_TYPES } from '../core/event-types.js';

export const AudioDecisionEngine = {
    decide({ event, state, catalog }) {
        const candidates = this.getCandidates(event, catalog);
        const eligible = candidates.filter(asset => this.isEligible(asset, event));
        
        const ranked = eligible
            .map(asset => ({ asset, score: this.score(asset, event, state) }))
            .sort((a, b) => b.score - a.score);

        const chosen = ranked[0]?.asset ?? null;
        
        if (chosen) {
            console.log(`[AudioDecision] Chosen: ${chosen.id} for event ${event.type} (score: ${ranked[0].score})`);
        } else {
            console.log(`[AudioDecision] No eligible asset for event ${event.type}`);
        }

        return chosen;
    },

    getCandidates(event, catalog) {
        return catalog.filter(asset => asset.enabled && asset.eventTypes.includes(event.type));
    },

    isEligible(asset, event) {
        if (AudioHistory.wasRecentlyPlayed(asset.id, asset.cooldownMs)) return false;
        return true;
    },

    score(asset, event, state) {
        let score = 0;

        score += this.scoreByContext(asset, event, state);
        score += this.scoreByRecency(asset);
        score += this.scoreByIntensity(asset, event, state);

        return score;
    },

    scoreByContext(asset, event, state) {
        let score = 0;

        if (event.type === EVENT_TYPES.SCORE_MADE) {
            if (event.payload?.value === 3) score += 2;
            if (state.derived.clutch) score += asset.tags.includes('clutch') ? 10 : 0;
            if (state.derived.scoreDiff <= 6) score += 2;
        }

        if (event.type === EVENT_TYPES.SHOT_MISSED) {
            if (asset.tags.includes('fun')) score += 1;
        }

        if (event.type === EVENT_TYPES.PERIOD_END || event.type === EVENT_TYPES.GAME_END) {
            if (asset.tags.includes('official')) score += 20;
        }

        if (event.type === EVENT_TYPES.FOUL_PERSONAL) {
            // Only play buzzer for 5th foul
            if (event.payload?.isExclusion) {
                if (asset.tags.includes('official')) score += 20;
            } else {
                // No sound for regular fouls for now, or maybe a whistle if we had one
                return -100; 
            }
        }

        if (event.type === EVENT_TYPES.TIMEOUT) {
            if (asset.tags.includes('official')) score += 20;
        }

        return score;
    },

    scoreByRecency(asset) {
        const repeated = AudioHistory.getRecentRepeats(asset.id, 10);
        return repeated > 0 ? repeated * -10 : 5;
    },

    scoreByIntensity(asset, event, state) {
        // High intensity preferred for period end / clutch
        if (event.type === EVENT_TYPES.PERIOD_END || event.type === EVENT_TYPES.GAME_END) {
            return asset.intensity >= 4 ? 10 : -5;
        }
        
        if (state.derived.clutch) {
            return asset.intensity >= 4 ? 5 : 0;
        }
        
        // Default: prefer medium intensity
        return asset.intensity === 3 ? 2 : 0;
    }
};
