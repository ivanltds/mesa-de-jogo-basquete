import { test, expect } from '@playwright/test';

test.describe('Game State Persistence', () => {
  test.beforeEach(async ({ page }) => {
    // Clear state and start fresh
    await page.goto('/mesa-de-jogo/');
    await page.evaluate(() => localStorage.removeItem('ritmo_de_jogo_state'));
    await page.reload();
  });

  test('should persist match state after page reload', async ({ page }) => {
    // 1. Setup Match using Mock Data
    await page.click('#mock-data-btn');
    await page.click('#start-match-btn');
    
    // Verify we are in match screen
    await expect(page.locator('#match-screen')).toHaveClass(/active/);
    
    // 2. Perform some actions
    // Add 3 points to Home #4 (Yago Mateus)
    const homePlayer4 = page.locator('.player-match-card').filter({ hasText: '#4' });
    await expect(homePlayer4).toBeVisible();
    await homePlayer4.locator('button', { hasText: '+3' }).click();
    
    // Add a foul to Away #7 (Jhonatan Luz)
    const awayPlayer7 = page.locator('.player-match-card').filter({ hasText: '#7' });
    await expect(awayPlayer7).toBeVisible();
    await awayPlayer7.locator('button', { hasText: 'FALTA' }).click();
    
    // Verify initial state on scoreboard
    await expect(page.locator('#home-score')).toHaveText('3');
    await expect(page.locator('#fouls-away')).toHaveText('1');

    // 3. Reload the page
    await page.reload();
    
    // 4. Handle recovery modal (should appear because score > 0)
    const recoveryModal = page.locator('#recovery-modal');
    await expect(recoveryModal).toBeVisible({ timeout: 5000 });
    await recoveryModal.locator('#confirm-continue-btn').click({ force: true });
    
    // 5. Verify state is restored
    await expect(page.locator('#home-score')).toHaveText('3');
    await expect(page.locator('#fouls-away')).toHaveText('1');
    
    // Verify player individual stats are restored
    await expect(homePlayer4.locator('.p-fouls-badge')).toContainText('0'); 
    await expect(awayPlayer7.locator('.p-fouls-badge')).toContainText('1');
  });

  test('should persist audio policies and current screen after reload', async ({ page }) => {
    // Setup and go to match screen
    await page.click('#mock-data-btn');
    await page.click('#start-match-btn');
    if (await page.locator('#recovery-modal').isVisible()) {
        await page.click('#confirm-continue-btn');
    }

    // 1. Open Audio Policy Screen
    await page.click('.settings-toggle');
    await page.click('#audio-policy-btn');
    await expect(page.locator('#audio-policy-screen')).toHaveClass(/active/);
    
    // 2. Change a policy (disable automatic audio)
    const autoAudioToggle = page.locator('#toggle-auto-audio');
    await expect(autoAudioToggle).toHaveClass(/active/);
    await autoAudioToggle.click();
    await expect(autoAudioToggle).not.toHaveClass(/active/);
    
    await page.click('#save-policy-btn');
    
    // 3. Reload
    await page.reload();
    
    // 4. Verification:
    // Should stay on audio-policy-screen because it was the active screen and NO match was "active" (score=0, events=0)
    // Wait, mock data doesn't add events, just players.
    await expect(page.locator('#audio-policy-screen')).toHaveClass(/active/);
    await expect(page.locator('#toggle-auto-audio')).not.toHaveClass(/active/);
    
    // Now close it
    await page.click('#audio-policy-screen .btn-ghost', { hasText: 'FECHAR' });
    await expect(page.locator('#match-screen')).toHaveClass(/active/);
  });
});
