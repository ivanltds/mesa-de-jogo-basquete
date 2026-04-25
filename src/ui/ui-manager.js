// src/ui/ui-manager.js
import { gameState } from '../core/game-state.js';
import { AudioPlaybackQueue as SoundManager } from '../audio/audio-playback-queue.js';
import { INITIAL_AUDIO_PROFILES } from '../audio/audio-profiles.js';
import { AudioDecisionEngine } from '../audio/audio-decision-engine.js';
import { AUDIO_CATALOG } from '../audio/audio-catalog.js';
import { AudioScoringUtils } from '../audio/audio-scoring-utils.js';
import { EVENT_TYPES } from '../core/event-types.js';

export const UIManager = {
    // ... (keep all existing methods)
    updateColorPreview(teamKey, color) {
        const preview = document.getElementById(`${teamKey}-color-preview`);
        if (preview) {
            preview.style.background = color;
        }
        // Dispatch to ensure saveState picks it up if needed
        const input = document.getElementById(`${teamKey}-color`);
        if (input) {
            input.value = color;
        }
    },

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
        const target = document.getElementById(screenId);
        if (target) target.classList.add('active');
        
        // Sincroniza visibilidade de ferramentas de dev
        const app = document.getElementById('app');
        if (app) app.className = `screen-context-${screenId}`;

        // Atualiza estado global da tela ativa
        gameState.ui.previousScreenId = gameState.ui.activeScreenId;
        gameState.ui.activeScreenId = screenId;

        if (screenId === 'match-screen') this.initMatchUI();
        if (window.saveState) window.saveState();
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
                    <div style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <span class="q-icon">🔊</span>
                            <span class="q-cat">${SoundManager.currentItem.category.toUpperCase()}</span>
                            <span class="q-file">${SoundManager.currentItem.file}</span>
                        </div>
                        <span class="q-status">TOCANDO</span>
                    </div>
                    <div class="playback-container">
                        <div class="playback-progress" id="playback-bar-main"></div>
                    </div>
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

        const emptyMsg = '<div class="empty-state">Fila vazia</div>';
        if (queueContainer) queueContainer.innerHTML = html || emptyMsg;
        if (djQueueContainer) djQueueContainer.innerHTML = html || emptyMsg;
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
                            return `<button class="dj-pad ${cat}" onclick="window.triggerManualAudio('${cat}', '${escapedFile}')" title="${f}"></button>`;
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
        if (toggleBtn) {
            toggleBtn.innerText = gameState.isActive ? "PAUSE" : "START";
            toggleBtn.classList.toggle('pulse-attention', !gameState.isActive);
            toggleBtn.classList.toggle('btn-running', gameState.isActive);
        }
    },

    renderActivePlayers(teamKey) {
        const container = document.getElementById(`${teamKey}-active-players`);
        if (!container) return;
        const team = gameState.teams[teamKey];
        const active = team.players.filter(p => p.inCourt);
        
        container.innerHTML = active.map(p => {
            const isExcluded = p.fouls >= 5;
            const isWarning = p.fouls === 4;
            
            return `
                <div class="player-match-card ${isExcluded ? 'excluded' : ''}" style="border-left: 4px solid ${team.color}">
                    <div class="p-info">
                        <div class="p-meta">
                            <span class="p-num" style="color: ${team.color}">#${p.number}</span>
                            <span class="p-name">${p.name}</span>
                        </div>
                        <div class="p-fouls-container" style="text-align: right;">
                            <div style="font-size: 0.6rem; opacity: 0.6; font-weight: 800; margin-bottom: 2px;">FALTAS</div>
                            <div class="p-fouls-badge ${isExcluded ? 'danger' : (isWarning ? 'warning' : '')}">
                                ${p.fouls}${isExcluded ? ' 🚫' : ''}
                            </div>
                        </div>
                    </div>
                    <div class="player-actions">
                        <button class="btn btn-xs btn-team" style="background: ${team.color}11; color: white; border: 1px solid ${team.color}44" ${isExcluded ? 'disabled' : ''} onclick="window.addPoints('${teamKey}', '${p.number}', 1)">+1</button>
                        <button class="btn btn-xs btn-team" style="background: ${team.color}11; color: white; border: 1px solid ${team.color}44" ${isExcluded ? 'disabled' : ''} onclick="window.addPoints('${teamKey}', '${p.number}', 2)">+2</button>
                        <button class="btn btn-xs btn-team" style="background: ${team.color}11; color: white; border: 1px solid ${team.color}44" ${isExcluded ? 'disabled' : ''} onclick="window.addPoints('${teamKey}', '${p.number}', 3)">+3</button>
                        <button class="btn btn-xs btn-team btn-warning" ${isExcluded ? 'disabled' : ''} onclick="window.addFoul('${teamKey}', '${p.number}')">FALTA</button>
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
    },

    initAudioPolicyScreen() {
        const select = document.getElementById('policy-screen-select');
        if (!select) return;

        const profiles = gameState.audio.policies || INITIAL_AUDIO_PROFILES;
        const allowed = ['match-screen', 'soundboard-screen'];
        const entries = Object.entries(profiles).filter(([id]) => allowed.includes(id));

        // Fill screen tiles
        const nav = document.getElementById('policy-screen-selector');
        select.innerHTML = entries.map(([id, p]) => `
            <option value="${id}">${p.name}</option>
        `).join('');

        if (nav) {
            nav.innerHTML = entries.map(([id, p]) => `
                <div class="screen-tile ${select.value === id ? 'active' : ''}" 
                     data-id="${id}" 
                     onclick="UIManager.selectPolicyScreen('${id}')">
                    ${p.name}
                </div>
            `).join('');
        }

        // Fill categories in all selects
        const cats = Object.keys(SoundManager.library);
        const catOptions = ['<option value="">Nenhum</option>']
            .concat(cats.map(c => `<option value="${c}">${c.toUpperCase()}</option>`))
            .join('');

        const allSelects = [
            'score-map-1', 'score-map-2', 'score-map-3',
            'event-map-posse_24', 'event-map-posse_14', 
            'event-map-foul', 'event-map-sub', 'event-map-timeout',
            'event-map-period_end', 'event-map-countdown_1m', 'event-map-countdown_24s', 'event-map-countdown_10s', 'event-map-game_end'
        ];

        allSelects.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.innerHTML = catOptions;
        });

        // Listener for screen change
        select.onchange = () => this.loadPolicyForScreen(select.value);

        // Save button
        document.getElementById('save-policy-btn').onclick = () => this.saveCurrentPolicy();

        // Setup switch toggles
        const setupSwitch = (id, checkId) => {
            const el = document.getElementById(id);
            const check = document.getElementById(checkId);
            if (el && check) {
                el.onclick = () => {
                    check.checked = !check.checked;
                    el.classList.toggle('active', check.checked);
                };
            }
        };
        setupSwitch('toggle-auto-audio', 'policy-allow-auto');
        setupSwitch('toggle-manual-priority', 'policy-manual-priority');

        // Load default (first)
        this.loadPolicyForScreen(select.value);
    },

    loadPolicyForScreen(screenId) {
        const profiles = gameState.audio.policies || INITIAL_AUDIO_PROFILES;
        const profile = profiles[screenId];
        if (!profile) return;

        // Update Tiles
        document.querySelectorAll('.screen-tile').forEach(t => {
            t.classList.toggle('active', t.dataset.id === screenId);
        });

        // Atualiza switches visuais
        document.getElementById('policy-allow-auto').checked = profile.allowAutomaticAudio;
        document.getElementById('policy-manual-priority').checked = profile.manualPriority;
        document.getElementById('toggle-auto-audio').classList.toggle('active', profile.allowAutomaticAudio);
        document.getElementById('toggle-manual-priority').classList.toggle('active', profile.manualPriority);

        // Conditional Visibility
        const isMatch = screenId === 'match-screen';
        const cardBehavior = document.getElementById('card-behavior');
        const cardEvents = document.getElementById('card-events-unified');
        
        if (cardBehavior) cardBehavior.style.display = isMatch ? 'block' : 'none';
        if (cardEvents) cardEvents.style.display = isMatch ? 'block' : 'none';

        // Update Grid Layout if needed
        const grid = document.querySelector('.policy-main-grid');
        if (grid) {
            grid.style.gridTemplateColumns = isMatch ? '1fr 1fr' : '1fr';
        }

        // Score map
        document.getElementById('score-map-1').value = profile.scoreCategories?.[1] || '';
        document.getElementById('score-map-2').value = profile.scoreCategories?.[2] || '';
        document.getElementById('score-map-3').value = profile.scoreCategories?.[3] || '';

        // Event map
        const eventKeys = [
            'posse_24', 'posse_14', 'foul', 'sub', 'timeout',
            'period_end', 'countdown_1m', 'countdown_24s', 'countdown_10s', 'game_end'
        ];
        eventKeys.forEach(k => {
            const el = document.getElementById(`event-map-${k}`);
            if (el) el.value = profile.eventCategories?.[k] || '';
        });

        // Category toggles (Mood Grid)
        const cats = Object.keys(SoundManager.library);
        const container = document.getElementById('category-toggles');
        container.innerHTML = cats.map(cat => {
            const isBlocked = profile.blockedCategories.includes(cat);
            return `
                <div class="mood-badge ${!isBlocked ? 'active' : ''}" onclick="UIManager.toggleCategoryPolicy('${screenId}', '${cat}')">
                    <div class="mood-status"></div>
                    <span>${cat.toUpperCase()}</span>
                </div>
            `;
        }).join('');
    },

    selectPolicyScreen(screenId) {
        const select = document.getElementById('policy-screen-select');
        if (select) {
            select.value = screenId;
            this.loadPolicyForScreen(screenId);
        }
    },

    toggleCategoryPolicy(screenId, cat) {
        if (!gameState.audio.policies) {
            gameState.audio.policies = JSON.parse(JSON.stringify(INITIAL_AUDIO_PROFILES));
        }
        const profile = gameState.audio.policies[screenId];
        if (profile.blockedCategories.includes(cat)) {
            profile.blockedCategories = profile.blockedCategories.filter(c => c !== cat);
        } else {
            profile.blockedCategories.push(cat);
        }
        this.loadPolicyForScreen(screenId);
    },

    saveCurrentPolicy() {
        const screenId = document.getElementById('policy-screen-select').value;
        const profile = gameState.audio.policies[screenId];

        profile.allowAutomaticAudio = document.getElementById('policy-allow-auto').checked;
        profile.manualPriority = document.getElementById('policy-manual-priority').checked;

        if (!profile.scoreCategories) profile.scoreCategories = {};
        profile.scoreCategories[1] = document.getElementById('score-map-1').value || null;
        profile.scoreCategories[2] = document.getElementById('score-map-2').value || null;
        profile.scoreCategories[3] = document.getElementById('score-map-3').value || null;

        if (!profile.eventCategories) profile.eventCategories = {};
        const eventKeys = [
            'posse_24', 'posse_14', 'foul', 'sub', 'timeout',
            'period_end', 'countdown_1m', 'countdown_24s', 'countdown_10s', 'game_end'
        ];
        eventKeys.forEach(k => {
            const el = document.getElementById(`event-map-${k}`);
            if (el) profile.eventCategories[k] = el.value || null;
        });

        window.saveState();
        window.notify("Ajustes salvos com sucesso");
    },

    // --- GESTÃO DE SCORE ---

    initAudioScoringScreen() {
        this.populateScoringRulesForm();

        // Rules handlers
        document.getElementById('save-rules-btn').onclick = () => this.saveScoringRules();
        document.getElementById('reset-rules-btn').onclick = () => this.resetScoringRules();

        // Simulator handlers
        const eventTypeSelect = document.getElementById('sim-event-type');
        eventTypeSelect.onchange = () => {
            document.getElementById('sim-payload-score').style.display = eventTypeSelect.value === EVENT_TYPES.SCORE_MADE ? 'block' : 'none';
            document.getElementById('sim-payload-foul').style.display = eventTypeSelect.value === EVENT_TYPES.FOUL_PERSONAL ? 'block' : 'none';
        };

        document.getElementById('run-simulation-btn').onclick = () => this.runAudioScoringSimulation();
    },

    populateScoringRulesForm() {
        const rules = AudioScoringUtils.getScoringRulesSnapshot(gameState);
        const form = document.getElementById('scoring-rules-form');
        if (!form) return;

        const setVal = (name, val) => {
            const input = form.querySelector(`[name="${name}"]`);
            if (input) input.value = val;
        };

        // Context
        setVal('context.scoreMade.threePointBonus', rules.context.scoreMade.threePointBonus);
        setVal('context.scoreMade.closeGameBonus', rules.context.scoreMade.closeGameBonus);
        setVal('context.scoreMade.clutchTagBonus', rules.context.scoreMade.clutchTagBonus);
        setVal('context.shotMissed.funTagBonus', rules.context.shotMissed.funTagBonus);
        setVal('context.periodEnd.officialTagBonus', rules.context.periodEnd.officialTagBonus);
        setVal('context.gameEnd.officialTagBonus', rules.context.gameEnd.officialTagBonus);
        setVal('context.timeout.officialTagBonus', rules.context.timeout.officialTagBonus);
        setVal('context.foulPersonal.regularFoulPenalty', rules.context.foulPersonal.regularFoulPenalty);
        setVal('context.foulPersonal.exclusionOfficialBonus', rules.context.foulPersonal.exclusionOfficialBonus);

        // Recency
        setVal('recency.noRepeatBonus', rules.recency.noRepeatBonus);
        setVal('recency.repeatPenaltyPerOccurrence', rules.recency.repeatPenaltyPerOccurrence);
        setVal('recency.recentWindow', rules.recency.recentWindow);

        // Intensity
        setVal('intensity.highIntensityPeriodEndBonus', rules.intensity.highIntensityPeriodEndBonus);
        setVal('intensity.lowIntensityPeriodEndPenalty', rules.intensity.lowIntensityPeriodEndPenalty);
        setVal('intensity.highIntensityClutchBonus', rules.intensity.highIntensityClutchBonus);
        setVal('intensity.mediumIntensityDefaultBonus', rules.intensity.mediumIntensityDefaultBonus);
    },

    saveScoringRules() {
        const form = document.getElementById('scoring-rules-form');
        const rules = JSON.parse(JSON.stringify(gameState.audio.scoringRules));

        const getVal = (name) => parseInt(form.querySelector(`[name="${name}"]`).value);

        rules.context.scoreMade.threePointBonus = getVal('context.scoreMade.threePointBonus');
        rules.context.scoreMade.closeGameBonus = getVal('context.scoreMade.closeGameBonus');
        rules.context.scoreMade.clutchTagBonus = getVal('context.scoreMade.clutchTagBonus');
        rules.context.shotMissed.funTagBonus = getVal('context.shotMissed.funTagBonus');
        rules.context.periodEnd.officialTagBonus = getVal('context.periodEnd.officialTagBonus');
        rules.context.gameEnd.officialTagBonus = getVal('context.gameEnd.officialTagBonus');
        rules.context.timeout.officialTagBonus = getVal('context.timeout.officialTagBonus');
        rules.context.foulPersonal.regularFoulPenalty = getVal('context.foulPersonal.regularFoulPenalty');
        rules.context.foulPersonal.exclusionOfficialBonus = getVal('context.foulPersonal.exclusionOfficialBonus');

        rules.recency.noRepeatBonus = getVal('recency.noRepeatBonus');
        rules.recency.repeatPenaltyPerOccurrence = getVal('recency.repeatPenaltyPerOccurrence');
        rules.recency.recentWindow = getVal('recency.recentWindow');

        rules.intensity.highIntensityPeriodEndBonus = getVal('intensity.highIntensityPeriodEndBonus');
        rules.intensity.lowIntensityPeriodEndPenalty = getVal('intensity.lowIntensityPeriodEndPenalty');
        rules.intensity.highIntensityClutchBonus = getVal('intensity.highIntensityClutchBonus');
        rules.intensity.mediumIntensityDefaultBonus = getVal('intensity.mediumIntensityDefaultBonus');

        gameState.audio.scoringRules = rules;
        window.saveState();
        window.notify("Critérios de escolha atualizados!");
    },

    resetScoringRules() {
        AudioScoringUtils.resetScoringRules(gameState);
        this.populateScoringRulesForm();
        window.notify("Os ajustes voltaram para o padrão.");
    },

    runAudioScoringSimulation() {
        const form = document.getElementById('simulation-form');
        const formData = new FormData(form);
        const values = Object.fromEntries(formData.entries());
        
        // Handle checkboxes/radios not in entries if unchecked
        values.clutch = form.querySelector('[name="clutch"]').checked;
        values.isExclusion = form.querySelector('[name="isExclusion"]').checked;

        const simEvent = AudioScoringUtils.buildSimulationEvent(values);
        const simState = AudioScoringUtils.buildSimulationState(values, gameState);

        const results = AudioDecisionEngine.rank({
            event: simEvent,
            state: simState,
            catalog: AUDIO_CATALOG,
            rules: gameState.audio.scoringRules
        });

        this.renderAudioScoringRanking(results);
        
        const winner = results.find(r => r.eligible);
        this.renderAudioScoringWinner(winner);
    },

    renderAudioScoringRanking(results) {
        const body = document.getElementById('ranking-body');
        const empty = document.getElementById('ranking-empty');
        if (!body) return;

        if (results.length === 0) {
            body.innerHTML = '';
            empty.style.display = 'block';
            return;
        }

        empty.style.display = 'none';
        body.innerHTML = results.map((r, i) => {
            const isWinner = i === 0 && r.eligible;
            return `
                <tr class="ranking-row ${isWinner ? 'winner' : ''} ${!r.eligible ? 'ineligible' : ''}">
                    <td>${i + 1}</td>
                    <td>
                        <div class="asset-row-header">
                            <button class="play-preview-btn" onclick="UIManager.previewAudioAsset('${r.asset.id}', '${r.asset.file}', '${r.asset.eventTypes[0]}')">▶️</button>
                            <div class="asset-info">
                                <div class="asset-id">${r.asset.id}</div>
                                <div class="asset-file">${r.asset.file}</div>
                            </div>
                        </div>
                    </td>
                    <td>${r.asset.tags.join(', ')}</td>
                    <td>${r.asset.intensity}</td>
                    <td>
                        <div class="score-cell">
                            <div class="total-score">${r.breakdown.total}</div>
                            <button class="breakdown-btn" title="Ver detalhes" onclick="this.parentElement.nextElementSibling.style.display = this.parentElement.nextElementSibling.style.display === 'none' ? 'block' : 'none'">🔍</button>
                        </div>
                        <div class="reason-list" style="display: none;">
                            ${r.breakdown.reasons.map(reason => `
                                <div class="reason-item">
                                    ${reason.label}: <span class="reason-value ${reason.value < 0 ? 'negative' : ''}">${reason.value > 0 ? '+' : ''}${reason.value}</span>
                                </div>
                            `).join('')}
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    },

    previewAudioAsset(id, file, category) {
        if (window.AudioPlaybackQueue) {
            window.AudioPlaybackQueue.addToQueue(category, file, 10, id); // High priority for preview
            window.notify(`Preview: ${id}`);
        }
    },

    renderAudioScoringWinner(result) {
        const container = document.getElementById('sim-winner-container');
        if (!container) return;

        if (!result) {
            container.innerHTML = '<div class="winner-card ineligible">Nenhum asset elegível</div>';
            return;
        }

        container.innerHTML = `
            <div class="winner-card">
                <h4>ÁUDIO ESCOLHIDO</h4>
                <div class="winner-asset-name">${result.asset.id}</div>
                <div class="winner-stats">
                    <span>Pontuação Total: <span class="winner-score-pill">${result.breakdown.total}</span></span>
                    <span>Força do Áudio: ${result.asset.intensity}</span>
                </div>
                <div class="winner-reasons" style="font-size: 0.75rem; margin-top: 1rem; color: #aaa; margin-bottom: 1rem;">
                    ${result.breakdown.reasons.slice(0, 3).map(r => r.label).join(' • ')}${result.breakdown.reasons.length > 3 ? '...' : ''}
                </div>
                <button class="btn btn-primary btn-sm full-width" 
                    onclick="UIManager.previewAudioAsset('${result.asset.id}', '${result.asset.file}', '${result.asset.eventTypes[0]}')">
                    OUVIR AGORA ▶️
                </button>
            </div>
        `;
    }
};
