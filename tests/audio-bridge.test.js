import { describe, it, expect, vi, beforeEach } from 'vitest';
import { triggerManualAudio, triggerAudio } from '../src/audio/audio-bridge.js';
import { gameState } from '../src/core/game-state.js';
import { AudioPlaybackQueue as SoundManager } from '../src/audio/audio-playback-queue.js';

vi.mock('../src/core/game-state.js', () => ({
    gameState: {
        ui: { activeScreenId: 'default' },
        audio: { policies: null }
    }
}));

vi.mock('../src/audio/audio-playback-queue.js', () => ({
    AudioPlaybackQueue: {
        play: vi.fn(),
        playFile: vi.fn(),
        addToQueue: vi.fn(),
        skip: vi.fn()
    }
}));

vi.mock('../src/audio/audio-decision-engine.js', () => ({
    AudioDecisionEngine: {
        decide: vi.fn(() => ({ id: 'mock-asset', file: 'mock.mp3' })),
        rank: vi.fn(() => [])
    }
}));

describe('AudioBridge - triggerManualAudio', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        gameState.ui.activeScreenId = 'match-screen'; // Perfil padrão agora
        gameState.audio.policies = null;
        SoundManager.isPlaying = false;
    });

    it('should play manual audio with priority 10', () => {
        triggerManualAudio('nba');
        expect(SoundManager.play).toHaveBeenCalledWith('nba', 10);
    });

    it('should block manual audio if explicitly in blockedCategories', () => {
        gameState.audio.policies = {
            'match-screen': {
                name: 'Mesa de Jogo',
                blockedCategories: ['musica'],
                manualPriority: true
            }
        };
        
        triggerManualAudio('musica');
        expect(SoundManager.play).not.toHaveBeenCalled();
    });

    it('should skip current audio if manualPriority is true and something is playing', () => {
        gameState.audio.policies = {
            'match-screen': {
                name: 'Mesa de Jogo',
                blockedCategories: [],
                manualPriority: true
            }
        };
        SoundManager.isPlaying = true;
        
        triggerManualAudio('cesta');
        expect(SoundManager.skip).toHaveBeenCalled();
        expect(SoundManager.play).toHaveBeenCalledWith('cesta', 10);
    });

    it('should NOT skip if manualPriority is false', () => {
        gameState.audio.policies = {
            'match-screen': {
                name: 'Mesa de Jogo',
                blockedCategories: [],
                manualPriority: false
            }
        };
        SoundManager.isPlaying = true;
        
        triggerManualAudio('cesta');
        expect(SoundManager.skip).not.toHaveBeenCalled();
    });
});

describe('AudioBridge - triggerAudio (Automatic)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        gameState.ui.activeScreenId = 'match-screen';
        gameState.audio.policies = {
            'match-screen': {
                name: 'Mesa de Jogo',
                allowAutomaticAudio: true,
                scoreCategories: { 1: 'errou', 2: 'nba', 3: 'cesta' },
                blockedCategories: []
            }
        };
        // Setup engine rules in state
        gameState.audio.scoringRules = {
            context: { scoreMade: {}, shotMissed: {}, periodEnd: {}, gameEnd: {}, foulPersonal: {}, timeout: {} },
            recency: {},
            intensity: {}
        };
    });

    it('should resolve the correct category and use engine to addToQueue', () => {
        triggerAudio('score', { value: 1 });
        expect(SoundManager.addToQueue).toHaveBeenCalledWith('errou', expect.any(String), 5, expect.any(String));

        triggerAudio('score', { value: 2 });
        expect(SoundManager.addToQueue).toHaveBeenCalledWith('nba', expect.any(String), 5, expect.any(String));
    });

    it('should block automatic audio if allowAutomaticAudio is false', () => {
        gameState.audio.policies['match-screen'].allowAutomaticAudio = false;
        triggerAudio('score', { value: 3 });
        expect(SoundManager.addToQueue).not.toHaveBeenCalled();
    });

    it('should resolve eventCategories and use engine', () => {
        gameState.audio.policies['match-screen'].eventCategories = {
            'posse_24': 'posse',
            'foul': 'erro',
            'timeout': 'torcida'
        };

        triggerAudio('posse_24');
        expect(SoundManager.addToQueue).toHaveBeenCalledWith('posse', expect.any(String), 5, expect.any(String));

        triggerAudio('foul');
        expect(SoundManager.addToQueue).toHaveBeenCalledWith('erro', expect.any(String), 5, expect.any(String));

        triggerAudio('timeout');
        expect(SoundManager.addToQueue).toHaveBeenCalledWith('torcida', expect.any(String), 5, expect.any(String));
    });

    it('should resolve countdown events correctly', () => {
        gameState.audio.policies['match-screen'].eventCategories = {
            'countdown_1m': 'musica',
            'countdown_10s': 'nba'
        };

        triggerAudio('countdown_1m');
        expect(SoundManager.addToQueue).toHaveBeenCalledWith('musica', expect.any(String), 5, expect.any(String));

        triggerAudio('countdown_10s');
        expect(SoundManager.addToQueue).toHaveBeenCalledWith('nba', expect.any(String), 5, expect.any(String));
    });

    it('should use default fallback (buzina) for time events', () => {
        gameState.audio.policies['match-screen'].eventCategories = {};
        
        triggerAudio('period_end');
        expect(SoundManager.addToQueue).toHaveBeenCalledWith('buzina', expect.any(String), 5, expect.any(String));

        triggerAudio('game_end');
        expect(SoundManager.addToQueue).toHaveBeenCalledWith('buzina', expect.any(String), 5, expect.any(String));
    });
});
