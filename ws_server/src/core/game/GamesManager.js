import { getTournamentFromApi } from "../../api/game.js";
import { Tournament } from "./Tournament.js";

const tournaments = new Map();
const pending = new Map();

export function getTournament(id) {
    return tournaments.get(id);
}

export function createTournament(token, id) {
    if (tournaments.has(id)) {
        return Promise.resolve(tournaments.get(id));
    }

    if (pending.has(id)) {
        return pending.get(id);
    }

    console.log(id)

    const p = getTournamentFromApi(token, id)
        .then((raw) => {
            const t = new Tournament(
                id,
                raw.name,
                raw.description,
                raw.creator_id,
                raw.difficulty,
                raw.maxPlayers,
                raw.isPrivate,
                raw.status,
                raw.created_at,
                (emptyId) => {
                    console.log(`Tournament ${emptyId} is empty, deleting...`);
                    tournaments.delete(emptyId);
                }
            );
            tournaments.set(id, t);
            return t;
        })
        .finally(() => {
            pending.delete(id);
        });

    pending.set(id, p);
    return p;
}
