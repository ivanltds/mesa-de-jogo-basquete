import { test, expect } from '@playwright/test';

test.describe('FIBA Scoreboard - Compartilhamento', () => {
    test('deve abrir o modal de compartilhamento ao clicar no botão', async ({ page }) => {
        await page.goto('http://localhost:3000/mesa-de-jogo/');
        
        const shareBtn = page.locator('#share-btn');
        await expect(shareBtn).toBeVisible();
        
        await shareBtn.click();
        
        const modal = page.locator('#share-modal');
        await expect(modal).toHaveClass(/active/);
        
        const openBtn = page.locator('#open-public-btn');
        await expect(openBtn).toBeVisible();
        await expect(openBtn).toHaveAttribute('href', '/placar/');
    });
});
