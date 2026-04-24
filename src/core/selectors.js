// src/core/selectors.js

export function computeDerivedState(state) {
    const home = state.teams.home.score;
    const away = state.teams.away.score;
    const scoreDiff = Math.abs(home - away);
    const leader = home === away ? null : home > away ? 'home' : 'away';
    
    // Clutch: last 2 minutes (120,000 ms), 4th period or OT, score difference <= 6
    const isLastTwoMinutes = state.clock <= 120000;
    const isClutchPeriod = state.period >= 4 || typeof state.period === 'string' && state.period.startsWith('OT');
    const clutch = isClutchPeriod && isLastTwoMinutes && scoreDiff <= 6;

    return {
        ...state.derived,
        scoreDiff,
        leader,
        clutch,
        lastEventType: state.events.at(-1)?.type ?? null,
        recentEvents: state.events.slice(-5).map(e => e.type)
    };
}
