// src/core/clock-engine.js
import { gameState } from './game-state.js';
import { AudioPlaybackQueue as SoundManager } from '../audio/audio-playback-queue.js';
import { dispatchGameEvent } from './event-dispatcher.js';
import { EVENT_TYPES } from './event-types.js';

export const ClockEngine = {
    timer: null,
    start() {
        if (gameState.isActive) return;
        gameState.isActive = true;
        this.timer = setInterval(() => {
            if (gameState.clock > 0) {
                gameState.clock -= 100;
                gameState.shotClock -= 100;
                if (gameState.shotClock <= 0) {
                    this.stop();
                    dispatchGameEvent(EVENT_TYPES.SHOT_CLOCK_VIOLATION, {
                        message: "ESTOURO DE 24s!",
                        icon: "⏰"
                    });
                    window.notify("ESTOURO DE 24s!", "error");
                }
                window.UIManager.updateClocks();
            } else {
                this.stop();
                dispatchGameEvent(EVENT_TYPES.PERIOD_END, {
                    message: `FIM DO PERÍODO ${gameState.period}`,
                    icon: "🏁"
                });
                window.notify("FIM DE PERÍODO!");
            }
        }, 100);
    },
    stop() {
        gameState.isActive = false;
        clearInterval(this.timer);
        window.UIManager.updateClocks();
    },
    toggle() {
        gameState.isActive ? ClockEngine.stop() : ClockEngine.start();
    },
    resetShotClock(time = 24000) {
        gameState.shotClock = time;
        window.UIManager.updateClocks();
    },
    setTestTime() {
        gameState.clock = 10000;
        window.UIManager.updateClocks();
        window.notify("MODO TESTE: Tempo definido para 10s");
    }
};
