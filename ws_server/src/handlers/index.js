import JoinRoomHandler from "./JoinRoomHandler.js";
import LeaveRoomHandler from "./LeaveRoomHandler.js";
import SetRoomPrivacyHandler from "./SetRoomPrivacyHandler.js";
import MoveHandler from "./MoveHandler.js";

export const handlers = new Map([
    ["join_room", JoinRoomHandler],
    ["leave_room", LeaveRoomHandler],
    ["set_room_privacy", SetRoomPrivacyHandler],
    ["move", MoveHandler]
]);