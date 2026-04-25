import { test, expect } from '@playwright/test';

test.describe('FIBA Scoreboard - Soundboard (Arena Mixer)', () => {
  
  test.beforeEach(async ({ page }) => {
    // Limpa estado anterior
    await page.addInitScript(() => {
      window.localStorage.removeItem('ritmo_de_jogo_state'); window.localStorage.setItem('ritmo_de_jogo_test_mode', 'true');
    });
    
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

  test('deve renderizar os pads de som e permitir adicionar à fila', async ({ page }) => {
    await page.goto('/mesa-de-som/');
    
    // Aguarda a renderização dos blocos de categoria
    const catBlock = page.locator('.dj-cat-block').first();
    await expect(catBlock).toBeVisible();
    
    // Verifica se existem botões de pad (pelo menos os da categoria CESTA)
    const pads = page.locator('.dj-pad');
    const padCount = await pads.count();
    expect(padCount).toBeGreaterThan(10); // CESTA tem muitos sons
    
    // Verifica se a fila está inicialmente vazia
    await expect(page.locator('#dj-audio-queue')).toContainText('Fila vazia');
    
    // Clica no primeiro pad para adicionar som à fila
    const firstPad = pads.first();
    await firstPad.click();
    
    // Verifica se o item foi adicionado à fila do DJ
    const queueItem = page.locator('.dj-queue-item');
    await expect(queueItem).toBeVisible();
    await expect(queueItem).toContainText('TOCANDO');
  });

  test('deve permitir limpar a fila através do botão SKIP', async ({ page }) => {
    await page.goto('/mesa-de-som/');
    
    // Adiciona um som clicando em um pad
    await page.locator('.dj-pad').first().click();
    await expect(page.locator('.dj-queue-item')).toBeVisible();
    
    // Clica no botão de SKIP MASTER
    const skipBtn = page.locator('.btn-dj-skip');
    await skipBtn.click();
    
    // A fila deve voltar ao estado de vazia
    await expect(page.locator('#dj-audio-queue')).toContainText('Fila vazia');
  });

  test('deve aplicar corretamente a política de áudio para a Mesa de Som', async ({ page }) => {
    await page.goto('/mesa-de-som/');
    
    // Verifica se o estado interno do activeScreenId foi setado para soundboard-screen
    // Podemos verificar isso indiretamente tentando tocar um som que seria bloqueado em outras telas (ex: NBA)
    const nbaPad = page.locator('.dj-pad.nba').first();
    await nbaPad.click();
    
    // Se o som foi adicionado, significa que a política permitiu (NBA é permitido no soundboard-screen)
    const queueItem = page.locator('.dj-queue-item');
    await expect(queueItem).toBeVisible();
    await expect(queueItem).toContainText('NBA');
  });
});
