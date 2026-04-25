// src/audio/audio-scoring-rules.js

/**
 * Default rules and weights for the Audio Decision Engine.
 * This object defines how each asset is ranked for a given game event.
 */
export const DEFAULT_AUDIO_SCORING_RULES = {
  context: {
    scoreMade: {
      threePointBonus: 2,
      closeGameBonus: 2,
      clutchTagBonus: 10
    },
    shotMissed: {
      funTagBonus: 1
    },
    timeout: {
      officialTagBonus: 20
    },
    periodEnd: {
      officialTagBonus: 20
    },
    gameEnd: {
      officialTagBonus: 20
    },
    foulPersonal: {
      regularFoulPenalty: -100,
      exclusionOfficialBonus: 20
    }
  },
  recency: {
    noRepeatBonus: 5,
    repeatPenaltyPerOccurrence: -10,
    recentWindow: 10
  },
  intensity: {
    highIntensityPeriodEndBonus: 10,
    lowIntensityPeriodEndPenalty: -5,
    highIntensityClutchBonus: 5,
    mediumIntensityDefaultBonus: 2
  }
};
