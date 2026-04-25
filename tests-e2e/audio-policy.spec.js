import { test, expect } from '@playwright/test';

test.describe('FIBA Scoreboard - Inteligência Sonora (Audio Policy)', () => {
  
  test.beforeEach(async ({ page }) => {
    // Limpa estado anterior
    await page.addInitScript(() => {
      window.localStorage.removeItem('ritmo_de_jogo_state'); window.localStorage.setItem('ritmo_de_jogo_test_mode', 'true');
    });
    
    await page.goto('/mesa-de-jogo/');
    
    // Inicia uma partida rápida
    await page.click('#mock-data-btn');
    await page.click('#start-match-btn');
  });

  test('deve configurar uma reação customizada para cesta e disparar corretamente', async ({ page }) => {
    // 1. Abre Gestão de Áudio
    await page.click('.settings-toggle');
    await page.click('button:has-text("INTELIGÊNCIA DE ÁUDIO")');
    await expect(page.locator('#audio-policy-screen')).toBeVisible();

    // 2. Muda reação de 1 ponto para 'ERROU'
    await page.selectOption('#score-map-1', 'errou');
    
    // 3. Muda reação de 'FALTA' para 'CESTA' (apenas para teste)
    await page.selectOption('#event-map-foul', 'cesta');

    // 4. Salva
    await page.click('#save-policy-btn');
    
    // Verifica toast de confirmação
    await expect(page.locator('.toast:has-text("Ajustes salvos com sucesso")')).toBeVisible();

    // 5. Volta para o jogo
    await page.click('button:has-text("FECHAR")', { force: true });
    await expect(page.locator('#match-screen')).toBeVisible();

    await page.evaluate(() => {
        window.audioHistory = [];
        const originalPlay = window.AudioPlaybackQueue.play;
        window.AudioPlaybackQueue.play = (cat, prio) => {
            window.audioHistory.push({ cat, prio });
        };
        // Também espiona addToQueue (usado pelo disparo inteligente)
        window.AudioPlaybackQueue.addToQueue = (cat, file, prio) => {
            window.audioHistory.push({ cat, prio });
        };
    });

    // 7. Adiciona 1 ponto (Lance Livre) para o Time A
    const playerA1 = page.locator('.home .player-match-card').first();
    await playerA1.locator('button:has-text("+1")').click();

    // 8. Verifica se o áudio 'ERROU' foi disparado
    const history = await page.evaluate(() => window.audioHistory);
    expect(history).toContainEqual({ cat: 'errou', prio: 5 });

    // 9. Comete uma falta
    await playerA1.locator('button:has-text("FALTA")').click();

    // 10. Verifica se o áudio 'CESTA' foi disparado (conforme configurado no passo 3)
    const historyFinal = await page.evaluate(() => window.audioHistory);
    expect(historyFinal).toContainEqual({ cat: 'cesta', prio: 5 });
  });

  test('deve desativar áudio automático quando configurado', async ({ page }) => {
    await page.click('.settings-toggle');
    await page.click('button:has-text("INTELIGÊNCIA DE ÁUDIO")');
    
    // Desativa o switch de Assistente Automático
    await page.click('#toggle-auto-audio');
    
    await page.click('#save-policy-btn');
    await page.click('button:has-text("FECHAR")', { force: true });

    await page.evaluate(() => {
        window.audioHistory = [];
        window.AudioPlaybackQueue.play = (cat, prio) => window.audioHistory.push({ cat, prio });
        window.AudioPlaybackQueue.addToQueue = (cat, file, prio) => window.audioHistory.push({ cat, prio });
    });

    // Adiciona ponto
    const playerA1 = page.locator('.home .player-match-card').first();
    await playerA1.locator('button:has-text("+2")').click();

    // Histórico deve estar vazio
    const history = await page.evaluate(() => window.audioHistory);
    expect(history.length).toBe(0);
  });
});
