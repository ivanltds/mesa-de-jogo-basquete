import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.addStyleTag({ content: `
    *, *::before, *::after {
      animation-duration: 0s !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0s !important;
      scroll-behavior: auto !important;
    }
  `});
});

test.describe('FIBA Scoreboard - Smoke Tests', () => {
  test('deve carregar a tela de setup inicial com o título correto', async ({ page }) => {
    await page.goto('/');
    
    // Verifica se o título principal do setup está visível
    const title = page.locator('.setup-hero h1');
    await expect(title).toContainText('DIGITAL SCOREBOARD');
    
    // Verifica se o botão de iniciar partida existe
    const startBtn = page.locator('#start-match-btn');
    await expect(startBtn).toBeVisible();
    await expect(startBtn).toHaveText('INICIAR PARTIDA ➔');
  });

  test('deve permitir abrir o modo DJ (Soundboard)', async ({ page }) => {
    await page.goto('/');
    
    const djBtn = page.locator('.btn-soundboard-hero');
    await djBtn.click();
    
    // Verifica se mudou para a tela de soundboard
    await expect(page.locator('#soundboard-screen')).toHaveClass(/active/);
    const djTitle = page.locator('.dj-logo');
    await expect(djTitle).toContainText('ARENA MIXER');
  });
});
