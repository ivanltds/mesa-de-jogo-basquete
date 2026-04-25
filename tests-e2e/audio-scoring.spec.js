import { test, expect } from '@playwright/test';

test.describe('FIBA Scoreboard - Gestão de Escolha de Áudios (Audio Scoring)', () => {
  
  test.beforeEach(async ({ page }) => {
    // Limpa estado anterior
    await page.addInitScript(() => {
      window.localStorage.removeItem('ritmo_de_jogo_state'); window.localStorage.setItem('ritmo_de_jogo_test_mode', 'true');
    });
    
    await page.goto('/mesa-de-jogo/');
    
    // Inicia uma partida rápida para ter catálogo carregado e estado inicial
    await page.click('#mock-data-btn');
    await page.click('#start-match-btn');
  });

  test('deve abrir a tela de escolha dos áudios e realizar uma simulação', async ({ page }) => {
    // 1. Abre Gestão de Escolha de Áudios
    await page.click('.settings-toggle');
    await page.click('button:has-text("RELEVÂNCIA DE ÁUDIO")');
    await expect(page.locator('#audio-scoring-screen')).toBeVisible();

    // 2. Verifica se as regras padrão estão carregadas (ex: 3 pontos = 2)
    const threePointInput = page.locator('input[name="context.scoreMade.threePointBonus"]');
    await expect(threePointInput).toHaveValue('2');

    // 3. Altera o peso de 3 pontos para 50 (para garantir que ele ganhe de tudo na simulação)
    await threePointInput.fill('50');
    await page.click('#save-rules-btn');
    
    // Verifica toast de confirmação
    await expect(page.locator('.toast:has-text("Critérios de escolha atualizados")')).toBeVisible();

    // 4. Configura simulação: Cesta de 3 pontos
    await page.selectOption('#sim-event-type', 'score.made');
    await page.click('input[name="scoreValue"][value="3"]');
    
    // 5. Executa simulação
    await page.click('#run-simulation-btn');

    // 6. Verifica se o ranking aparece
    await expect(page.locator('#ranking-body tr')).not.toHaveCount(0);
    
    // 7. Verifica se o vencedor aparece no destaque
    await expect(page.locator('#sim-winner-container .winner-card')).toBeVisible();
    
    // 8. Verifica se o motivo customizado aparece no breakdown do primeiro item do ranking
    // Nota: O breakdown está escondido por padrão, precisamos clicar no botão de lupa
    await page.locator('#ranking-body tr.winner .breakdown-btn').click();
    await expect(page.locator('#ranking-body tr.winner .reason-list')).toContainText('Cesta de 3 pontos: +50');

    // 9. Reseta as regras
    await page.click('#reset-rules-btn');
    await expect(page.locator('.toast:has-text("Os ajustes voltaram para o padrão")')).toBeVisible();
    
    // 10. Verifica se o valor voltou para 2
    await expect(threePointInput).toHaveValue('2');
  });

  test('deve refletir o momento decisivo (clutch) na simulação', async ({ page }) => {
    await page.click('.settings-toggle');
    await page.click('button:has-text("RELEVÂNCIA DE ÁUDIO")');
    
    // Configura simulação: Cesta de 2 pontos com Momento Decisivo (Clutch) ligado
    await page.selectOption('#sim-event-type', 'score.made');
    await page.click('input[name="scoreValue"][value="2"]');
    
    // Forçar Momento Decisivo (antigo Clutch)
    await page.check('input[name="clutch"]');
    
    await page.click('#run-simulation-btn');
    
    // Verifica se algum asset tem o bônus de momento decisivo
    // Procuramos no breakdown do vencedor
    await page.locator('#ranking-body tr.winner .breakdown-btn').click();
    await expect(page.locator('#ranking-body tr.winner .reason-list')).toContainText('Som forte em momento decisivo');
  });
});
