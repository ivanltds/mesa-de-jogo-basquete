import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';

// Note: We are using the global JSDOM provided by Vitest (environment: 'jsdom')

const htmlPath = path.resolve(__dirname, '../mesa-de-jogo/index.html');
const html = fs.readFileSync(htmlPath, 'utf8');

// We import the modules directly
import { gameState } from '../src/core/game-state.js';
import { GameEngine } from '../src/core/game-engine.js';
import { ClockEngine } from '../src/core/clock-engine.js';
import { AudioPlaybackQueue as SoundManager } from '../src/audio/audio-playback-queue.js';
import { UIManager } from '../src/ui/ui-manager.js';
import { EVENT_TYPES } from '../src/core/event-types.js';
import { 
    addPoints, addFoul, addTimeout, revertEvent, 
    openSubModal, selectSubPlayer, togglePossession, 
    nextPeriod, saveState, loadState 
} from '../src/app/bootstrap.js';
import * as Dispatcher from '../src/core/event-dispatcher.js';

describe('FIBA Digital Scoreboard - Suíte Completa de Estabilização', () => {
    
    beforeEach(async () => {
        // Reset DOM
        document.body.innerHTML = `<div id="app">${html}</div>`;
        
        // Mock global de Audio
        window.Audio = class {
            constructor() {
                this.onended = null;
            }
            play() { return Promise.resolve(); }
            pause() {}
        };

        // Mock localStorage
        const storage = {};
        vi.spyOn(window.localStorage, 'getItem').mockImplementation(key => storage[key] || null);
        vi.spyOn(window.localStorage, 'setItem').mockImplementation((key, value) => storage[key] = value.toString());
        vi.spyOn(window.localStorage, 'removeItem').mockImplementation(key => delete storage[key]);
        vi.spyOn(window.localStorage, 'clear').mockImplementation(() => Object.keys(storage).forEach(key => delete storage[key]));

        // Import bootstrap to set up window functions and listeners
        // We use a dynamic import to ensure it runs after DOM is set up
        // However, since it's a module, it only runs once. 
        // So we manually expose what we need or re-run initialization logic if needed.
        
        // For compatibility with the test, we ensure these are on window
        window.gameState = gameState;
        window.GameEngine = GameEngine;
        window.ClockEngine = ClockEngine;
        window.UIManager = UIManager;
        window.SoundManager = SoundManager;
        window.notify = vi.fn();
        
        // Expose functions to window for onclick handlers in HTML
        window.addPoints = addPoints;
        window.addFoul = addFoul;
        window.addTimeout = addTimeout;
        window.revertEvent = revertEvent;
        window.openSubModal = openSubModal;
        window.selectSubPlayer = selectSubPlayer;
        window.togglePossession = togglePossession;
        window.nextPeriod = nextPeriod;
        window.saveState = saveState;
        window.loadState = loadState;

        // Reset SoundManager
        SoundManager.queue = [];
        SoundManager.currentItem = null;
        SoundManager.isPlaying = false;
        if (SoundManager.currentAudio) {
            SoundManager.currentAudio.pause();
            SoundManager.currentAudio = null;
        }

        // Mocks de UI para isolar lógica
        vi.spyOn(UIManager, 'updateScoreboard').mockImplementation(() => {});
        vi.spyOn(UIManager, 'renderSoundQueue').mockImplementation(() => {});
        vi.spyOn(UIManager, 'renderSoundboard').mockImplementation(() => {});
        vi.spyOn(UIManager, 'updateClocks').mockImplementation(() => {});
        vi.spyOn(UIManager, 'renderPlayerList').mockImplementation(() => {});

        // Setup básico de jogadores para os testes
        gameState.teams.home.players = [
            { number: '10', name: 'Player 10', fouls: 0, points: 0, inCourt: true },
            { number: '11', name: 'Player 11', fouls: 0, points: 0, inCourt: false }
        ];
        gameState.teams.away.players = [
            { number: '20', name: 'Player 20', fouls: 0, points: 0, inCourt: true }
        ];
        gameState.teams.home.score = 0;
        gameState.teams.away.score = 0;
        gameState.events = [];
        gameState.isActive = false;
        gameState.period = 1;
        gameState.clock = 600000;
        gameState.shotClock = 24000;

        // Load the bootstrap logic manually if needed, or just import it once
        await import('../src/app/bootstrap.js');
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('Fase 2: Core e Regras FIBA', () => {
        it('2.1 deve adicionar pontos corretamente a um jogador e ao time', () => {
            window.addPoints('home', '10', 3);
            expect(gameState.teams.home.score).toBe(3);
            expect(gameState.teams.home.players[0].points).toBe(3);
        });

        it('2.2 deve contar faltas e disparar exclusão com 5 faltas', () => {
            for(let i=0; i<5; i++) window.addFoul('home', '10');
            expect(gameState.teams.home.players[0].fouls).toBe(5);
            expect(window.notify).toHaveBeenCalledWith(expect.stringContaining("EXCLUÍDO"), 'error');
        });
    });

    describe('Fase 3: Sistema de Auditoria (Undo/Redo)', () => {
        it('3.1 deve reverter um evento de pontos corretamente', () => {
            window.addPoints('home', '10', 2);
            const eventId = gameState.events[0].id;
            window.revertEvent(eventId);
            expect(gameState.teams.home.score).toBe(0);
            expect(gameState.events[0].reverted).toBe(true);
        });

        it('3.2 deve restaurar um evento revertido', () => {
            window.addPoints('home', '10', 2);
            const eventId = gameState.events[0].id;
            window.revertEvent(eventId); // Reverte
            window.revertEvent(eventId); // Restaura
            expect(gameState.teams.home.score).toBe(2);
            expect(gameState.events[0].reverted).toBe(false);
        });
    });

    describe('Fase 4: Cronometragem e 24s', () => {
        it('4.1 deve alternar o estado do cronômetro (Start/Pause)', () => {
            ClockEngine.toggle();
            expect(gameState.isActive).toBe(true);
            ClockEngine.toggle();
            expect(gameState.isActive).toBe(false);
        });

        it('4.2 deve resetar o shot clock para 24s e 14s', () => {
            ClockEngine.resetShotClock(24000);
            expect(gameState.shotClock).toBe(24000);
            ClockEngine.resetShotClock(14000);
            expect(gameState.shotClock).toBe(14000);
        });
    });

    describe('Fase 5: Rotação e Substituições', () => {
        it('5.1 deve realizar uma substituição e atualizar o estado de quadra', () => {
            window.openSubModal('home', '10');
            window.selectSubPlayer('in', '11');
            
            expect(gameState.teams.home.players[0].inCourt).toBe(false); // #10 saiu
            expect(gameState.teams.home.players[1].inCourt).toBe(true);  // #11 entrou
        });

        it('5.2 deve bloquear abertura de modal de SUB com bola viva', () => {
            gameState.isActive = true; // Bola viva
            window.openSubModal('home', '10');
            expect(window.notify).toHaveBeenCalledWith(expect.stringContaining("bola morta"), 'error');
        });
    });

    describe('Fase 6: Sistema de Áudio e DJ Arena', () => {
        it('6.1 deve selecionar um som aleatório da categoria e adicionar à fila', () => {
            SoundManager.play('cesta');
            // It might be in currentItem if queue was empty
            const item = SoundManager.currentItem || SoundManager.queue[0];
            expect(item).toBeDefined();
            expect(item.category).toBe('cesta');
        });

        it('6.2 deve pular o áudio atual corretamente', () => {
            SoundManager.play('cesta');
            SoundManager.play('toco');
            SoundManager.skip();
            // skip() clears currentItem and shifts queue
            // So 'toco' should now be in currentItem
            expect(SoundManager.currentItem).toBeDefined();
            expect(SoundManager.currentItem.category).toBe('toco');
        });

        it('6.3 deve disparar um som específico por nome de arquivo', () => {
            const testFile = "Buzina.mp3";
            SoundManager.playFile(testFile);
            const item = SoundManager.currentItem || SoundManager.queue[0];
            expect(item).toBeDefined();
            expect(item.file).toBe(testFile);
        });
    });

    describe('Fase 7: Persistência de Dados (Safety)', () => {
        it('deve salvar o estado no localStorage e recuperar após recarregamento', () => {
            window.gameState.teams.home.score = 50;
            if (window.saveState) window.saveState();

            window.gameState.teams.home.score = 0;
            if (window.loadState) window.loadState();

            expect(window.gameState.teams.home.score).toBe(50);
        });
    });
    
    describe('Fase 8: Seta de Posse Alternada', () => {
        it('deve alternar a direção da posse corretamente', () => {
            expect(window.gameState.possession).toBeDefined();
            
            const initial = window.gameState.possession;
            window.togglePossession();
            
            if (initial === 'home') {
                expect(window.gameState.possession).toBe('away');
            } else {
                expect(window.gameState.possession).toBe('home');
            }
        });
    });

    describe('Fase 9: Automação de Overtime e Fim de Jogo', () => {
        it('deve entrar em Overtime (OT) se houver empate ao fim do 4º período', () => {
            window.gameState.period = 4;
            window.gameState.clock = 0;
            window.gameState.teams.home.score = 80;
            window.gameState.teams.away.score = 80;
            
            window.nextPeriod();
            
            expect(window.gameState.period).toBe('OT');
            expect(window.gameState.clock).toBe(300000); // 5 min
        });

        it('deve encerrar o jogo e mostrar modal se não houver empate no 4º período', () => {
            window.gameState.period = 4;
            window.gameState.clock = 0;
            window.gameState.teams.home.score = 85;
            window.gameState.teams.away.score = 80;
            
            const spy = vi.spyOn(window.UIManager, 'showVictoryModal');
            window.nextPeriod();
            
            expect(spy).toHaveBeenCalledWith('home');
        });
    });
    describe('Fase 10: Novas Regras FIBA 2024 (Game Flow)', () => {
        it('10.1 deve pausar relógio, resetar 24s e mudar posse ao fazer cesta', () => {
            window.gameState.isActive = true;
            window.gameState.possession = 'home';
            
            window.addPoints('home', '10', 2);
            
            expect(window.gameState.isActive).toBe(false); // Pausado
            expect(window.gameState.shotClock).toBe(24000); // Reseta 24s
            expect(window.gameState.possession).toBe('away'); // Mudou posse
        });

        it('10.2 deve startar o relógio ao resetar 24s manualmente', () => {
            window.gameState.isActive = false;
            ClockEngine.resetShotClock(24000, true);
            expect(window.gameState.isActive).toBe(true);
        });

        it('10.3 deve startar o relógio ao resetar 14s (Rebote OF) manualmente', () => {
            window.gameState.isActive = false;
            ClockEngine.resetShotClock(14000, true);
            expect(window.gameState.isActive).toBe(true);
        });

        it('10.4 não deve disparar áudio de posse ao fazer cesta (reset silencioso)', () => {
            const spy = vi.spyOn(Dispatcher, 'dispatchGameEvent');
            
            window.addPoints('home', '10', 2);
            
            const calls = spy.mock.calls.map(c => c[0]);
            expect(calls).toContain(EVENT_TYPES.SCORE_MADE);
            expect(calls).not.toContain('posse_24');
            
            spy.mockRestore();
        });

        it('10.5 deve disparar áudio de posse ao resetar 24s manualmente', () => {
            const spy = vi.spyOn(Dispatcher, 'dispatchGameEvent');
            
            ClockEngine.resetShotClock(24000, false, false);
            
            expect(spy).toHaveBeenCalledWith('posse_24', expect.anything());
            
            spy.mockRestore();
        });
    });
});
