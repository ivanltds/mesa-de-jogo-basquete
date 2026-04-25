import { EVENT_TYPES } from './event-types.js';

export function computeDerivedState(state) {
    const home = state.teams.home.score;
    const away = state.teams.away.score;
    const scoreDiff = Math.abs(home - away);
    const leader = home === away ? null : home > away ? 'home' : 'away';
    
    // Fire Mode: advantage >= 15 points
    const fireMode = scoreDiff >= 15;
    const fireTeam = leader;

    // Streak detection
    const scoreEvents = (state.events || []).filter(e => e.type === EVENT_TYPES.SCORE_MADE && !e.reverted);
    let scoreStreak = 0;
    let streakTeam = null;

    if (scoreEvents.length > 0) {
        const lastTeam = scoreEvents[scoreEvents.length - 1].payload.teamKey;
        streakTeam = lastTeam;
        for (let i = scoreEvents.length - 1; i >= 0; i--) {
            if (scoreEvents[i].payload.teamKey === lastTeam) {
                scoreStreak++;
            } else {
                break;
            }
        }
    }

    // Clutch: last 2 minutes (120,000 ms), 4th period or OT, score difference <= 6
    const isLastTwoMinutes = state.clock <= 120000;
    const isClutchPeriod = state.period >= 4 || typeof state.period === 'string' && state.period.startsWith('OT');
    const clutch = isClutchPeriod && isLastTwoMinutes && scoreDiff <= 6;

    return {
        ...state.derived,
        scoreDiff,
        leader,
        clutch,
        fireMode,
        fireTeam,
        scoreStreak,
        streakTeam,
        lastEventType: state.events?.at(-1)?.type ?? null,
        recentEvents: state.events?.slice(-5).map(e => e.type) || []
    };
}
