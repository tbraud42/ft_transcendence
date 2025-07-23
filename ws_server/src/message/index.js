import { PingHandler } from './PingHandler.js'
import { CreateRoomHandler } from "./CreateRoomHandler.js";
import { JoinRoomHandler } from './JoinRoomHandler.js'
import { GetPubicRoomsHandler } from "./GetPlublicRoomsHandler.js";

export const messageHandlers = {
    ping: PingHandler,
    create_room: CreateRoomHandler,
    join_room: JoinRoomHandler,
    get_public_rooms: GetPubicRoomsHandler
}