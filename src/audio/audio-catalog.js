// src/audio/audio-catalog.js
import { EVENT_TYPES } from '../core/event-types.js';

export const AUDIO_CATALOG = [
    // CESTA
    { id: 'score_1', file: 'cesta (10).mp3', eventTypes: [EVENT_TYPES.SCORE_MADE], tags: ['score'], intensity: 3, cooldownMs: 30000, enabled: true },
    { id: 'score_2', file: 'cesta (2).mp3', eventTypes: [EVENT_TYPES.SCORE_MADE], tags: ['score'], intensity: 2, cooldownMs: 30000, enabled: true },
    { id: 'score_3', file: 'cesta (3).mp3', eventTypes: [EVENT_TYPES.SCORE_MADE], tags: ['score'], intensity: 3, cooldownMs: 30000, enabled: true },
    { id: 'score_clutch_1', file: 'cesta-11.mp3', eventTypes: [EVENT_TYPES.SCORE_MADE], tags: ['score', 'clutch'], intensity: 5, cooldownMs: 60000, enabled: true },
    { id: 'score_clutch_2', file: 'cesta-10.mp3', eventTypes: [EVENT_TYPES.SCORE_MADE], tags: ['score', 'clutch'], intensity: 5, cooldownMs: 60000, enabled: true },
    
    // ERROU
    { id: 'miss_1', file: 'errou (2).mp3', eventTypes: [EVENT_TYPES.SHOT_MISSED], tags: ['miss'], intensity: 1, cooldownMs: 20000, enabled: true },
    { id: 'miss_2', file: 'errou (3).mp3', eventTypes: [EVENT_TYPES.SHOT_MISSED], tags: ['miss'], intensity: 2, cooldownMs: 20000, enabled: true },
    { id: 'miss_fun_1', file: 'errou-1.mp3', eventTypes: [EVENT_TYPES.SHOT_MISSED], tags: ['miss', 'fun'], intensity: 2, cooldownMs: 40000, enabled: true },

    // BUZINA
    { id: 'buzzer_official', file: 'Buzina.mp3', eventTypes: [EVENT_TYPES.PERIOD_END, EVENT_TYPES.SHOT_CLOCK_VIOLATION, EVENT_TYPES.GAME_END, EVENT_TYPES.TIMEOUT], tags: ['official'], intensity: 5, cooldownMs: 0, enabled: true },

    // POSSE
    { id: 'possession_1', file: 'posse-1.mp3', eventTypes: [EVENT_TYPES.TURNOVER], tags: ['possession'], intensity: 2, cooldownMs: 15000, enabled: true },
    { id: 'possession_2', file: 'posse-2.mp3', eventTypes: [EVENT_TYPES.TURNOVER], tags: ['possession'], intensity: 2, cooldownMs: 15000, enabled: true },

    // NBA / HYPE
    { id: 'nba_1', file: 'nba (2).mp3', eventTypes: [EVENT_TYPES.SCORE_MADE], tags: ['nba', 'hype'], intensity: 4, cooldownMs: 60000, enabled: true },
    { id: 'nba_2', file: 'nba.mp3', eventTypes: [EVENT_TYPES.SCORE_MADE], tags: ['nba', 'hype'], intensity: 4, cooldownMs: 60000, enabled: true },

    // DIVERTIDO
    { id: 'fun_1', file: 'divertido.mp3', eventTypes: [EVENT_TYPES.SCORE_MADE, EVENT_TYPES.SHOT_MISSED], tags: ['fun'], intensity: 3, cooldownMs: 60000, enabled: true },

    // MUSICA
    { id: 'music_1', file: 'musica- Bow Basketball.mp3', eventTypes: [EVENT_TYPES.PERIOD_START], tags: ['music'], intensity: 3, cooldownMs: 0, enabled: true }
];

// Helper to get legacy catalog mapping
export const LEGACY_CATALOG = {
    cesta: ["cesta (10).mp3", "cesta (2).mp3", "cesta (3).mp3", "cesta (4).mp3", "cesta (5).mp3", "cesta (6).mp3", "cesta (7).mp3", "cesta (8).mp3", "cesta (9).mp3", "cesta- (2).mp3", "cesta- (3).mp3", "cesta-.mp3", "cesta-1.mp3", "cesta-10.mp3", "cesta-11.mp3", "cesta-12.mp3", "cesta-13.mp3", "cesta-14.mp3", "cesta-15.mp3", "cesta-3.mp3", "cesta-4.mp3", "cesta-5.mp3", "cesta-6.mp3", "cesta-7.mp3", "cesta-8.mp3", "cesta-9.mp3", "cesta.mp3"],
    errou: ["errou (2).mp3", "errou (3).mp3", "errou (4).mp3", "errou-.mp3", "errou-1.mp3", "errou-2.mp3", "errou-3.mp3", "errou-4.mp3", "errou-5.mp3", "errou-6.mp3", "errou-7.mp3", "errou-8.mp3", "errou-9.mp3", "errou.mp3", "errou].mp3"],
    divertido: ["divertido (10).mp3", "divertido (11).mp3", "divertido (2).mp3", "divertido (3).mp3", "divertido (4).mp3", "divertido (5).mp3", "divertido (6).mp3", "divertido (7).mp3", "divertido (8).mp3", "divertido (9).mp3", "divertido.mp3"],
    esquisito: ["esquisito-.mp3", "esquisito-1.mp3", "esquisito-2.mp3", "esquisito-3.mp3", "esquisito-4.mp3", "esquisito.mp3"],
    toco: ["toco (2).mp3", "toco (3).mp3", "toco (4).mp3", "toco (5).mp3", "toco (6).mp3", "toco (7).mp3", "toco-.mp3", "toco-1.mp3", "toco.mp3"],
    posse: ["posse-1.mp3", "posse-2.mp3", "posse-3.mp3", "posse-4.mp3", "posse-5.mp3", "posse-6.mp3", "posse-7.mp3", "posse-8.mp3", "posse.mp3"],
    nba: ["nba (2).mp3", "nba (3).mp3", "nba (4).mp3", "nba(1).mp3", "nba.mp3"],
    torcida: ["torcida (2).mp3", "torcida (3).mp3", "torcida.mp3"],
    buzina: ["Buzina.mp3"],
    musica: ["musica- Bow Basketball.mp3", "musica- Can't Hold Us.mp3", "musica- I Believe I Can Fly.mp3", "musica- O JOGO É SÉRIO.mp3", "musica-Hino Nacional Brasileiro.mp3"]
};
