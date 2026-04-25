// src/audio/audio-profiles.js

export const INITIAL_AUDIO_PROFILES = {
  'match-screen': {
    name: 'Mesa de Jogo',
    allowAutomaticAudio: true,
    manualPriority: true,
    scoreCategories: { 1: 'cesta', 2: 'cesta', 3: 'cesta' },
    eventCategories: {
      'posse_24': 'posse',
      'posse_14': 'posse',
      'foul': 'buzina',
      'sub': null,
      'timeout': 'buzina',
      'period_end': 'buzina',
      'countdown_1m': null,
      'countdown_24s': 'buzina',
      'countdown_10s': null,
      'game_end': 'buzina'
    },
    blockedCategories: ['musica']
  },

  'soundboard-screen': {
    name: 'Mesa de Som',
    allowAutomaticAudio: false,
    manualPriority: true,
    scoreCategories: { 1: null, 2: null, 3: null },
    eventCategories: {
      'posse_24': null,
      'posse_14': null,
      'foul': null,
      'sub': null,
      'timeout': null,
      'period_end': null,
      'countdown_1m': null,
      'countdown_24s': null,
      'countdown_10s': null,
      'game_end': null
    },
    blockedCategories: []
  }
};
