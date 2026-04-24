import { test, expect } from '@playwright/test';

test.describe('FIBA Scoreboard - Fluxo de Tempo e Períodos', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/mesa-de-jogo/');
    // Desativa animações para estabilidade nos testes
    await page.addStyleTag({ content: `
      *, *::before, *::after {
        animation-duration: 0s !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0s !important;
        scroll-behavior: auto !important;
      }
    `});
    await page.locator('#mock-data-btn').click();
    await page.locator('#start-match-btn').click();
  });

  test('deve bloquear substituição com cronômetro rodando e permitir com ele parado', async ({ page }) => {
    // 1. Liga o cronômetro
    await page.locator('#toggle-clock-btn').click();
    await expect(page.locator('#toggle-clock-btn')).toHaveText('PAUSE');

    // 2. Tenta abrir SUB
    const firstSubBtn = page.locator('.team-panel.home').getByRole('button', { name: 'SUB' }).first();
    await firstSubBtn.click();

    // Valida que o modal NÃO está ativo e apareceu toast de erro
    await expect(page.locator('#sub-modal')).not.toHaveClass(/active/);
    await expect(page.locator('.toast.error')).toContainText('bola morta');

    // 3. Para o cronômetro
    await page.locator('#toggle-clock-btn').click();
    await expect(page.locator('#toggle-clock-btn')).toHaveText('START');

    // 4. Abre SUB novamente
    await firstSubBtn.click();
    await expect(page.locator('#sub-modal')).toHaveClass(/active/);
  });

  test('deve resetar o shot clock para 24s e 14s corretamente', async ({ page }) => {
    const shotClock = page.locator('#shot-clock');
    
    // Reset 14s
    await page.locator('#reset-14-btn').click();
    await expect(shotClock).toHaveText('14');

    // Reset 24s
    await page.locator('#reset-24-btn').click();
    await expect(shotClock).toHaveText('24');
  });

  test('deve avançar o período, resetar relógios e faltas coletivas', async ({ page }) => {
    // 1. Adiciona faltas coletivas (Time Casa)
    const homePlayerCard = page.locator('#home-active-players .player-match-card').first();
    const foulBtn = homePlayerCard.getByRole('button', { name: 'FOUL' });
    await foulBtn.click();
    await foulBtn.click();
    
    await expect(page.locator('#fouls-home')).toHaveText('2');

    // 2. FFW para os últimos 10s e deixa zerar
    await page.locator('#fast-forward-btn').click();
    await page.locator('#toggle-clock-btn').click(); // Inicia o relógio
    
    // Aguarda o relógio zerar (leva aprox 10 segundos no Fast Forward)
    await expect(page.locator('#game-clock')).toHaveText('0:00', { timeout: 12000 });

    // 3. Avança o período
    await page.locator('#next-period-btn').click();
    
    // Valida novo período e reset de faltas
    await expect(page.locator('#display-period')).toHaveText('2');
    await expect(page.locator('#fouls-home')).toHaveText('0');
    
    // Valida reset dos relógios
    await expect(page.locator('#game-clock')).toHaveText('10:00');
    await expect(page.locator('#shot-clock')).toHaveText('24');
    
    // Valida notificação específica
    await expect(page.locator('#toast-container').getByText('Faltas coletivas zeradas')).toBeVisible();
  });
});
