import { test, expect } from '@playwright/test';

test.describe('FIBA Scoreboard - Mecânicas de Jogo e Regras', () => {
  
  test.beforeEach(async ({ page }) => {
    // Desativa animações para estabilidade nos testes
    await page.addInitScript(() => {
        window.localStorage.removeItem('ritmo_de_jogo_state'); window.localStorage.setItem('ritmo_de_jogo_test_mode', 'true');
    });
    await page.addStyleTag({ content: `
      *, *::before, *::after {
        animation-duration: 0s !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0s !important;
        scroll-behavior: auto !important;
      }
    `});
    await page.goto('/mesa-de-jogo/');
    
    // Setup rápido para entrar na partida
    await page.click('#mock-data-btn');
    await page.click('#start-match-btn');
    await expect(page.locator('#match-screen')).toHaveClass(/active/);
  });

  test('deve registrar pontos corretamente para o jogador e para o time', async ({ page }) => {
    // Pega o primeiro jogador do time da casa (#4 Yago Mateus no mock)
    const homePlayerCard = page.locator('#home-active-players .player-match-card').first();
    const plus3Btn = homePlayerCard.getByRole('button', { name: '+3' });
    
    await plus3Btn.click();

    // Valida o placar geral do time da casa
    await expect(page.locator('#home-score')).toHaveText('3');
    
    // FIBA Rule: Relógio deve pausar, 24s resetar e posse mudar para o outro time
    await expect(page.locator('#toggle-clock-btn')).toHaveText('START');
    await expect(page.locator('#shot-clock')).toHaveText('24');
    await expect(page.locator('#possession-arrow')).toHaveClass(/away/);
    
    // Valida o log de eventos (O primeiro agora é o reset de 24s, o segundo é o ponto)
    const pointsLog = page.locator('#event-log .log-entry').filter({ hasText: '3 pts para #4' });
    await expect(pointsLog).toBeVisible();
  });

  test('deve aplicar exclusão após 5 faltas e ativar bônus de equipe', async ({ page }) => {
    const homePlayerCard = page.locator('#home-active-players .player-match-card').first();
    const foulBtn = homePlayerCard.getByRole('button', { name: 'FALTA' });

    // Adiciona 5 faltas
    for(let i = 0; i < 5; i++) {
        await page.locator('#home-active-players .player-match-card').first().getByRole('button', { name: 'FALTA' }).click();
    }

    // 1. Valida estilo visual de exclusão no card do jogador
    await expect(homePlayerCard).toHaveClass(/excluded/);
    await expect(homePlayerCard.locator('.p-fouls-badge')).toContainText('5 🚫');

    // 2. Valida se os botões de pontos estão desativados para esse jogador
    await expect(homePlayerCard.getByRole('button', { name: '+1' })).toBeDisabled();
    await expect(homePlayerCard.getByRole('button', { name: 'FALTA' })).toBeDisabled();

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

    // Clica no botão de reverter no log (específico para os pontos)
    const pointsEntry = page.locator('#event-log .log-entry').filter({ hasText: '2 pts para #4' });
    const revertBtn = pointsEntry.getByRole('button');
    await revertBtn.click();

    // O placar deve voltar a 0
    await expect(page.locator('#home-score')).toHaveText('0');
    
    // O item no log deve ter estilo de riscado
    await expect(pointsEntry).toHaveClass(/reverted/);
  });
});
