import { test, expect } from '@playwright/test';

test.describe('FIBA Scoreboard - Mecânicas de Jogo e Regras', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.removeItem('ritmo_de_jogo_state');
    });
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
    // Setup rápido para entrar na partida
    await page.locator('#mock-data-btn').click();
    await page.locator('#start-match-btn').click();
    await expect(page.locator('#match-screen')).toHaveClass(/active/);
  });

  test('deve registrar pontos corretamente para o jogador e para o time', async ({ page }) => {
    // Pega o primeiro jogador do time da casa (#4 Yago Mateus no mock)
    const homePlayerCard = page.locator('#home-active-players .player-match-card').first();
    const plus3Btn = homePlayerCard.getByRole('button', { name: '+3' });
    
    await plus3Btn.click();

    // Valida o placar geral do time da casa
    await expect(page.locator('#home-score')).toHaveText('3');
    
    // Valida o log de eventos
    const lastLog = page.locator('#event-log .log-entry').first();
    await expect(lastLog).toContainText('3 pts para #4');
  });

  test('deve aplicar exclusão após 5 faltas e ativar bônus de equipe', async ({ page }) => {
    const homePlayerCard = page.locator('#home-active-players .player-match-card').first();
    const foulBtn = homePlayerCard.getByRole('button', { name: 'FOUL' });

    // Adiciona 5 faltas
    for(let i = 0; i < 5; i++) {
        await foulBtn.click();
    }

    // 1. Valida estilo visual de exclusão no card do jogador
    await expect(homePlayerCard).toHaveClass(/excluded/);
    await expect(homePlayerCard.locator('.p-fouls')).toContainText('5F 🚫');

    // 2. Valida se os botões de pontos estão desativados para esse jogador
    await expect(homePlayerCard.getByRole('button', { name: '+1' })).toBeDisabled();
    await expect(homePlayerCard.getByRole('button', { name: 'FOUL' })).toBeDisabled();

    // 3. Valida bônus de equipe (ativado na 4ª falta, confirmado na 5ª)
    const bonusIndicator = page.locator('#home-bonus');
    await expect(bonusIndicator).toHaveClass(/active/);
    
    // 4. Valida notificação de exclusão
    const toast = page.locator('.toast.error');
    await expect(toast).toContainText('JOGADOR #4 EXCLUÍDO');
  });

  test('deve permitir reverter um evento e restaurar o placar', async ({ page }) => {
    const homePlayerCard = page.locator('#home-active-players .player-match-card').first();
    await homePlayerCard.getByRole('button', { name: '+2' }).click();
    
    await expect(page.locator('#home-score')).toHaveText('2');

    // Clica no botão de reverter no log
    const revertBtn = page.locator('#event-log .log-entry').first().getByRole('button');
    await revertBtn.click();

    // O placar deve voltar a 0
    await expect(page.locator('#home-score')).toHaveText('0');
    
    // O item no log deve ter estilo de riscado
    await expect(page.locator('#event-log .log-entry').first()).toHaveClass(/reverted/);
  });
});
