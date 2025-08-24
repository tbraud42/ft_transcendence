import { randomUUID } from "crypto";

export const DIFFICULTIES = ["easy", "medium", "hard"];
export const PRIVACIES = ["public", "private"];

export class Room {
    constructor({
                    id = randomUUID(),
                    name,
                    creatorId,
                    difficulty = "easy",
                    maxPlayers = 2,
                    privacy = "public",
                    createdAt = new Date().toISOString()
                }) {
        if (!name || typeof name !== "string") throw new Error("Room.name required");
        if (!creatorId) throw new Error("Room.creatorId required");
        if (!DIFFICULTIES.includes(difficulty)) throw new Error("Invalid difficulty");
        if (!PRIVACIES.includes(privacy)) throw new Error("Invalid privacy");
        if (!Number.isInteger(maxPlayers) || maxPlayers < 2 || maxPlayers > 8) throw new Error("Invalid maxPlayers (2..8)");

        this.id = id;
        this.name = name;
        this.creatorId = String(creatorId);
        this.difficulty = difficulty;
        this.maxPlayers = maxPlayers;
        this.privacy = privacy;
        this.createdAt = createdAt;
    }

    toJSON() {
        return {
            id: this.id,
            name: this.name,
            creatorId: this.creatorId,
            difficulty: this.difficulty,
            maxPlayers: this.maxPlayers,
            privacy: this.privacy,
            createdAt: this.createdAt
        };
    }
}