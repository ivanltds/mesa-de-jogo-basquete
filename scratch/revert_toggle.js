window.revertEvent = (id) => {
    const e = gameState.events.find(x => x.id === id);
    if (!e) return;
    
    const isReverting = !e.reverted; // Se não estava revertido, vamos reverter. Se estava, vamos restaurar.
    const modifier = isReverting ? -1 : 1; // -1 para tirar, 1 para colocar de volta

    if (e.type === 'points') {
        gameState.teams[e.teamKey].score += (e.value * modifier);
        const p = gameState.teams[e.teamKey].players.find(x => x.number == e.playerNum);
        if (p) p.points += (e.value * modifier);
    } else if (e.type === 'foul') {
        gameState.teams[e.teamKey].fouls += modifier;
        const p = gameState.teams[e.teamKey].players.find(x => x.number == e.playerNum);
        if (p) p.fouls += modifier;
    } else if (e.type === 'timeout') {
        gameState.teams[e.teamKey].timeouts += modifier;
    } else if (e.type === 'sub') {
        const team = gameState.teams[e.teamKey];
        const pIn = team.players.find(p => p.number === e.pInNum);
        const pOut = team.players.find(p => p.number === e.pOutNum);
        if (pIn && pOut) {
            // Se estou revertendo a SUB: P-IN sai (false), P-OUT volta (true)
            // Se estou restaurando a SUB: P-IN volta (true), P-OUT sai (false)
            pIn.inCourt = !isReverting;
            pOut.inCourt = isReverting;
        }
    }
    
    e.reverted = isReverting;
    notify(isReverting ? 'Evento revertido!' : 'Evento restaurado!');
    UIManager.updateScoreboard();
};
