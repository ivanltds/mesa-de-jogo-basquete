export const gameState = {
    clock: 600000,
    shotClock: 24000,
    isActive: false,
    period: 1,
    possession: 'home',
    teams: {
        home: { name: 'CASA', score: 0, fouls: 0, timeouts: 0, players: [], color: '#ff6b00' },
        away: { name: 'VISITANTE', score: 0, fouls: 0, timeouts: 0, players: [], color: '#2196f3' }
    },
    events: [],
    derived: {
        lastEventType: null,
        scoreDiff: 0,
        leader: null,
        clutch: false,
        scoringRun: { team: null, points: 0 },
        recentEvents: []
    },
    audio: {
        history: [],
        queue: [],
        current: null
    }
};
