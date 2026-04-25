// tests/audio-decision-engine.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AudioDecisionEngine } from '../src/audio/audio-decision-engine.js';
import { EVENT_TYPES } from '../src/core/event-types.js';
import { AudioHistory } from '../src/audio/audio-history.js';
import { DEFAULT_AUDIO_SCORING_RULES } from '../src/audio/audio-scoring-rules.js';

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

    const rules = DEFAULT_AUDIO_SCORING_RULES;

    beforeEach(() => {
        vi.clearAllMocks();
        AudioHistory.wasRecentlyPlayed.mockReturnValue(false);
        AudioHistory.getRecentRepeats.mockReturnValue(0);
    });

    it('rank() should return sorted candidates with breakdown', () => {
        const event = { type: EVENT_TYPES.SCORE_MADE, payload: { value: 3 } };
        const results = AudioDecisionEngine.rank({ event, state: mockState, catalog: mockCatalog, rules });
        
        expect(results.length).toBe(2);
        expect(results[0].eligible).toBe(true);
        expect(results[0].breakdown.total).toBeGreaterThan(0);
        expect(results[0].breakdown.reasons.some(r => r.key === 'scoreMade.threePointBonus')).toBe(true);
    });

    it('should filter out ineligible assets based on history', () => {
        const event = { type: EVENT_TYPES.SCORE_MADE };
        AudioHistory.wasRecentlyPlayed.mockImplementation((id) => id === 'asset_1');
        
        const results = AudioDecisionEngine.rank({ event, state: mockState, catalog: mockCatalog, rules });
        
        const asset1 = results.find(r => r.asset.id === 'asset_1');
        const asset2 = results.find(r => r.asset.id === 'asset_2');
        
        expect(asset1.eligible).toBe(false);
        expect(asset2.eligible).toBe(true);
    });

    it('decide() should return the top eligible asset', () => {
        const event = { type: EVENT_TYPES.SCORE_MADE };
        const result = AudioDecisionEngine.decide({ event, state: mockState, catalog: mockCatalog, rules });
        
        expect(result.id).toBeDefined();
        expect(['asset_1', 'asset_2']).toContain(result.id);
    });

    it('should apply clutch bonus correctly', () => {
        const event = { type: EVENT_TYPES.SCORE_MADE, payload: { value: 2 } };
        const clutchState = { derived: { clutch: true, scoreDiff: 2 } };
        
        const results = AudioDecisionEngine.rank({ event, state: clutchState, catalog: mockCatalog, rules });
        const clutchAsset = results.find(r => r.asset.id === 'asset_2');
        
        expect(clutchAsset.breakdown.reasons.some(r => r.key === 'scoreMade.clutchTagBonus')).toBe(true);
    });
});
