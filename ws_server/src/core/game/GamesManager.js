import { Tournament } from './Tournament.js'
import { getTournamentFromApi } from '../../api/game.js'
import {ClientManager} from "../client/ClientManager.js";

class TournamentManager {
    constructor() {
        this.tournaments = new Map()
    }

    // token: JWT du client ; params: { id }
    async getOrCreate(token, { id, name, maxPlayers, creator }) {
        const key = String(id)
        if (this.tournaments.has(key)) {
            const tournament = this.tournaments.get(key);
            if (creator.id === tournament.creator.id) {
                tournament.creator.username = creator.username;
            }
            return tournament
        }

        let difficulty = "medium"
        try {
            const data = await getTournamentFromApi(token, key)
            if (data?.name) {
                name = String(data.name)
            }
            if (data?.maxPlayer) {
                maxPlayers = Number(data.maxPlayer)
            }

            if (data?.creator_id) {
                creator.id = data.creator_id
                creator.username = null
            }
            if (data?.difficulty) {
                difficulty = data?.difficulty
            }
        } catch (err) {
            console.log(err)
        }

        const t = new Tournament({ id: key, name, maxPlayers, creator, difficulty })
        this.tournaments.set(key, t)
        return t
    }

    get(id) {
        return this.tournaments.get(String(id)) || null
    }
}

let _tmg = null
export function getTournamentManager() {
    if (!_tmg) {
        _tmg = new TournamentManager()
    }
    return _tmg
}

let _cmg = null
export function getClientManager() {
    if (!_cmg) {
        _cmg = new ClientManager()
    }
    return _cmg
}
