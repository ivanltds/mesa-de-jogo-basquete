import { test, expect } from '@playwright/test';

test.describe('FIBA Scoreboard - Smoke Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    // Desativa animações para estabilidade nos testes
    await page.addStyleTag({ content: `
      *, *::before, *::after {
        animation-duration: 0s !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0s !important;
        scroll-behavior: auto !important;
      }
    `});
  });

  test('deve carregar a Landing Page inicial com os botões corretos', async ({ page }) => {
    await page.goto('/');
    
    // Verifica se o título da LP está presente
    const title = page.locator('h1');
    await expect(title).toContainText('A mesa inteligente');
    
    // Verifica se os links para as ferramentas existem
    const btnPlacar = page.locator('text=Abrir Placar Oficial');
    await expect(btnPlacar).toBeVisible();
    
    const btnDJ = page.locator('text=Acessar Modo DJ');
    await expect(btnDJ).toBeVisible();
  });

  test('deve carregar a rota exclusiva da Mesa de Jogo', async ({ page }) => {
    await page.goto('/mesa-de-jogo/');
    
    // Verifica o título do Placar
    const title = page.locator('.setup-hero h1');
    await expect(title).toContainText('DIGITAL SCOREBOARD');
    
    // Verifica se o botão de iniciar partida existe
    const startBtn = page.locator('#start-match-btn');
    await expect(startBtn).toBeVisible();
  });

  test('deve carregar a rota exclusiva da Mesa de Som (Arena Mixer)', async ({ page }) => {
    await page.goto('/mesa-de-som/');
    
    // Verifica se está na tela de soundboard
    await expect(page.locator('#soundboard-screen')).toHaveClass(/active/);
    const djTitle = page.locator('.dj-logo');
    await expect(djTitle).toContainText('ARENA MIXER');
  });
});
