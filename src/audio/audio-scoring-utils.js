// src/audio/audio-scoring-utils.js
import { DEFAULT_AUDIO_SCORING_RULES } from './audio-scoring-rules.js';
import { EVENT_TYPES } from '../core/event-types.js';

export const AudioScoringUtils = {
    /**
     * Returns a snapshot of the current scoring rules from the state.
     */
    getScoringRulesSnapshot(state) {
        return JSON.parse(JSON.stringify(state.audio.scoringRules || DEFAULT_AUDIO_SCORING_RULES));
    },

    /**
     * Resets the scoring rules in the state to the defaults.
     */
    resetScoringRules(state) {
        state.audio.scoringRules = JSON.parse(JSON.stringify(DEFAULT_AUDIO_SCORING_RULES));
        return state.audio.scoringRules;
    },

    /**
     * Builds a simulation event compatible with the engine from form values.
     */
    buildSimulationEvent(formValues) {
        const event = {
            type: formValues.eventType,
            payload: {}
        };

        if (formValues.eventType === EVENT_TYPES.SCORE_MADE) {
            event.payload.value = parseInt(formValues.scoreValue) || 2;
        } else if (formValues.eventType === EVENT_TYPES.FOUL_PERSONAL) {
            event.payload.isExclusion = formValues.isExclusion === 'true' || formValues.isExclusion === true;
        }

        return event;
    },

    /**
     * Builds a minimal simulation state from form values and base state.
     */
    buildSimulationState(formValues, baseState) {
        const simulatedState = JSON.parse(JSON.stringify(baseState));
        
        // Apply overrides
        simulatedState.period = parseInt(formValues.period) || simulatedState.period;
        simulatedState.derived.scoreDiff = parseInt(formValues.scoreDiff) || 0;
        simulatedState.derived.clutch = formValues.clutch === 'true' || formValues.clutch === true;
        
        // Mock history if needed for recency simulation
        if (formValues.recentRepeats) {
            // This is a simplification as per the plan
            // We could inject dummy history items for the target asset
            // But since getRecentRepeats is used, we might need a more complex mock
            // For now, let's just use the current state's history
        }

        return simulatedState;
    }
};
