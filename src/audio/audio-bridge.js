// src/audio/audio-bridge.js
import { gameState } from '../core/game-state.js';
import { INITIAL_AUDIO_PROFILES } from './audio-profiles.js';
import { AudioPlaybackQueue as SoundManager } from './audio-playback-queue.js';
import { AudioDecisionEngine } from './audio-decision-engine.js';
import { AUDIO_CATALOG } from './audio-catalog.js';
import { EVENT_TYPES } from '../core/event-types.js';

function getProfile(screenId) {
  const policies = gameState.audio?.policies || INITIAL_AUDIO_PROFILES;
  return policies[screenId] || policies['match-screen'] || Object.values(policies)[0];
}

export function resolveCategoryForEvent(eventName, payload, profile, source) {
  if (source === 'manual' && payload.category) {
    return payload.category;
  }

  switch (eventName) {
    case 'score':
      return profile.scoreCategories?.[payload.value] ?? 'cesta';

    case 'posse_24':
    case 'posse_14':
    case 'foul':
    case 'sub':
    case 'timeout':
    case 'period_end':
    case 'countdown_1m':
    case 'countdown_24s':
    case 'countdown_10s':
    case 'game_end':
      return profile.eventCategories?.[eventName] ?? (['timeout', 'period_end', 'game_end', 'countdown_24s'].includes(eventName) ? 'buzina' : null);

    case 'period-end':
    case 'shotclock-violation':
    case 'game-end':
    case 'buzzer':
      return 'buzina';

    case 'manual-posse':
      return 'posse';

    case 'manual-fun':
      return 'divertido';

    case 'manual-nba':
      return 'nba';

    case 'manual-crowd':
      return 'torcida';

    case 'manual-music':
      return 'musica';

    default:
      return null;
  }
}

export function triggerAudio(eventName, payload = {}, options = {}) {
  const screenId = gameState.ui?.activeScreenId || 'default';
  const profile = getProfile(screenId);
  const source = options.source || 'automatic';

  // Regra 1: Bloqueio de áudio automático por tela
  if (source === 'automatic' && !profile.allowAutomaticAudio) {
    return null;
  }

  // Regra 2: Resolução de categoria (para filtros de blacklist)
  const category = resolveCategoryForEvent(eventName, payload, profile, source);
  if (!category) return null;

  // Regra 3: Bloqueios específicos por categoria na tela (Blacklist)
  if (profile.blockedCategories && profile.blockedCategories.includes(category)) {
    return null;
  }
  
  // Disparo inteligente via Engine
  if (source === 'automatic') {
    // Mapeia eventName de volta para EVENT_TYPES
    let eventType = null;
    if (eventName === 'score') eventType = EVENT_TYPES.SCORE_MADE;
    else if (eventName === 'timeout') eventType = EVENT_TYPES.TIMEOUT;
    else if (eventName === 'foul') eventType = EVENT_TYPES.FOUL_PERSONAL;
    else if (eventName === 'sub') eventType = EVENT_TYPES.SUBSTITUTION;
    else if (eventName === 'posse_24') eventType = EVENT_TYPES.POSSE_24;
    else if (eventName === 'posse_14') eventType = EVENT_TYPES.POSSE_14;
    else if (eventName === 'period_end') eventType = EVENT_TYPES.PERIOD_END;
    else if (eventName === 'countdown_1m') eventType = EVENT_TYPES.COUNTDOWN_1M;
    else if (eventName === 'countdown_24s') eventType = EVENT_TYPES.COUNTDOWN_24S;
    else if (eventName === 'countdown_10s') eventType = EVENT_TYPES.COUNTDOWN_10S;
    else if (eventName === 'game_end') eventType = EVENT_TYPES.GAME_END;

    if (eventType) {
      const chosenAsset = AudioDecisionEngine.decide({
        event: { type: eventType, payload },
        state: gameState,
        catalog: AUDIO_CATALOG,
        rules: gameState.audio.scoringRules
      });

      if (chosenAsset) {
        SoundManager.addToQueue(category, chosenAsset.file, 5, chosenAsset.id);
        return category;
      }
    }
  }

  // Fallback ou Manual
  const priority = source === 'manual' ? 10 : 5;
  
  // Se for manual e tiver prioridade, corta o que estiver tocando
  if (source === 'manual' && profile.manualPriority && SoundManager.isPlaying) {
    SoundManager.skip();
  }

  SoundManager.play(category, priority);
  return category;
}

export function triggerManualAudio(category, filename = null) {
  const screenId = gameState.ui?.activeScreenId || 'default';
  const profile = getProfile(screenId);

  if (profile.blockedCategories && profile.blockedCategories.includes(category)) {
    return;
  }

  // Se tiver prioridade manual, corta o audio atual
  if (profile.manualPriority && SoundManager.isPlaying) {
    SoundManager.skip();
  }

  const priority = 10;

  if (filename) {
    // Nota: SoundManager.playFile precisaria ser atualizado para aceitar priority
    // Por enquanto usamos a lógica de fila padrão
    const files = SoundManager.library[category];
    if (files && files.includes(filename)) {
        SoundManager.addToQueue(category, filename, priority);
    } else {
        SoundManager.playFile(filename); // Fallback
    }
    return;
  }

  SoundManager.play(category, priority);
}
