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
        dom = new JSDOM(html, { runScripts: "dangerously", resources: "usable", url: "http://localhost" });
        window = dom.window;
        document = window.document;
        
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

        // Injeção síncrona via eval
        window.eval(jsCode);
        window.document.dispatchEvent(new window.Event('DOMContentLoaded'));

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

        it('6.4 deve disparar a categoria correta ao clicar nos botões da mesa', () => {
            const spy = vi.spyOn(window.SoundManager, 'play');
            const skipSpy = vi.spyOn(window.SoundManager, 'skip');

            document.getElementById('mystery-btn').click();
            expect(spy).toHaveBeenCalledWith('esquisito');

            document.getElementById('fun-btn').click();
            expect(spy).toHaveBeenCalledWith('divertido');

            document.getElementById('nba-btn').click();
            expect(spy).toHaveBeenCalledWith('nba');

            document.getElementById('torcida-btn').click();
            expect(spy).toHaveBeenCalledWith('torcida');

            document.getElementById('musica-btn').click();
            expect(spy).toHaveBeenCalledWith('musica');

            document.getElementById('skip-audio-btn').click();
            expect(skipSpy).toHaveBeenCalled();
        });

        it('6.5 deve interromper o áudio atual e avançar ao pular', async () => {
            // Mock de play para demorar um pouco (simulando áudio longo)
            const playSpy = vi.spyOn(window.Audio.prototype, 'play').mockImplementation(() => new Promise(res => setTimeout(res, 100)));
            const pauseSpy = vi.spyOn(window.Audio.prototype, 'pause');

            SoundManager.play('buzina'); // Audio 1
            SoundManager.play('buzina'); // Audio 2
            
            expect(SoundManager.queue.length).toBe(2);

            // Pula o primeiro
            SoundManager.skip();

            expect(pauseSpy).toHaveBeenCalled();
            expect(SoundManager.queue.length).toBe(1);
            
            // Limpa spies
            playSpy.mockRestore();
            pauseSpy.mockRestore();
        });
    });

    describe('Fase 7: Persistência de Dados (Safety)', () => {
        it('deve salvar o estado no localStorage e recuperar após recarregamento', () => {
            // Setup inicial
            window.gameState.teams.home.score = 50;
            
            // Simula a lógica de salvamento (que ainda não existe ou não está automatizada)
            // No mundo real, queremos que isso aconteça automaticamente.
            if (window.saveState) window.saveState();

            // Simula um "refresh" reiniciando o estado na marra
            // Aqui o teste deve falhar pois o loadState ainda não foi implementado no init
            window.gameState.teams.home.score = 0;
            if (window.loadState) window.loadState();

            expect(window.gameState.teams.home.score).toBe(50);
        });
    });
    
    describe('Fase 8: Seta de Posse Alternada', () => {
        it('deve alternar a direção da posse corretamente', () => {
            // Estado inicial pode ser null ou home
            expect(window.gameState.possession).toBeDefined();
            
            const initial = window.gameState.possession;
            window.togglePossession();
            
            if (initial === 'home') {
                expect(window.gameState.possession).toBe('away');
            } else {
                expect(window.gameState.possession).toBe('home');
            }
        });
        
        it('deve alternar a posse automaticamente ao clicar no botão de 24s', () => {
            const initial = window.gameState.possession;
            const btn = document.getElementById('reset-24-btn');
            
            // Simula clique no botão (o listener já está vinculado no DOMContentLoaded)
            btn.click();
            
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

    describe('Fase 10: Relatório de Súmula', () => {
        it('deve gerar o HTML do relatório com estatísticas dos jogadores', () => {
            // Adiciona um jogador com pontos e atualiza placar do time
            window.gameState.teams.home.players = [{ number: '10', name: 'Ivan', points: 15, fouls: 2, inCourt: true }];
            window.gameState.teams.home.score = 15;
            
            // Força a renderização do relatório
            const reportContainer = document.getElementById('report-content');
            window.UIManager.renderReport();
            
            expect(reportContainer.innerHTML).toContain('Ivan');
            expect(reportContainer.innerHTML).toContain('<td>15</td>');
            expect(reportContainer.innerHTML).toContain('<td>2</td>');
            expect(reportContainer.innerHTML).toContain('CASA - 15 PTS</h2>');
        });
    });

    describe('Fase 11: Estabilização da Fila de Áudio', () => {
        it('deve continuar processando a fila mesmo se um áudio falhar', async () => {
            // Mock de falha no play
            vi.spyOn(window.Audio.prototype, 'play').mockRejectedValue(new Error('Autoplay blocked'));
            
            // Adiciona 2 áudios
            window.SoundManager.play('buzina');
            window.SoundManager.play('buzina');
            
            // Aguarda os ciclos assíncronos (o catch gera uma nova microtask para cada erro)
            await new Promise(res => setTimeout(res, 200));
            
            // Agora a fila deve ter sido limpa pelos catches
            expect(window.SoundManager.queue.length).toBe(0);
        });
    });
});
