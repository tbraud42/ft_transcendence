import { getTournamentManager } from '../game/TournamentManager.js'
import {SrvMessageType} from "../client/protocol.js";

/**
 * Handles a client request to join a tournament.
 * @param msg { type: number, tournamentId?: string }
 * @param socket The socket connection that sent the message.
 */
export default async function handleJoin(msg, socket) {
    const client = socket.__client
    if (!client?.auth) {
        client?.send({ type:'error', error:'not_auth' });
        return;
    }

    const id = String(msg.tournamentId || 't1')

    const tournamentManager = getTournamentManager()
    const tournament = await tournamentManager.getOrCreate(id, { id: client.id, username: client.getUsername()})
    if (!tournament) {
        client.send({ type: SrvMessageType.PLAYER_KICK, tournamentId: 0, user: client.username });
        return;
    }

    if (!client.attachToTournament(tournament)) {
        client.send({ type: SrvMessageType.GAME_FULL, tournamentId: tournament.id });
    }
}