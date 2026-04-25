import { test, expect } from '@playwright/test';

test.describe('FIBA Scoreboard - Visualização Pública (Viewer)', () => {
    test('deve sincronizar o placar da mesa com a página pública', async ({ context, baseURL }) => {
        // 1. Abrir a Mesa de Jogo
        const mesaPage = await context.newPage();
        await mesaPage.goto(`${baseURL}/mesa-de-jogo/`);

        // 2. Abrir a Visualização Pública
        const publicPage = await context.newPage();
        await publicPage.goto(`${baseURL}/placar/`);

        // Configurar a partida na mesa
        await mesaPage.fill('#input-competition', 'TESTE E2E');
        await mesaPage.click('#mock-data-btn');
        await mesaPage.click('#start-match-btn');

        // Verificar se os nomes sincronizaram no Viewer
        await expect(publicPage.locator('#home-name')).toHaveText('FLAMENGO');
        await expect(publicPage.locator('#away-name')).toHaveText('FRANCA');

        // 3. Fazer uma cesta na mesa
        await mesaPage.click('.player-match-card:first-child button:has-text("+2")');
        
        // Verificar no Viewer
        await expect(publicPage.locator('#home-score')).toHaveText('2');
        await expect(publicPage.locator('#score-overlay')).toHaveClass(/active/);

        // 4. Testar Streak (3 cestas seguidas)
        await mesaPage.click('.player-match-card:first-child button:has-text("+2")');
        await mesaPage.click('.player-match-card:first-child button:has-text("+2")');
        
        await expect(publicPage.locator('#home-streak')).toHaveClass(/active/);
        await expect(publicPage.locator('#home-streak')).toContainText('3 CESTAS SEGUIDAS');

        // 5. Testar Fire Mode (Abrir 15 pontos de vantagem)
        // Atualmente 6-0. Adicionar +10 (5 x +2)
        for(let i=0; i<5; i++) {
            await mesaPage.click('.player-match-card:first-child button:has-text("+2")');
        }
        // Total 16-0. Diferença 16 (>= 15)
        
        await expect(publicPage.locator('#fire-banner')).toHaveClass(/active/);
        await expect(publicPage.locator('#viewer-home')).toHaveClass(/on-fire/);
        await expect(publicPage.locator('#fire-text')).toContainText('FLAMENGO EM FOGO');

        // 6. Testar fim do Fire Mode (Outro time pontua)
        // Reduzir diferença: 16-3. Diferença 13 (< 15)
        const awayPlayerCard = mesaPage.locator('#away-active-players .player-match-card').first();
        await awayPlayerCard.locator('button:has-text("+3")').click();

        await expect(publicPage.locator('#fire-banner')).not.toHaveClass(/active/);
        await expect(publicPage.locator('#viewer-home')).not.toHaveClass(/on-fire/);
    });
});
