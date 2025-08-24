export enum PacketType {
    JOIN_ROOM = 'join_room'
}

export class Packet {
    constructor(public type: string, public data: Record<string, any> = {}) {
        console.log(`Packet created: ${type}`, data);
    }

    toString(): string {
        return JSON.stringify({ type: this.type, ...this.data });
    }
}

export function joinRoomPacket(roomId: string): Packet {
    return new Packet(PacketType.JOIN_ROOM, { roomId });
}