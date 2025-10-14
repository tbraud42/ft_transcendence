import { getTournamentManager } from '../game/GamesManager.js'

export default async function handleJoin(msg, socket) {
    const client = socket.__client
    if (!client?.auth) {
        client?.send({ type:'error', error:'not_auth' });
        return;
    }

    const id = String(msg.tournamentId || 't1')
    const name = msg.name || 'Tournament'
    const maxPlayers = Number(msg.maxPlayers || 2)

    const tournamentManager = getTournamentManager()
    const tournament = await tournamentManager.getOrCreate(client.token, { id, name, maxPlayers, creator: { id: client.id, username: client.getUsername() } })

    client.attachToTournament(tournament)
}