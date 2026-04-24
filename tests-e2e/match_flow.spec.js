import { test, expect } from '@playwright/test';

test.describe('FIBA Scoreboard - Fluxo de Partida e Setup', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/mesa-de-jogo/');
    await page.addStyleTag({ content: `
      *, *::before, *::after {
        animation-duration: 0s !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0s !important;
        scroll-behavior: auto !important;
      }
    `});
  });

  test('deve configurar uma partida completa e iniciar com sucesso', async ({ page }) => {
    // 1. Usa o botão de Mock Data para agilizar o setup de 12 jogadores
    const mockBtn = page.locator('#mock-data-btn');
    await mockBtn.click();
    
    // Valida se os nomes foram preenchidos
    await expect(page.locator('#home-name')).toHaveValue('FLAMENGO');
    await expect(page.locator('#away-name')).toHaveValue('FRANCA');

    // 2. Altera a cor de um time para validar persistência visual
    await page.locator('#home-color').fill('#000000'); // Preto para o Flamengo
    
    // 3. Inicia a partida
    const startBtn = page.locator('#start-match-btn');
    await startBtn.click();

    // 4. Valida transição de tela
    await expect(page.locator('#match-screen')).toHaveClass(/active/);
    await expect(page.locator('#setup-screen')).not.toHaveClass(/active/);

    // 5. Valida se os 5 jogadores iniciais de cada time estão em quadra
    const homeActivePlayers = page.locator('#home-active-players .player-match-card');
    const awayActivePlayers = page.locator('#away-active-players .player-match-card');
    
    await expect(homeActivePlayers).toHaveCount(5);
    await expect(awayActivePlayers).toHaveCount(5);

    // Verifica se os nomes dos times aparecem no placar
    await expect(page.locator('#display-home-name')).toHaveText('FLAMENGO');
    await expect(page.locator('#display-away-name')).toHaveText('FRANCA');
  });

  test('deve bloquear início de partida se não houver jogadores suficientes', async ({ page }) => {
    // Reseta ou garante que está vazio (Vite recarrega)
    await page.reload();
    
    // Tenta iniciar direto sem jogadores
    const startBtn = page.locator('#start-match-btn');
    await startBtn.click();

    // Deve mostrar um toast de erro (baseado no window.notify)
    const toast = page.locator('.toast.info'); // O sistema usa .info por padrão para erros de validação simples
    await expect(toast).toBeVisible();
    await expect(toast).toContainText('Mínimo de 5 jogadores!');
    
    // Não deve ter mudado de tela
    await expect(page.locator('#setup-screen')).toHaveClass(/active/);
  });

  test('deve permitir adicionar e remover jogadores manualmente antes da partida', async ({ page }) => {
    // Adiciona um jogador manualmente
    await page.locator('#home-p-num').fill('23');
    await page.locator('#home-p-name').fill('Michael Jordan');
    await page.locator('#btn-add-home-p').click();

    // Verifica se apareceu na lista
    const playerItem = page.locator('#home-players-list .player-row');
    await expect(playerItem).toContainText('23');
    await expect(playerItem).toContainText('Michael Jordan');

    // Remove o jogador
    await playerItem.locator('button').click();
    await expect(playerItem).toHaveCount(0);
  });
});
