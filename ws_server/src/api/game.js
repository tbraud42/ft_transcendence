import jwt from 'jsonwebtoken';
import {env} from "../utils/env.js";

const API_URL = env.API_URL
const JWT_SECRET = env.JWT_SECRET

function generateValidToken(username, id, expiresIn = '5s') {
    const payload = {
        username: username,
        id: id,
        role: 'admin',
        twofa: true,
    }

    return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

export async function getTournamentFromApi(creator, id) {
    const url = `${API_URL}/tournaments/${encodeURIComponent(id)}`

    const res = await fetch(url, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${generateValidToken(creator.username, creator.id)}`,
            'Accept': 'application/json',
        },
    })
    if (!res.ok) {
        let text = ''
        try {
            text = await res.text()
        } catch {}
        throw new Error(`tournament_fetch_failed ${res.status} ${text}`)
    }
    const data = await res.json()
    return data.info.tournament
}

export async function saveTournamentResult(tournament) {
    const url = `${API_URL}/tournaments/result/${encodeURIComponent(tournament.getId())}`

    const result = tournament.convertTournamentToResult();

    console.log(result)

    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${generateValidToken(tournament.creator.username, tournament.creator.id)}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(result),
    })

    const data = await res.json().catch(() => ({}))

    console.log(data)

    if (!res.ok) {
        console.error('Error saving tournament result:', res.status, res.statusText)
        return null
    }

    return data
}

export async function updateTournamentState(creator, id, status) {
    const url = `${API_URL}/tournaments/state/${encodeURIComponent(id)}`

    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${generateValidToken(creator.username, creator.id)}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
    })

    const data = await res.json().catch(() => ({}))

    console.log(data)

    if (!res.ok) {
        console.error('Error updating tournament state:', res.status, res.statusText)
        return null
    }

    return data
}

export async function deleteTournament(creator, id) {
    const url = `${API_URL}/tournaments/${encodeURIComponent(id)}`

    const res = await fetch(url, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${generateValidToken(creator.username, creator.id)}`,
            'Accept': 'application/json',
        },
    })
    const data = await res.json().catch(() => ({}))

    if (!res.ok) {
        console.error('Error deleting tournament:', res.status, res.statusText)
        return null
    }

    return data
}