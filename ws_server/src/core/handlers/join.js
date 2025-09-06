import { createTournament, getTournament } from "../game/GamesManager.js";

export default {
    type: 'join',
    requiresAuth: true,

    /**
     * @param {{ tournamentId?: string }} msg
     * @param {import('../client/Client.js').default} client
     */
    handle(msg, client) {
        const tournamentId = typeof msg?.tournamentId === 'string' ? msg.tournamentId.trim() : ''
        if (!tournamentId) {
            client.send({ type: 'error', error: 'tournament_required' })
            return
        }

        let tournament = getTournament(tournamentId)
        if (tournament) {
            tournament.addClient(client)
        } else {
            createTournament(client.token, tournamentId)
                .then((newTournament) => {
                    if (!newTournament) {
                        client.send({ type: 'error', error: 'tournament_create_failed' })
                        return
                    }
                    newTournament.addClient(client)
                })
                .catch((err) => {
                    console.error('createTournament failed:', err)
                    client.send({ type: 'error', error: 'tournament_create_failed' })
                })
        }
    },
}