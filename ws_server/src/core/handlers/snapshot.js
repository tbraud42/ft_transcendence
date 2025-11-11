import { getTournamentManager } from '../game/TournamentManager.js'

/**
 * Handle snapshot request, sending back the current state of the tournament.
 * @param msg { type: number, tournamentId: string }
 * @param socket The socket connection that sent the message.
 */
export default function handleSnapshot(msg, socket) {
    const c = socket.__client
    if (!c?.auth) {
        return
    }
    const t = getTournamentManager().get(String(msg.tournamentId || 't1'))
    if (!t) {
        c.send({ type:'error', error:'tournament_not_found' }); return 
    }
    c.send(t.buildSnapshot())
}