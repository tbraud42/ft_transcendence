import { send, sendError } from "../utils/helpers.js";

const ROOMS_API_BASE = process.env.ROOMS_API_BASE || ""; // ex: "http://api:3000"

async function fetchRoomMeta(roomId) {
    if (!ROOMS_API_BASE) return null; // fallback si non config
    try {
        const r = await fetch(`${ROOMS_API_BASE}/rooms/${roomId}`, { headers: { "accept": "application/json" } });
        if (!r.ok) return null;
        return await r.json(); // { id, name, creatorId, difficulty, maxPlayers, privacy, createdAt }
    } catch { return null; }
}

export default async function JoinRoomHandler(ctx, ws, data) {
    const { roomManager } = ctx;
    const userId = ws._auth?.userId;
    if (!userId) return sendError(ws, "unauthorized");

    const roomId = String(data?.roomId || "").trim();
    if (!roomId) return sendError(ws, "invalid_room_id");

    // Si la room n’existe pas encore en mémoire, on va chercher la meta via l’API
    let room = roomManager.get(roomId);
    if (!room) {
        const metaFromApi = await fetchRoomMeta(roomId);
        const meta = metaFromApi || data?.meta; // WARNING: meta client only si API non dispo
        if (!meta) return sendError(ws, "room_not_found");

        // Hydrate sans permettre la création WS: on “crée” le runtime en mémoire à partir des meta API
        room = roomManager.hydrateFromMeta(meta);
    }

    const res = roomManager.join(roomId, ws, { userId });
    if (!res.ok) return sendError(ws, res.error);

    send(ws, "joined_room", {
        room: room.toJSON(),
        role: res.role,
        playerIndex: res.playerIndex,
        population: roomManager.currentPopulation(room.id)
    });

    roomManager.broadcast(room.id, { type: "room_player_joined", data: { userId } }, { except: ws });
}