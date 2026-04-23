import { describe, it, expect, beforeEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import { JSDOM } from 'jsdom';

const html = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf8');
const jsCode = fs.readFileSync(path.resolve(__dirname, '../main.js'), 'utf8');

describe('Fase 6: Sistema de Áudio e DJ Arena', () => {
    let dom;
    let window;
    let document;
    let SoundManager;
    let gameState;

    beforeEach(() => {
        dom = new JSDOM(html, { runScripts: "dangerously", resources: "usable" });
        window = dom.window;
        document = window.document;
        
        // Mock global de Audio
        window.Audio = vi.fn().mockImplementation(() => ({
            play: vi.fn().mockResolvedValue(),
            pause: vi.fn(),
            onended: null
        }));

        const scriptEl = document.createElement("script");
        scriptEl.textContent = jsCode;
        document.body.appendChild(scriptEl);

        gameState = window.gameState;
        SoundManager = window.SoundManager;
        window.notify = vi.fn();
        
        // Impedir execução real de processQueue para não dar erro de Audio não implementado no JSDOM
        vi.spyOn(SoundManager, 'processQueue').mockImplementation(() => {});
        
        // Mock de UI
        window.UIManager.renderSoundQueue = vi.fn();
        window.UIManager.renderSoundboard = vi.fn();
    });

    it('6.1 deve selecionar um som aleatório da categoria e adicionar à fila', () => {
        SoundManager.play('cesta');
        expect(SoundManager.queue).toHaveLength(1);
        expect(SoundManager.queue[0].category).toBe('cesta');
        expect(SoundManager.library.cesta).toContain(SoundManager.queue[0].file);
    });

    it('6.2.1 deve remover um item específico da fila de áudio', () => {
        SoundManager.play('cesta');
        SoundManager.play('toco');
        const idToRemove = SoundManager.queue[0].id;

        SoundManager.removeFromQueue(idToRemove);

        expect(SoundManager.queue).toHaveLength(1);
        expect(SoundManager.queue[0].category).toBe('toco');
    });

    it('6.2.2 deve pular o áudio atual corretamente', () => {
        SoundManager.play('cesta');
        SoundManager.play('toco');
        
        SoundManager.skip();

        expect(SoundManager.queue).toHaveLength(1);
        expect(SoundManager.queue[0].category).toBe('toco');
        expect(window.notify).toHaveBeenCalledWith("Áudio pulado");
    });

    it('6.3 deve disparar um som específico por nome de arquivo (Soundboard)', () => {
        const testFile = "Buzina.mp3";
        SoundManager.playFile(testFile);

        expect(SoundManager.queue).toHaveLength(1);
        expect(SoundManager.queue[0].file).toBe(testFile);
        expect(SoundManager.queue[0].category).toBe('buzina');
    });
});
