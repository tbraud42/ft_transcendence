import { PingHandler } from './PingHandler.js'
import { JoinRoomHandler } from './JoinRoomHandler.js'

export const messageHandlers = {
    ping: PingHandler,
    join_room: JoinRoomHandler
}