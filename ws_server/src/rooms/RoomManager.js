import { Room } from "../models/Room.js";
import { newState, serveBall, tick } from "../game/engine.js";
import { CONFIG } from "../config.js";

export class RoomManager {
    constructor() {
        this.rooms = new Map();
        this.members = new Map();
        this.roomOfClient = new WeakMap();
        this.runtime = new Map();
    }

    hydrateFromMeta(meta) {
        const room = new Room({
            id: meta.id,
            name: meta.name,
            creatorId: meta.creatorId,
            difficulty: meta.difficulty || "easy",
            maxPlayers: meta.maxPlayers || 2,
            privacy: meta.privacy || "public",
            createdAt: meta.createdAt || new Date().toISOString()
        });
        this.rooms.set(room.id, room);
        this.members.set(room.id, new Set());
        this.runtime.set(room.id, {
            state: newState(room.difficulty),
            inputs: ["stop","stop"],
            players: new Map(),
            lastInputAt: new WeakMap(),
            tickHandle: undefined,
            tickCount: 0
        });
        return room;
    }

    // CRUD room
    createRoom(params) {
        const room = new Room(params);
        this.rooms.set(room.id, room);
        this.members.set(room.id, new Set());
        this.runtime.set(room.id, {
            state: newState(room.difficulty),
            inputs: ["stop", "stop"], // index 0/1
            players: new Map(),       // ws -> 0/1 or "spectator"
            lastInputAt: new WeakMap(), // ws -> ts
            tickHandle: undefined,
            tickCount: 0
        });
        return room;
    }

    listRooms({ includePrivate = false } = {}) {
        const out = [];
        for (const r of this.rooms.values()) {
            if (includePrivate || r.privacy === "public") out.push(r.toJSON());
        }
        out.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
        return out;
    }

    get(roomId) { return this.rooms.get(roomId) || null; }

    // Membership & roles
    join(roomId, ws, { userId }) {
        const room = this.get(roomId);
        if (!room) return { ok: false, error: "room_not_found" };
        const set = this.members.get(roomId); if (!set) return { ok: false, error: "room_not_found" };

        // count only human connections, but only first 2 get player slots
        if (set.size >= room.maxPlayers) return { ok: false, error: "room_full" };

        set.add(ws);
        this.roomOfClient.set(ws, roomId);

        const rt = this.runtime.get(roomId);
        // Assign a player slot (0 or 1) if available, else spectator
        let role = "spectator", playerIndex = -1;
        const taken = new Set();
        for (const [w, idx] of rt.players.entries()) if (idx === 0 || idx === 1) taken.add(idx);
        if (!taken.has(0)) { role = "player"; playerIndex = 0; }
        else if (!taken.has(1)) { role = "player"; playerIndex = 1; }

        rt.players.set(ws, role === "player" ? playerIndex : "spectator");
        ws._roomId = roomId;
        ws._userId = String(userId);
        ws._playerIndex = playerIndex; // -1 if spectator

        // Start when two players present
        const activePlayers = [...rt.players.values()].filter(v => v === 0 || v === 1).length;
        if (activePlayers >= 2 && !rt.tickHandle) this.startGame(roomId);

        return { ok: true, room, role, playerIndex };
    }

    leave(ws) {
        const roomId = this.roomOfClient.get(ws);
        if (!roomId) return;
        const set = this.members.get(roomId);
        const rt = this.runtime.get(roomId);
        if (set) set.delete(ws);
        if (rt) rt.players.delete(ws);
        this.roomOfClient.delete(ws);
        ws._roomId = undefined;
        ws._playerIndex = undefined;

        // If less than 2 players remain, we can pause (optional)
        if (rt) {
            const activePlayers = [...rt.players.values()].filter(v => v === 0 || v === 1).length;
            if (activePlayers < 2) this.stopGame(roomId);
        }
    }

    handleDisconnect(ws) { this.leave(ws); }

    // Inputs (server-side authority)
    applyInput(ws, dir) {
        const roomId = this.roomOfClient.get(ws);
        if (!roomId) return { ok: false, error: "not_in_room" };
        const rt = this.runtime.get(roomId);
        if (!rt) return { ok: false, error: "room_not_found" };
        const idx = rt.players.get(ws);
        if (idx !== 0 && idx !== 1) return { ok: false, error: "not_a_player" };

        // Rate limit naïf (ignore floods < 8ms)
        const now = Date.now();
        const last = rt.lastInputAt.get(ws) || 0;
        if (now - last < 8) return { ok: true }; // ignore silently
        rt.lastInputAt.set(ws, now);

        if (!["up", "down", "stop"].includes(dir)) return { ok: false, error: "invalid_dir" };
        rt.inputs[idx] = dir;
        return { ok: true };
    }

    // Game loop
    startGame(roomId) {
        const rt = this.runtime.get(roomId);
        if (!rt || rt.tickHandle) return;
        const state = rt.state;
        serveBall(state);

        rt.tickCount = 0;
        rt.tickHandle = setInterval(() => {
            // Apply inputs => set paddle velocities
            const sp = state.speed.paddle;
            // idx 0
            state.paddles[0].vy = rt.inputs[0] === "up" ? -sp : rt.inputs[0] === "down" ? sp : 0;
            // idx 1
            state.paddles[1].vy = rt.inputs[1] === "up" ? -sp : rt.inputs[1] === "down" ? sp : 0;

            // Simulate
            tick(state);

            // Broadcast at ~30 Hz
            rt.tickCount++;
            if (rt.tickCount % CONFIG.broadcastEvery === 0) {
                this.broadcast(roomId, { type: "state", data: state });
            }
        }, CONFIG.tickMs);
    }

    stopGame(roomId) {
        const rt = this.runtime.get(roomId);
        if (!rt) return;
        if (rt.tickHandle) clearInterval(rt.tickHandle);
        rt.tickHandle = undefined;
        rt.state.running = false;
    }

    // Broadcast util
    broadcast(roomId, message, { except } = {}) {
        const set = this.members.get(roomId);
        if (!set) return;
        const payload = JSON.stringify(message);
        for (const client of set) {
            if (client.readyState === 1 /* OPEN */ && client !== except) {
                client.send(payload);
            }
        }
    }

    currentPopulation(roomId) {
        const set = this.members.get(roomId);
        return set ? set.size : 0;
    }
}