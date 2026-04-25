// src/audio/audio-bridge.js
import { gameState } from '../core/game-state.js';
import { INITIAL_AUDIO_PROFILES } from './audio-profiles.js';
import { AudioPlaybackQueue as SoundManager } from './audio-playback-queue.js';

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

  // Regra 2: Resolução de categoria
  const category = resolveCategoryForEvent(eventName, payload, profile, source);
  if (!category) return null;

  // Regra 3: Bloqueios específicos por categoria na tela (Blacklist)
  if (profile.blockedCategories && profile.blockedCategories.includes(category)) {
    return null;
  }
  
  // Disparo real
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
