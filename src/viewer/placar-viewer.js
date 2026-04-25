import { computeDerivedState } from '../core/selectors.js';

const viewerState = {
    lastScoreHome: -1,
    lastScoreAway: -1,
    lastEventId: null,
    cachedState: null
};

function formatTime(ms) {
    if (ms < 0) ms = 0;
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function updateViewer() {
    const rawData = localStorage.getItem('ritmo_de_jogo_state');
    if (!rawData) return;

    try {
        const state = JSON.parse(rawData);
        viewerState.cachedState = state;
        const derived = computeDerivedState(state);

        // Initial setup for first run
        if (viewerState.lastScoreHome === -1) {
            viewerState.lastScoreHome = state.teams.home.score;
            viewerState.lastScoreAway = state.teams.away.score;
            viewerState.lastEventId = state.events.at(-1)?.id;
        }

        // Update Scores & Check for Animations
        const homeScoreEl = document.getElementById('home-score');
        const awayScoreEl = document.getElementById('away-score');

        if (state.teams.home.score > viewerState.lastScoreHome) {
            triggerScoreAnimation('home', state.teams.home.name);
        }
        if (state.teams.away.score > viewerState.lastScoreAway) {
            triggerScoreAnimation('away', state.teams.away.name);
        }
        
        viewerState.lastScoreHome = state.teams.home.score;
        viewerState.lastScoreAway = state.teams.away.score;

        homeScoreEl.innerText = state.teams.home.score;
        awayScoreEl.innerText = state.teams.away.score;

        // Update Names & Colors
        document.getElementById('home-name').innerText = state.teams.home.name;
        document.getElementById('away-name').innerText = state.teams.away.name;
        document.getElementById('viewer-home').style.color = state.teams.home.color;
        document.getElementById('viewer-away').style.color = state.teams.away.color;

        // Smooth Clock Rendering
        renderSmoothClocks(state);

        const periodText = typeof state.period === 'number' ? `${state.period}º PERÍODO` : state.period;
        document.getElementById('viewer-period').innerText = periodText;

        // Fire Mode
        const fireBanner = document.getElementById('fire-banner');
        const homeSection = document.getElementById('viewer-home');
        const awaySection = document.getElementById('viewer-away');

        fireBanner.classList.toggle('active', derived.fireMode);
        if (derived.fireMode) {
            const teamName = state.teams[derived.fireTeam].name;
            document.getElementById('fire-text').innerText = `${teamName.toUpperCase()} EM FOGO! 🔥🔥🔥`;
            homeSection.classList.toggle('on-fire', derived.fireTeam === 'home');
            awaySection.classList.toggle('on-fire', derived.fireTeam === 'away');
        } else {
            homeSection.classList.remove('on-fire');
            awaySection.classList.remove('on-fire');
        }

        // Streaks
        const homeStreak = document.getElementById('home-streak');
        const awayStreak = document.getElementById('away-streak');

        homeStreak.classList.toggle('active', derived.streakTeam === 'home' && derived.scoreStreak >= 3);
        awayStreak.classList.toggle('active', derived.streakTeam === 'away' && derived.scoreStreak >= 3);
        
        if (derived.scoreStreak >= 3) {
            const el = derived.streakTeam === 'home' ? homeStreak : awayStreak;
            el.innerText = `🔥 ${derived.scoreStreak} CESTAS SEGUIDAS!`;
        }

        // Timeout Overlay
        const timeoutOverlay = document.getElementById('timeout-overlay');
        timeoutOverlay.classList.toggle('active', state.isTimeoutActive);
        if (state.isTimeoutActive) {
            const lastTimeoutEvent = state.events.filter(e => e.type === 'timeout').at(-1);
            if (lastTimeoutEvent) {
                const teamKey = lastTimeoutEvent.payload.teamKey;
                document.getElementById('timeout-team-title').innerText = `TEMPO: ${state.teams[teamKey].name}`;
            }
        }

        // Check for generic events (Fouls/Subs)
        const lastEvent = state.events.at(-1);
        if (lastEvent && lastEvent.id !== viewerState.lastEventId) {
            viewerState.lastEventId = lastEvent.id;
            
            if (lastEvent.type === 'foul.personal') {
                triggerEventAnimation('FALTA!', lastEvent.payload.playerName || `JOGADOR #${lastEvent.payload.playerNum}`, '⚠️');
            } else if (lastEvent.type === 'substitution') {
                const inName = lastEvent.payload.playerNameIn || `#${lastEvent.payload.pInNum}`;
                const outName = lastEvent.payload.playerNameOut || `#${lastEvent.payload.pOutNum}`;
                triggerEventAnimation('SUBSTITUIÇÃO', `${inName} ↔ ${outName}`, '🔄');
            }
        }

    } catch (e) {
        console.error("Error updating viewer:", e);
    }
}

function renderSmoothClocks(state) {
    let currentClock = state.clock;
    let currentShotClock = state.shotClock;
    let currentTimeoutClock = state.timeoutClock;

    if (state.isActive) {
        const now = Date.now();
        const elapsedSinceLastUpdate = now - (state.lastUpdate || now);
        
        if (state.isTimeoutActive) {
            currentTimeoutClock = Math.max(0, state.timeoutClock - elapsedSinceLastUpdate);
        } else {
            currentClock = Math.max(0, state.clock - elapsedSinceLastUpdate);
            currentShotClock = Math.max(0, state.shotClock - elapsedSinceLastUpdate);
        }
    }

    document.getElementById('viewer-clock').innerText = formatTime(currentClock);
    document.getElementById('viewer-shot-clock').innerText = Math.ceil(currentShotClock / 1000);
    document.getElementById('timeout-timer').innerText = formatTime(currentTimeoutClock);
}

function triggerScoreAnimation(teamKey, teamName) {
    const overlay = document.getElementById('score-overlay');
    const text = document.getElementById('overlay-text');
    
    text.innerText = `CESTA ${teamName.toUpperCase()}!`;
    
    overlay.classList.remove('active');
    void overlay.offsetWidth; // Trigger reflow
    overlay.classList.add('active');
}

function triggerEventAnimation(title, subtitle, icon) {
    const overlay = document.getElementById('event-overlay');
    document.getElementById('event-title').innerText = title;
    document.getElementById('event-subtitle').innerText = subtitle;
    document.getElementById('event-icon').innerText = icon;

    overlay.classList.remove('active');
    void overlay.offsetWidth; // Trigger reflow
    overlay.classList.add('active');
}

// Initial update
updateViewer();

// Listen for storage changes
window.addEventListener('storage', (e) => {
    if (e.key === 'ritmo_de_jogo_state') {
        updateViewer();
    }
});

// Run at 60fps for smooth clock
function animationLoop() {
    if (viewerState.cachedState) {
        renderSmoothClocks(viewerState.cachedState);
    }
    requestAnimationFrame(animationLoop);
}
requestAnimationFrame(animationLoop);

// Still poll for state changes
setInterval(updateViewer, 500);
