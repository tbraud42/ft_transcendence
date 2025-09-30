import { getTournamentManager } from '../game/GamesManager.js'

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