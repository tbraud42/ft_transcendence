const API_URL = process.env.API_URL

export async function getTournamentFromApi(token, id) {
    const url = `http://${API_URL}/tournaments/${encodeURIComponent(id)}`
    const res = await fetch(url, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
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
    return res.json()
}