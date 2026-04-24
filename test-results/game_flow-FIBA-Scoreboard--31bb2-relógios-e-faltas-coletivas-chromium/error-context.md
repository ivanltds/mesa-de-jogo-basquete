# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: game_flow.spec.js >> FIBA Scoreboard - Fluxo de Tempo e Períodos >> deve avançar o período, resetar relógios e faltas coletivas
- Location: tests-e2e\game_flow.spec.js:54:3

# Error details

```
Error: expect(locator).toHaveText(expected) failed

Locator:  locator('#display-period')
Expected: "2"
Received: "1"
Timeout:  5000ms

Call log:
  - Expect "toHaveText" with timeout 5000ms
  - waiting for locator('#display-period')
    9 × locator resolved to <span id="display-period">1</span>
      - unexpected value "1"

```

# Page snapshot

```yaml
- generic [ref=e2]:
  - button "REINICIAR PARTIDA" [ref=e4] [cursor=pointer]
  - generic [ref=e7]:
    - generic [ref=e8]:
      - generic [ref=e9]:
        - heading "FLAMENGO" [level=2] [ref=e10]
        - button "SUB" [ref=e11] [cursor=pointer]
      - generic [ref=e12]: "0"
      - generic [ref=e13]:
        - generic [ref=e14]: BONUS
        - button "T" [ref=e21] [cursor=pointer]
      - generic [ref=e22]: "FALTAS: 2"
      - generic [ref=e23]:
        - generic [ref=e24]:
          - generic [ref=e25]:
            - generic [ref=e26]: "#4"
            - generic: Yago Mateus
            - generic [ref=e27]: 2F
          - generic [ref=e28]:
            - button "+1" [ref=e29] [cursor=pointer]
            - button "+2" [ref=e30] [cursor=pointer]
            - button "+3" [ref=e31] [cursor=pointer]
            - button "FOUL" [ref=e32] [cursor=pointer]
            - button "SUB" [ref=e33] [cursor=pointer]
        - generic [ref=e34]:
          - generic [ref=e35]:
            - generic [ref=e36]: "#9"
            - generic: Marcelinho Huertas
            - generic [ref=e37]: 0F
          - generic [ref=e38]:
            - button "+1" [ref=e39] [cursor=pointer]
            - button "+2" [ref=e40] [cursor=pointer]
            - button "+3" [ref=e41] [cursor=pointer]
            - button "FOUL" [ref=e42] [cursor=pointer]
            - button "SUB" [ref=e43] [cursor=pointer]
        - generic [ref=e44]:
          - generic [ref=e45]:
            - generic [ref=e46]: "#11"
            - generic: Marquinhos Sousa
            - generic [ref=e47]: 0F
          - generic [ref=e48]:
            - button "+1" [ref=e49] [cursor=pointer]
            - button "+2" [ref=e50] [cursor=pointer]
            - button "+3" [ref=e51] [cursor=pointer]
            - button "FOUL" [ref=e52] [cursor=pointer]
            - button "SUB" [ref=e53] [cursor=pointer]
        - generic [ref=e54]:
          - generic [ref=e55]:
            - generic [ref=e56]: "#17"
            - generic: Anderson Varejão
            - generic [ref=e57]: 0F
          - generic [ref=e58]:
            - button "+1" [ref=e59] [cursor=pointer]
            - button "+2" [ref=e60] [cursor=pointer]
            - button "+3" [ref=e61] [cursor=pointer]
            - button "FOUL" [ref=e62] [cursor=pointer]
            - button "SUB" [ref=e63] [cursor=pointer]
        - generic [ref=e64]:
          - generic [ref=e65]:
            - generic [ref=e66]: "#25"
            - generic: Olivinha Rodriguez
            - generic [ref=e67]: 0F
          - generic [ref=e68]:
            - button "+1" [ref=e69] [cursor=pointer]
            - button "+2" [ref=e70] [cursor=pointer]
            - button "+3" [ref=e71] [cursor=pointer]
            - button "FOUL" [ref=e72] [cursor=pointer]
            - button "SUB" [ref=e73] [cursor=pointer]
    - generic [ref=e74]:
      - generic [ref=e75]:
        - generic "Alternar Seta de Posse" [ref=e77] [cursor=pointer]:
          - generic [ref=e78]: ◀
          - generic [ref=e79]: POSSE
          - generic [ref=e80]: ▶
        - generic [ref=e81]:
          - text: PERÍODO
          - generic [ref=e82]: "1"
          - button "➔" [active] [ref=e83] [cursor=pointer]
        - generic [ref=e84]: 0:00
        - generic [ref=e85]: "14"
        - generic [ref=e86]:
          - button "START" [ref=e87] [cursor=pointer]
          - generic [ref=e88]:
            - button "🔄 POSSE (24s)" [ref=e89] [cursor=pointer]
            - button "14s" [ref=e90] [cursor=pointer]
          - generic [ref=e91]:
            - button "FFW 10s" [ref=e92] [cursor=pointer]
            - button "?" [ref=e93] [cursor=pointer]
            - button "🎉" [ref=e94] [cursor=pointer]
            - button "🏀" [ref=e95] [cursor=pointer]
            - button "🙌" [ref=e96] [cursor=pointer]
            - button "🎵" [ref=e97] [cursor=pointer]
            - button "⏭️" [ref=e98] [cursor=pointer]
      - generic [ref=e99]:
        - generic [ref=e100]:
          - heading "HISTÓRICO RECENTE" [level=3] [ref=e101]
          - generic [ref=e102]:
            - generic [ref=e103]:
              - generic [ref=e104]:
                - generic [ref=e105]: 🏁
                - generic [ref=e106]: FIM DO PERÍODO 1
              - button "🚫" [ref=e107] [cursor=pointer]
            - generic [ref=e108]:
              - generic [ref=e109]:
                - generic [ref=e110]: ⚠️
                - generic [ref=e111]: "Falta #4"
              - button "🚫" [ref=e112] [cursor=pointer]
            - generic [ref=e113]:
              - generic [ref=e114]:
                - generic [ref=e115]: ⚠️
                - generic [ref=e116]: "Falta #4"
              - button "🚫" [ref=e117] [cursor=pointer]
        - generic [ref=e118]:
          - heading "🔊 FILA DE ÁUDIO" [level=3] [ref=e119]
          - generic [ref=e121]:
            - generic [ref=e122]: 🔊
            - generic [ref=e123]: OFFICIAL
            - generic [ref=e124]: Buzina.mp3
            - generic [ref=e125]: TOCANDO
    - generic [ref=e126]:
      - generic [ref=e127]:
        - button "SUB" [ref=e128] [cursor=pointer]
        - heading "FRANCA" [level=2] [ref=e129]
      - generic [ref=e130]: "0"
      - generic [ref=e131]:
        - button "T" [ref=e132] [cursor=pointer]
        - generic [ref=e139]: BONUS
      - generic [ref=e140]: "FALTAS: 0"
      - generic [ref=e141]:
        - generic [ref=e142]:
          - generic [ref=e143]:
            - generic [ref=e144]: "#7"
            - generic: Jhonatan Luz
            - generic [ref=e145]: 0F
          - generic [ref=e146]:
            - button "+1" [ref=e147] [cursor=pointer]
            - button "+2" [ref=e148] [cursor=pointer]
            - button "+3" [ref=e149] [cursor=pointer]
            - button "FOUL" [ref=e150] [cursor=pointer]
            - button "SUB" [ref=e151] [cursor=pointer]
        - generic [ref=e152]:
          - generic [ref=e153]:
            - generic [ref=e154]: "#14"
            - generic: Lucas Dias
            - generic [ref=e155]: 0F
          - generic [ref=e156]:
            - button "+1" [ref=e157] [cursor=pointer]
            - button "+2" [ref=e158] [cursor=pointer]
            - button "+3" [ref=e159] [cursor=pointer]
            - button "FOUL" [ref=e160] [cursor=pointer]
            - button "SUB" [ref=e161] [cursor=pointer]
        - generic [ref=e162]:
          - generic [ref=e163]:
            - generic [ref=e164]: "#28"
            - generic: Lucas Mariano
            - generic [ref=e165]: 0F
          - generic [ref=e166]:
            - button "+1" [ref=e167] [cursor=pointer]
            - button "+2" [ref=e168] [cursor=pointer]
            - button "+3" [ref=e169] [cursor=pointer]
            - button "FOUL" [ref=e170] [cursor=pointer]
            - button "SUB" [ref=e171] [cursor=pointer]
        - generic [ref=e172]:
          - generic [ref=e173]:
            - generic [ref=e174]: "#32"
            - generic: David Jackson
            - generic [ref=e175]: 0F
          - generic [ref=e176]:
            - button "+1" [ref=e177] [cursor=pointer]
            - button "+2" [ref=e178] [cursor=pointer]
            - button "+3" [ref=e179] [cursor=pointer]
            - button "FOUL" [ref=e180] [cursor=pointer]
            - button "SUB" [ref=e181] [cursor=pointer]
        - generic [ref=e182]:
          - generic [ref=e183]:
            - generic [ref=e184]: "#9"
            - generic: Santiago Scala
            - generic [ref=e185]: 0F
          - generic [ref=e186]:
            - button "+1" [ref=e187] [cursor=pointer]
            - button "+2" [ref=e188] [cursor=pointer]
            - button "+3" [ref=e189] [cursor=pointer]
            - button "FOUL" [ref=e190] [cursor=pointer]
            - button "SUB" [ref=e191] [cursor=pointer]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('FIBA Scoreboard - Fluxo de Tempo e Períodos', () => {
  4  |   
  5  |   test.beforeEach(async ({ page }) => {
  6  |     await page.goto('/mesa-de-jogo/');
  7  |     // Desativa animações para estabilidade nos testes
  8  |     await page.addStyleTag({ content: `
  9  |       *, *::before, *::after {
  10 |         animation-duration: 0s !important;
  11 |         animation-iteration-count: 1 !important;
  12 |         transition-duration: 0s !important;
  13 |         scroll-behavior: auto !important;
  14 |       }
  15 |     `});
  16 |     await page.locator('#mock-data-btn').click();
  17 |     await page.locator('#start-match-btn').click();
  18 |   });
  19 | 
  20 |   test('deve bloquear substituição com cronômetro rodando e permitir com ele parado', async ({ page }) => {
  21 |     // 1. Liga o cronômetro
  22 |     await page.locator('#toggle-clock-btn').click();
  23 |     await expect(page.locator('#toggle-clock-btn')).toHaveText('PAUSE');
  24 | 
  25 |     // 2. Tenta abrir SUB
  26 |     const firstSubBtn = page.locator('.team-panel.home').getByRole('button', { name: 'SUB' }).first();
  27 |     await firstSubBtn.click();
  28 | 
  29 |     // Valida que o modal NÃO está ativo e apareceu toast de erro
  30 |     await expect(page.locator('#sub-modal')).not.toHaveClass(/active/);
  31 |     await expect(page.locator('.toast.error')).toContainText('bola morta');
  32 | 
  33 |     // 3. Para o cronômetro
  34 |     await page.locator('#toggle-clock-btn').click();
  35 |     await expect(page.locator('#toggle-clock-btn')).toHaveText('START');
  36 | 
  37 |     // 4. Abre SUB novamente
  38 |     await firstSubBtn.click();
  39 |     await expect(page.locator('#sub-modal')).toHaveClass(/active/);
  40 |   });
  41 | 
  42 |   test('deve resetar o shot clock para 24s e 14s corretamente', async ({ page }) => {
  43 |     const shotClock = page.locator('#shot-clock');
  44 |     
  45 |     // Reset 14s
  46 |     await page.locator('#reset-14-btn').click();
  47 |     await expect(shotClock).toHaveText('14');
  48 | 
  49 |     // Reset 24s
  50 |     await page.locator('#reset-24-btn').click();
  51 |     await expect(shotClock).toHaveText('24');
  52 |   });
  53 | 
  54 |   test('deve avançar o período, resetar relógios e faltas coletivas', async ({ page }) => {
  55 |     // 1. Adiciona faltas coletivas (Time Casa)
  56 |     const homePlayerCard = page.locator('#home-active-players .player-match-card').first();
  57 |     const foulBtn = homePlayerCard.getByRole('button', { name: 'FOUL' });
  58 |     await foulBtn.click();
  59 |     await foulBtn.click();
  60 |     
  61 |     await expect(page.locator('#fouls-home')).toHaveText('2');
  62 | 
  63 |     // 2. FFW para os últimos 10s e deixa zerar
  64 |     await page.locator('#fast-forward-btn').click();
  65 |     await page.locator('#toggle-clock-btn').click(); // Inicia o relógio
  66 |     
  67 |     // Aguarda o relógio zerar (leva aprox 10 segundos no Fast Forward)
  68 |     await expect(page.locator('#game-clock')).toHaveText('0:00', { timeout: 12000 });
  69 | 
  70 |     // 3. Avança o período
  71 |     await page.locator('#next-period-btn').click();
  72 |     
  73 |     // Valida novo período e reset de faltas
> 74 |     await expect(page.locator('#display-period')).toHaveText('2');
     |                                                   ^ Error: expect(locator).toHaveText(expected) failed
  75 |     await expect(page.locator('#fouls-home')).toHaveText('0');
  76 |     
  77 |     // Valida reset dos relógios
  78 |     await expect(page.locator('#game-clock')).toHaveText('10:00');
  79 |     await expect(page.locator('#shot-clock')).toHaveText('24');
  80 |     
  81 |     // Valida notificação específica
  82 |     await expect(page.locator('#toast-container').getByText('Faltas coletivas zeradas')).toBeVisible();
  83 |   });
  84 | });
  85 | 
```