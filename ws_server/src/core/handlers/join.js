import { getTournamentManager } from '../game/GamesManager.js'
import {SrvMessageType} from "../client/protocol.js";

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
    const tournament = await tournamentManager.getOrCreate({ id, name, maxPlayers, creator: { id: client.id, username: client.getUsername() } })

    if (!client.attachToTournament(tournament)) {
        client.send({ type: SrvMessageType.GAME_FULL, tournamentId: tournament.id });
    }
}