const API_URL = process.env.API_URL;

export async function getTournamentFromApi(token, id) {
    const url = `http://${API_URL}/tournaments/${id}`;

    const res = await fetch(url, {
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
        },
    });

    if (!res.ok) {
        let errText = "";
        try {
            errText = await res.text(); 
        } catch {}
        throw new Error(`Failed to fetch tournament: ${res.status} ${errText}`);
    }
    return res.json();
}