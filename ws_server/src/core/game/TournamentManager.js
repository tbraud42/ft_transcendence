import { Tournament } from './Tournament.js'
import {deleteTournament, getTournamentFromApi} from '../../api/game.js'
import {ClientManager} from "../client/ClientManager.js";

class TournamentManager {
    constructor() {
        this.tournaments = new Map()
    }

    async getOrCreate(id, creator) {
        const key = String(id)
        if (this.tournaments.has(key)) {
            const tournament = this.tournaments.get(key);
            if (creator.id === tournament.creator.id) {
                tournament.creator.username = creator.username;
            }
            return tournament
        }

        let maxPlayers = 2
        let name = 2
        let difficulty = "medium"
        try {
            const data = await getTournamentFromApi(creator, key)
            if (data.error) {
                return null
            }
            if (data?.status === 2) {
                return null
            }
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

    removeTournament(id) {
        const tournament = this.get(id)
        deleteTournament(tournament.creator, String(id)).catch(() => ({}))
        this.tournaments.delete(String(id))
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
