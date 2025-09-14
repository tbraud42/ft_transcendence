import { getTournamentManager } from '../game/GamesManager.js'

export default function handleAddBot(msg, socket) {
    const c = socket.__client
    if (!c?.auth) {
        return
    }

    const t = getTournamentManager().get(String(msg.tournamentId || 't1'))
    if (!t) {
        c.send({ type:'error', error:'tournament_not_found' }); return 
    }

    if (t.owner !== c.username) {
        c.send({ type:'error', error:'forbidden' }); return 
    }
    if (t.status !== 'lobby') {
        c.send({ type:'error', error:'already_started' }); return 
    }

    const botName = String(msg.username || `Bot_${Date.now()%10000}`)
    if (t.participants.has(botName)) {
        c.send({ type:'error', error:'bot_name_taken' }); return 
    }
    if (t.participants.size >= t.maxPlayers) {
        c.send({ type:'error', error:'slots_full' }); return 
    }

    const ok = t.addBot(botName)
    if (!ok) {
        c.send({ type:'error', error:'add_bot_failed' }); return 
    }

    c.send({ type:'bot_added', username: botName })
}