// tests/audio-decision-engine.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AudioDecisionEngine } from '../src/audio/audio-decision-engine.js';
import { EVENT_TYPES } from '../src/core/event-types.js';
import { AudioHistory } from '../src/audio/audio-history.js';

vi.mock('../src/audio/audio-history.js', () => ({
    AudioHistory: {
        wasRecentlyPlayed: vi.fn(),
        getRecentRepeats: vi.fn(),
        add: vi.fn()
    }
}));

describe('AudioDecisionEngine', () => {
    const mockCatalog = [
        { id: 'asset_1', file: 'file1.mp3', eventTypes: [EVENT_TYPES.SCORE_MADE], tags: ['score'], intensity: 3, cooldownMs: 30000, enabled: true },
        { id: 'asset_2', file: 'file2.mp3', eventTypes: [EVENT_TYPES.SCORE_MADE], tags: ['score', 'clutch'], intensity: 5, cooldownMs: 60000, enabled: true },
        { id: 'asset_3', file: 'file3.mp3', eventTypes: [EVENT_TYPES.PERIOD_END], tags: ['official'], intensity: 5, cooldownMs: 0, enabled: true }
    ];

    const mockState = {
        derived: {
            clutch: false,
            scoreDiff: 10
        }
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should return null if no candidates match event type', () => {
        const event = { type: EVENT_TYPES.TURNOVER };
        const result = AudioDecisionEngine.decide({ event, state: mockState, catalog: mockCatalog });
        expect(result).toBeNull();
    });

    it('should filter out recently played assets', () => {
        const event = { type: EVENT_TYPES.SCORE_MADE };
        AudioHistory.wasRecentlyPlayed.mockImplementation((id) => id === 'asset_1');
        
        const result = AudioDecisionEngine.decide({ event, state: mockState, catalog: mockCatalog });
        expect(result.id).toBe('asset_2');
    });

    it('should prioritize clutch assets when in clutch state', () => {
        const event = { type: EVENT_TYPES.SCORE_MADE, payload: { value: 2 } };
        const clutchState = { derived: { clutch: true, scoreDiff: 2 } };
        
        const result = AudioDecisionEngine.decide({ event, state: clutchState, catalog: mockCatalog });
        expect(result.id).toBe('asset_2');
    });

    it('should prioritize official buzzer for period end', () => {
        const event = { type: EVENT_TYPES.PERIOD_END };
        const result = AudioDecisionEngine.decide({ event, state: mockState, catalog: mockCatalog });
        expect(result.id).toBe('asset_3');
    });
});
