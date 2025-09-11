import { getTournament } from "../game/GamesManager.js";

export default {
    type: 'leave',
    requiresAuth: true,

    handle(msg, client) {
        const username = client.username;
        const t = getTournament(msg.tournamentId);
        if (t) {
            t.alive.delete(username);
            t.waitingInitial = t.waitingInitial.filter(u => u !== username);
            t.waitingWinners = t.waitingWinners.filter(u => u !== username);
            t.broadcastAll({ type: 'eliminated', tournamentId: msg.tournamentId, user: username });
        }
        client.send({ type: 'left_tournament', tournamentId: msg.tournamentId });
    },
}