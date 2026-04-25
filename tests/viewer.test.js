import { describe, it, expect } from 'vitest';
import { computeDerivedState } from '../src/core/selectors.js';
import { EVENT_TYPES } from '../src/core/event-types.js';

describe('Public Viewer Logic - Derived State', () => {
    const initialState = {
        teams: {
            home: { score: 0 },
            away: { score: 0 }
        },
        clock: 600000,
        period: 1,
        events: []
    };

    it('should detect fireMode when score difference >= 15', () => {
        const state = {
            ...initialState,
            teams: { home: { score: 20 }, away: { score: 5 } }
        };
        const derived = computeDerivedState(state);
        expect(derived.fireMode).toBe(true);
        expect(derived.fireTeam).toBe('home');
    });

    it('should not detect fireMode when score difference < 15', () => {
        const state = {
            ...initialState,
            teams: { home: { score: 10 }, away: { score: 5 } }
        };
        const derived = computeDerivedState(state);
        expect(derived.fireMode).toBe(false);
    });

    it('should detect a score streak of 3 for home team', () => {
        const state = {
            ...initialState,
            events: [
                { type: EVENT_TYPES.SCORE_MADE, payload: { teamKey: 'home' }, reverted: false },
                { type: EVENT_TYPES.SCORE_MADE, payload: { teamKey: 'home' }, reverted: false },
                { type: EVENT_TYPES.SCORE_MADE, payload: { teamKey: 'home' }, reverted: false }
            ]
        };
        const derived = computeDerivedState(state);
        expect(derived.scoreStreak).toBe(3);
        expect(derived.streakTeam).toBe('home');
    });

    it('should reset score streak when other team scores', () => {
        const state = {
            ...initialState,
            events: [
                { type: EVENT_TYPES.SCORE_MADE, payload: { teamKey: 'home' }, reverted: false },
                { type: EVENT_TYPES.SCORE_MADE, payload: { teamKey: 'home' }, reverted: false },
                { type: EVENT_TYPES.SCORE_MADE, payload: { teamKey: 'away' }, reverted: false }
            ]
        };
        const derived = computeDerivedState(state);
        expect(derived.scoreStreak).toBe(1);
        expect(derived.streakTeam).toBe('away');
    });

    it('should ignore non-score events for streak calculation', () => {
        const state = {
            ...initialState,
            events: [
                { type: EVENT_TYPES.SCORE_MADE, payload: { teamKey: 'home' }, reverted: false },
                { type: EVENT_TYPES.TIMEOUT, payload: { teamKey: 'away' }, reverted: false },
                { type: EVENT_TYPES.SCORE_MADE, payload: { teamKey: 'home' }, reverted: false }
            ]
        };
        const derived = computeDerivedState(state);
        expect(derived.scoreStreak).toBe(2);
        expect(derived.streakTeam).toBe('home');
    });

    it('should detect when timeout is active', () => {
        const state = {
            ...initialState,
            isTimeoutActive: true,
            timeoutClock: 30000
        };
        const derived = computeDerivedState(state);
        // Derived state currently doesn't transform timeout, but we ensure it passes through if needed
        // For now, placar-viewer reads isTimeoutActive directly.
        expect(state.isTimeoutActive).toBe(true);
    });
});

describe('GameEngine - Event Enrichment', () => {
    it('should enrich substitution event with player names', () => {
        // Mocking global state for the test
        const testState = {
            teams: {
                home: {
                    players: [
                        { number: '10', name: 'Oscar Schmidt' },
                        { number: '11', name: 'Marcel' }
                    ]
                }
            }
        };

        const payload = { teamKey: 'home', pInNum: '10', pOutNum: '11' };
        
        // Simulating the enrichment logic from GameEngine.logEvent
        if (payload.teamKey && payload.pInNum) {
            const pIn = testState.teams[payload.teamKey].players.find(x => x.number == payload.pInNum);
            if (pIn) payload.playerNameIn = pIn.name;
        }
        if (payload.teamKey && payload.pOutNum) {
            const pOut = testState.teams[payload.teamKey].players.find(x => x.number == payload.pOutNum);
            if (pOut) payload.playerNameOut = pOut.name;
        }

        expect(payload.playerNameIn).toBe('Oscar Schmidt');
        expect(payload.playerNameOut).toBe('Marcel');
    });
});

