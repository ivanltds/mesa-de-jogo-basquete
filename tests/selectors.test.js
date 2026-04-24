// tests/selectors.test.js
import { describe, it, expect } from 'vitest';
import { computeDerivedState } from '../src/core/selectors.js';

describe('selectors', () => {
    it('should calculate scoreDiff correctly', () => {
        const state = {
            teams: {
                home: { score: 80 },
                away: { score: 75 }
            },
            period: 4,
            clock: 60000,
            events: []
        };
        const derived = computeDerivedState(state);
        expect(derived.scoreDiff).toBe(5);
        expect(derived.leader).toBe('home');
    });

    it('should detect clutch state correctly', () => {
        const state = {
            teams: {
                home: { score: 80 },
                away: { score: 78 }
            },
            period: 4,
            clock: 110000, // < 2 mins
            events: []
        };
        const derived = computeDerivedState(state);
        expect(derived.clutch).toBe(true);
    });

    it('should not be clutch if score diff is large', () => {
        const state = {
            teams: {
                home: { score: 100 },
                away: { score: 78 }
            },
            period: 4,
            clock: 30000,
            events: []
        };
        const derived = computeDerivedState(state);
        expect(derived.clutch).toBe(false);
    });

    it('should not be clutch if period is early', () => {
        const state = {
            teams: {
                home: { score: 10 },
                away: { score: 8 }
            },
            period: 1,
            clock: 30000,
            events: []
        };
        const derived = computeDerivedState(state);
        expect(derived.clutch).toBe(false);
    });
});
