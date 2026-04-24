// src/ui/ui-manager.js
import { gameState } from '../core/game-state.js';
import { AudioPlaybackQueue as SoundManager } from '../audio/audio-playback-queue.js';

export const UIManager = {
    renderReport() {
        const content = document.getElementById('report-content');
        if (!content) return;

        let html = '';
        ['home', 'away'].forEach(teamKey => {
            const team = gameState.teams[teamKey];
            html += `
                <div class="report-team-section">
                    <h2 style="color: ${team.color}">${team.name} - ${team.score} PTS</h2>
                    <table class="report-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>NOME</th>
                                <th>PTS</th>
                                <th>F</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${team.players.map(p => `
                                <tr>
                                    <td>${p.number}</td>
                                    <td>${p.name}</td>
                                    <td>${p.points}</td>
                                    <td>${p.fouls}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        });
        content.innerHTML = html;
    },

    switchScreen(screenId) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById(screenId).classList.add('active');
        
        // Sincroniza visibilidade de ferramentas de dev
        const app = document.getElementById('app');
        if (app) app.className = `screen-context-${screenId}`;

        if (screenId === 'match-screen') this.initMatchUI();
    },

    showVictoryModal(winnerKey) {
        const modal = document.getElementById('victory-modal');
        const winner = gameState.teams[winnerKey];
        const card = document.getElementById('victory-card');
        
        document.getElementById('victory-winner-name').innerText = `${winner.name} VENCEU!`;
        document.getElementById('victory-home-score').innerText = gameState.teams.home.score;
        document.getElementById('victory-away-score').innerText = gameState.teams.away.score;
        document.getElementById('v-home-name').innerText = gameState.teams.home.name;
        document.getElementById('v-away-name').innerText = gameState.teams.away.name;
        
        card.style.boxShadow = `0 0 100px rgba(0, 0, 0, 0.9), inset 0 0 50px ${winner.color}44`;
        document.getElementById('victory-winner-name').style.color = winner.color;
        
        modal.classList.add('active');
        
        if (window.confetti) {
            const colors = [winner.color, '#ffffff', '#ffd700'];
            const duration = 5 * 1000;
            const end = Date.now() + duration;

            (function frame() {
                window.confetti({
                    particleCount: 5,
                    angle: 60,
                    spread: 55,
                    origin: { x: 0 },
                    colors: colors,
                    zIndex: 10000
                });
                window.confetti({
                    particleCount: 5,
                    angle: 120,
                    spread: 55,
                    origin: { x: 1 },
                    colors: colors,
                    zIndex: 10000
                });

                if (Date.now() < end) {
                    requestAnimationFrame(frame);
                }
            }());
        }
    },

    initMatchUI() {
        document.getElementById('display-home-name').innerText = gameState.teams.home.name;
        document.getElementById('display-away-name').innerText = gameState.teams.away.name;
        
        const hPanel = document.querySelector('.team-panel.home');
        const aPanel = document.querySelector('.team-panel.away');
        if (hPanel) hPanel.style.setProperty('--team-color', gameState.teams.home.color);
        if (aPanel) aPanel.style.setProperty('--team-color', gameState.teams.away.color);
        
        this.updateScoreboard();
    },

    updateScoreboard() {
        const hScore = document.getElementById('home-score');
        const aScore = document.getElementById('away-score');
        if (hScore) {
            hScore.innerText = gameState.teams.home.score;
            hScore.style.color = gameState.teams.home.color;
        }
        if (aScore) {
            aScore.innerText = gameState.teams.away.score;
            aScore.style.color = gameState.teams.away.color;
        }

        const hFouls = document.getElementById('fouls-home');
        const aFouls = document.getElementById('fouls-away');
        if (hFouls) hFouls.innerText = gameState.teams.home.fouls;
        if (aFouls) aFouls.innerText = gameState.teams.away.fouls;
        
        const homeBonus = document.getElementById('home-bonus');
        const awayBonus = document.getElementById('away-bonus');
        if (homeBonus) {
            homeBonus.classList.toggle('active', gameState.teams.home.fouls >= 4);
            homeBonus.style.background = gameState.teams.home.fouls >= 4 ? gameState.teams.home.color : 'transparent';
        }
        if (awayBonus) {
            awayBonus.classList.toggle('active', gameState.teams.away.fouls >= 4);
            awayBonus.style.background = gameState.teams.away.fouls >= 4 ? gameState.teams.away.color : 'transparent';
        }

        ['home', 'away'].forEach(t => {
            const container = document.getElementById(`${t}-timeouts`);
            if (container) {
                const dots = container.querySelectorAll('.dot');
                dots.forEach((dot, i) => {
                    dot.classList.toggle('active', i < gameState.teams[t].timeouts);
                });
            }
        });

        this.renderActivePlayers('home');
        this.renderActivePlayers('away');
        const periodDisplay = document.getElementById('display-period');
        if (periodDisplay) periodDisplay.innerText = gameState.period;

        const arrow = document.getElementById('possession-arrow');
        if (arrow) {
            arrow.className = `possession-indicator ${gameState.possession}`;
        }

        this.updateLog();
        this.updateClocks();
        if (window.saveState) window.saveState();
    },

    renderSoundQueue() {
        const queueContainer = document.getElementById('audio-queue');
        const djQueueContainer = document.getElementById('dj-audio-queue');
        if (!queueContainer && !djQueueContainer) return;

        let html = '';
        
        // Show currently playing
        if (SoundManager.currentItem) {
            html += `
                <div class="queue-item playing dj-queue-item">
                    <span class="q-icon">🔊</span>
                    <span class="q-cat">${SoundManager.currentItem.category.toUpperCase()}</span>
                    <span class="q-file">${SoundManager.currentItem.file}</span>
                    <span class="q-status">TOCANDO</span>
                </div>
            `;
        }

        // Show pending
        html += SoundManager.queue.map(item => `
            <div class="queue-item dj-queue-item ${item.priority >= 10 ? 'high-priority' : ''}">
                <span class="q-icon">${item.priority >= 10 ? '🔥' : '⏳'}</span>
                <span class="q-cat">${item.category.toUpperCase()}</span>
                <span class="q-file">${item.file}</span>
                <span class="q-remove" onclick="SoundManager.removeFromQueue('${item.id}')">✖</span>
            </div>
        `).join('');

        if (queueContainer) queueContainer.innerHTML = html || 'Fila vazia';
        if (djQueueContainer) djQueueContainer.innerHTML = html || 'Fila vazia';
    },

    renderSoundboard() {
        const container = document.getElementById('dj-pads-grid');
        if (!container) return;
        let html = '';
        for (const cat in SoundManager.library) {
            const files = SoundManager.library[cat];
            if (!Array.isArray(files)) continue;
            html += `
                <div class="dj-cat-block">
                    <h2>${cat.toUpperCase()}</h2>
                    <div class="dj-pads-grid">
                        ${files.map(f => {
                            const escapedFile = f.replace(/'/g, "\\'");
                            return `<button class="dj-pad ${cat}" onclick="SoundManager.playFile('${escapedFile}')" title="${f}"></button>`;
                        }).join('')}
                    </div>
                </div>
            `;
        }
        container.innerHTML = html;
    },

    updateClocks() {
        const gc = document.getElementById('game-clock');
        const sc = document.getElementById('shot-clock');
        if (!gc || !sc) return;

        const mins = Math.floor(gameState.clock / 60000);
        const secs = Math.floor((gameState.clock % 60000) / 1000);
        gc.innerText = `${mins}:${secs.toString().padStart(2, '0')}`;
        sc.innerText = Math.ceil(gameState.shotClock / 1000);
        
        const toggleBtn = document.getElementById('toggle-clock-btn');
        if (toggleBtn) toggleBtn.innerText = gameState.isActive ? "PAUSE" : "START";
    },

    renderActivePlayers(teamKey) {
        const container = document.getElementById(`${teamKey}-active-players`);
        if (!container) return;
        const team = gameState.teams[teamKey];
        const active = team.players.filter(p => p.inCourt);
        
        container.innerHTML = active.map(p => {
            const isExcluded = p.fouls >= 5;
            return `
                <div class="player-match-card ${isExcluded ? 'excluded' : ''}" style="border-color: ${isExcluded ? '#ff0000' : 'var(--team-color)'}">
                    <div class="p-info">
                        <span class="p-num" style="color: ${isExcluded ? '#ff0000' : 'var(--team-color)'}">#${p.number}</span>
                        <span class="p-name">${p.name}</span>
                        <span class="p-fouls" style="color: ${isExcluded ? '#ff0000' : 'inherit'}">${p.fouls}F ${isExcluded ? '🚫' : ''}</span>
                    </div>
                    <div class="player-actions">
                        <button class="btn btn-xs btn-team" ${isExcluded ? 'disabled' : ''} onclick="window.addPoints('${teamKey}', '${p.number}', 1)">+1</button>
                        <button class="btn btn-xs btn-team" ${isExcluded ? 'disabled' : ''} onclick="window.addPoints('${teamKey}', '${p.number}', 2)">+2</button>
                        <button class="btn btn-xs btn-team" ${isExcluded ? 'disabled' : ''} onclick="window.addPoints('${teamKey}', '${p.number}', 3)">+3</button>
                        <button class="btn btn-xs btn-team btn-warning" ${isExcluded ? 'disabled' : ''} onclick="window.addFoul('${teamKey}', '${p.number}')">FOUL</button>
                        <button class="btn btn-xs btn-team btn-danger" onclick="window.openSubModal('${teamKey}', '${p.number}')">SUB</button>
                    </div>
                </div>
            `;
        }).join('');
    },

    renderPlayerList(teamKey) {
        const list = document.getElementById(`${teamKey}-players-list`);
        if (!list) return;
        list.innerHTML = gameState.teams[teamKey].players.map((p, i) => `
            <div class="player-row">
                <div class="p-info">
                    <span class="p-num-badge">${p.number}</span>
                    <span class="p-name">${p.name}</span>
                </div>
                <button class="btn btn-danger btn-xs" onclick="window.removePlayer('${teamKey}', ${i})">✖</button>
            </div>
        `).join('');
        if (window.saveState) window.saveState();
    },

    updateLog() {
        const log = document.getElementById('event-log');
        if (!log) return;
        log.innerHTML = gameState.events.slice(-15).map(e => `
            <div class="log-entry ${e.reverted ? 'reverted' : ''}">
                <div class="log-entry-content">
                    <span class="log-icon">${e.icon}</span>
                    <span class="log-text" style="${e.reverted ? 'text-decoration: line-through; opacity: 0.5;' : ''}">${e.message}</span>
                </div>
                <button class="btn btn-xs ${e.reverted ? 'btn-success' : ''}" onclick="window.revertEvent('${e.id}')" title="${e.reverted ? 'Restaurar' : 'Reverter'}">
                    ${e.reverted ? '✅' : '🚫'}
                </button>
            </div>
        `).reverse().join('');
    },

    renderSubLists(subState) {
        const team = gameState.teams[subState.teamKey];
        const inCourtList = document.getElementById('players-in-court');
        const onBenchList = document.getElementById('players-on-bench');
        if (!inCourtList || !onBenchList) return;
        
        inCourtList.innerHTML = team.players.filter(p => p.inCourt).map(p => `
            <div class="sub-item ${subState.outPlayerNum === p.number ? 'selected' : ''}" onclick="window.selectSubPlayer('out', '${p.number}')">
                #${p.number} ${p.name}
            </div>
        `).join('');

        onBenchList.innerHTML = team.players.filter(p => !p.inCourt).map(p => {
            const isExcluded = p.fouls >= 5;
            return `
                <div class="sub-item ${subState.inPlayerNum === p.number ? 'selected' : ''} ${isExcluded ? 'excluded' : ''}" 
                     onclick="${isExcluded ? '' : `window.selectSubPlayer('in', '${p.number}')`}">
                    <span class="sub-num">#${p.number}</span>
                    <span class="sub-name">${p.name}</span>
                    <span class="sub-fouls">${p.fouls}F ${isExcluded ? '🚫' : ''}</span>
                </div>
            `;
        }).join('');
    }
};
