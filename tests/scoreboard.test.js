import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { JSDOM } from 'jsdom';

const html = fs.readFileSync(path.resolve(__dirname, '../mesa-de-jogo/index.html'), 'utf8');
const jsCode = fs.readFileSync(path.resolve(__dirname, '../main.js'), 'utf8');

describe('FIBA Digital Scoreboard - Suíte Completa de Estabilização', () => {
    let dom;
    let window;
    let document;
    let gameState;
    let GameEngine;
    let ClockEngine;
    let SoundManager;

    beforeEach(() => {
        dom = new JSDOM(html, { runScripts: "dangerously", resources: "usable" });
        window = dom.window;
        document = window.document;
        
        // Mock global de Audio
        window.Audio = class {
            constructor() {
                this.play = vi.fn().mockResolvedValue();
                this.pause = vi.fn();
                this.onended = null;
            }
        };

        // Injeção síncrona via eval
        window.eval(jsCode);

        gameState = window.gameState;
        GameEngine = window.GameEngine;
        ClockEngine = window.ClockEngine;
        SoundManager = window.SoundManager;
        window.notify = vi.fn();

        // Mocks de UI para isolar lógica
        window.UIManager.updateScoreboard = vi.fn();
        window.UIManager.renderSoundQueue = vi.fn();
        window.UIManager.renderSoundboard = vi.fn();
        window.UIManager.updateClocks = vi.fn();
        
        // Impedir execução real de processQueue globalmente
        vi.spyOn(SoundManager, 'processQueue').mockImplementation(() => {});
        
        // Setup básico de jogadores para os testes
        gameState.teams.home.players = [
            { number: '10', name: 'Player 10', fouls: 0, points: 0, inCourt: true },
            { number: '11', name: 'Player 11', fouls: 0, points: 0, inCourt: false }
        ];
        gameState.teams.away.players = [
            { number: '20', name: 'Player 20', fouls: 0, points: 0, inCourt: true }
        ];
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

        it('2.3 deve sinalizar bônus de equipe após a 4ª falta', () => {
            for(let i=0; i<4; i++) window.addFoul('home', '10');
            expect(gameState.teams.home.fouls).toBe(4);
            // O bônus é visual, validamos a lógica de contagem
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
            // Setup subState
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
            expect(SoundManager.queue).toHaveLength(1);
            expect(SoundManager.queue[0].category).toBe('cesta');
        });

        it('6.2 deve pular o áudio atual corretamente', () => {
            SoundManager.play('cesta');
            SoundManager.play('toco');
            SoundManager.skip();
            expect(SoundManager.queue).toHaveLength(1);
            expect(SoundManager.queue[0].category).toBe('toco');
        });

        it('6.3 deve disparar um som específico por nome de arquivo', () => {
            const testFile = "Buzina.mp3";
            SoundManager.playFile(testFile);
            expect(SoundManager.queue[0].file).toBe(testFile);
        });
    });
});
