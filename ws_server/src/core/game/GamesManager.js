import { Tournament } from './Tournament.js'
import { getTournamentFromApi } from '../../api/game.js'

class TournamentManager {
    constructor() {
        this.tournaments = new Map()
    }

    async getOrCreate(token, { id, name, maxPlayers, creator }) {
        const key = String(id)
        if (this.tournaments.has(key)) {
            return this.tournaments.get(key)
        }

        try {
            const data = await getTournamentFromApi(token, key)
            if (data?.name) {
                name = String(data.name)
            }
            if (data?.maxPlayer) {
                maxPlayers = Number(data.maxPlayer)
            }
        } catch (err) {
            console.log(err)
        }

        const t = new Tournament({ id: key, name, maxPlayers, creator })
        this.tournaments.set(key, t)
        return t
    }

    get(id) {
        return this.tournaments.get(String(id)) || null
    }
}

let _mgr = null
export function getTournamentManager() {
    if (!_mgr) {
        _mgr = new TournamentManager()
    }
    return _mgr
}