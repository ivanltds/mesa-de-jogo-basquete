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
        gameState.lastUpdate = Date.now();
        this.timer = setInterval(() => {
            gameState.lastUpdate = Date.now();
            
            // If timeout is active, countdown the timeout clock
            if (gameState.isTimeoutActive) {
                if (gameState.timeoutClock > 0) {
                    gameState.timeoutClock -= 100;
                } else {
                    gameState.isTimeoutActive = false;
                    window.notify("TEMPO ENCERRADO!");
                    dispatchGameEvent(EVENT_TYPES.TIMEOUT_END, { message: "FIM DO TEMPO", icon: "⌛" });
                }
                window.UIManager.updateClocks();
                return;
            }

            if (gameState.clock > 0) {
                gameState.clock -= 100;
                gameState.shotClock -= 100;

                // Check Countdowns in last period (4 or OT)
                if (gameState.period >= 4 || String(gameState.period).includes('OT')) {
                    const milestones = [
                        { time: 60000, type: EVENT_TYPES.COUNTDOWN_1M, label: "1 MINUTO" },
                        { time: 24000, type: EVENT_TYPES.COUNTDOWN_24S, label: "24 SEGUNDOS" },
                        { time: 10000, type: EVENT_TYPES.COUNTDOWN_10S, label: "10 SEGUNDOS" }
                    ];

                    milestones.forEach(m => {
                        if (gameState.clock <= m.time && !gameState.firedCountdowns.includes(m.type)) {
                            gameState.firedCountdowns.push(m.type);
                            dispatchGameEvent(m.type, {
                                message: `${m.label} RESTANTES!`,
                                icon: "⏳"
                            });
                        }
                    });
                }

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
                gameState.firedCountdowns = []; // Reset para o próximo período
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
        gameState.lastUpdate = Date.now();
        clearInterval(this.timer);
        window.UIManager.updateClocks();
    },
    toggle() {
        gameState.isActive ? ClockEngine.stop() : ClockEngine.start();
    },
    resetShotClock(time = 24000, startClock = false, silent = false) {
        gameState.shotClock = time;
        if (startClock) this.start();
        window.UIManager.updateClocks();
        
        if (silent) return;
        
        // Dispara evento para áudio
        const eventType = time === 24000 ? 'posse_24' : 'posse_14';
        dispatchGameEvent(eventType, {
            message: `REINICIO ${time/1000}s`,
            icon: "⏱️",
            value: time/1000
        });
    },
    setTestTime() {
        gameState.clock = 10000;
        window.UIManager.updateClocks();
        window.notify("MODO TESTE: Tempo definido para 10s");
    }
};
