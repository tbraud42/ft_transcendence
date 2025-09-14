import { getTournamentManager } from '../game/GamesManager.js'

export default async function handleJoin(msg, socket) {
    const c = socket.__client
    if (!c?.auth) {
        c?.send({ type:'error', error:'not_auth' }); return 
    }

    const id = String(msg.tournamentId || 't1')
    const name = msg.name || 'Tournament'
    const maxPlayers = Number(msg.maxPlayers || 2)

    const tm = getTournamentManager()
    const t = await tm.getOrCreate(c.token, { id, name, maxPlayers })

    c.attachToTournament?.(t)
    t.addPlayer(c.username, c)
}