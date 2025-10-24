// api/methode.ts

import { apiFetch } from "./jwt"
import { ApiInit, Tournament, TournamentPayload } from "./types";
import { Difficulty } from "../games/pong/pongState";

// -------------- User ---------------
// | Method   | Function                   | Description                                 |
// | -------- | -------------------------- | ------------------------------------------- |
// | `GET`    | `fetchTournaments`         | View a user's id                            |
// | `GET`    | `fetchTournamentsId`       | View a user's profile                       |
// | `GET`    | `fetchTournamentsWaitting` | Update user info password                   |
// | `GET`    | `fetchTournamentsPlaying`  | Update user avatar                          |
// | `GET`    | `fetchTournamentsFinished` | Delete an account                           |
// | `POST`   | `createTournament`         | View tournaments a user has participated in |

// GET
export function userMe() {
  return apiFetch<{ error: boolean, code: string, info: string }>('/user/me');
}

// GET
export function getUserInfo(id: number) {
  return apiFetch<{ error: boolean, code: string, info: string }>('/user/${id}');
}

// PATCH
export function changeUserPass(oldPassword: string, newPassword: string) {
  return apiFetch<{ error: boolean, code: string, info: string }>('/user/pass', { method: 'PATCH',
     json: { oldPassword: oldPassword, newPassword: newPassword } });
}

// PATCH
export function changeUserAvatar(newAvatar: string) {
  return apiFetch<{ error: boolean, code: string, info: string }>('/user/avatar', { method: 'PATCH',
     json: {newAvatar: newAvatar}});
}

// DELETE
export function deleteUser(id: number) {
  return apiFetch<{ error: boolean, code: string, info: string }>('/user/${id}', { method: 'DELETE' });
}

// GET
export function userTournament(id: number) {
  return apiFetch<{ error: boolean, code: string, info: string }>('/user/${id}/tournaments');
}

// -------------- Friend ---------------
// | Method   | Function                   | Description                                 |
// | -------- | -------------------------- | ------------------------------------------- |
// | `GET`    | `fetchTournaments`         | View a user's id                            |
// | `GET`    | `fetchTournamentsId`       | View a user's profile                       |
// | `GET`    | `fetchTournamentsWaitting` | Update user info password                   |
// | `GET`    | `fetchTournamentsPlaying`  | Update user avatar                          |
// | `GET`    | `fetchTournamentsFinished` | Delete an account                           |
// | `POST`   | `createTournament`         | View tournaments a user has participated in |

// GET
export function getFriend(id: number) {
  return apiFetch<{ error: boolean, code: string, info: string }>('/user/friends');
}

// POST
export function addFriend(id: number) {
  return apiFetch<{ error: boolean, code: string, info: string }>('`/user/friends/${id}', { method: 'POST'});
}

// DELETE
export function deleteFirend(id: number) {
  return apiFetch<{ error: boolean, code: string, info: string }>('`/user/friends/${id}', { method: 'DELETE' });
}

// -------------- Tournament ---------------
// | Method   | Function                   | Description                            |
// | -------- | -------------------------- | -------------------------------------- |
// | `GET`    | `fetchTournaments`         | View all tournaments                   |
// | `GET`    | `fetchTournamentsId`       | View a specific tournament             |
// | `GET`    | `fetchTournamentsWaitting` | View waiting tournaments (status=0)    |
// | `GET`    | `fetchTournamentsPlaying`  | View playing tournaments (status=1)    |
// | `GET`    | `fetchTournamentsFinished` | View finished tournaments (status=2)   |
// | `POST`   | `createTournament`         | Create a tournament                    |
// | `POST`   | `stateTournament`          | Advance or set state                   |
// | `POST`   | `resultTournament`         | Insert games, set winner               |
// | `DELETE` | `deleteTournament`         | Delete a tournament                    |

// GET
export function fetchTournaments() {
  return apiFetch<{ error: boolean, code: string, info: string }>('/tournaments');
}

// GET
export async function fetchTournamentsId(id: number) {
  return apiFetch<{ error: boolean, code: string, info: string }>(`/tournaments/${id}`);
}

// GET
export function fetchTournamentsWaitting() {
  return apiFetch<{ error: boolean, code: string, info: string }>('/tournaments/waitting');
}

// GET
export function fetchTournamentsPlaying() {
  return apiFetch<{ error: boolean, code: string, info: string }>('/tournaments/playing');
}

// GET
export function fetchTournamentsFinished() {
  return apiFetch<{ error: boolean, code: string, info: string }>('/tournaments/finished');
}

// POST
export function createTournament(name: string, difficulty: Difficulty, maxPlayer: 2 | 4 | 8) {
  return apiFetch<{ error: boolean, code: string, info: string }>('/tournaments', { method: 'POST',
  json: { name, description: '', difficulty, maxPlayer, isPrivate: false } });
}

// POST
export function stateTournament(id: number) {
  return apiFetch<{ error: boolean, code: string, info: string }>('/tournaments/state/${id}', { method: 'POST'});
}

// POST
export function resulTournament(games: string, winner: string) {
  return apiFetch<{ error: boolean, code: string, info: string }>('/tournaments/result/${id}', { method: 'POST',
  json: { games, winner } });
}

// DELETE
export function deleteTournament(id: number) {
  return apiFetch<{ error: boolean, code: string, info: string }>(`/tournaments/${id}`, { method: 'DELETE' });
}

// -------------- Stat ---------------
// | Method   | Function                   | Description                             |
// | -------- | -------------------------- | --------------------------------------- |
// | `GET`    | `/stat`                    | show api's stats                        |
// | `GET`    | `/stat/dashboard/:id`      | show user(id) stats for dashboard       |
// | `GET`    | `/stat/dashboard/perWin`   | show stats dashboard per win            |
// | `GET`    | `/stat/dashboard/perLose`  | show stats dashboard per lose           |
// | `GET`    | `/stat/dashboard/perTime`  | show stats dashboard per time           |
// | `GET`    | `/stat/dashboard/perCreat` | show stats dashboard per creat          |
// | `GET`    | `/stat/dashboard/perTWin`  | show stats dashboard per tournament win |

// GET
export function getStatApi() {
  return apiFetch<{ error: boolean, code: string, info: string }>('/stat');
}

// GET
export function getDashboard(id: number) {
  return apiFetch<{ error: boolean, code: string, info: string }>('/stat/dashboard/${id}');
}

// GET
export function getDashboardWin() {
  return apiFetch<{ error: boolean, code: string, info: string }>('/stat/dashboard/perWin');
}

// GET
export function getDashboardLose() {
  return apiFetch<{ error: boolean, code: string, info: string }>('/stat/dashboard/perLose');
}

// GET
export function getDashboardTime() {
  return apiFetch<{ error: boolean, code: string, info: string }>('/stat/dashboard/perTime');
}

// GET
export function getDashboardCreat() {
  return apiFetch<{ error: boolean, code: string, info: string }>('/stat/dashboard/perCrea');
}

// GET
export function getDashboardTWin() {
  return apiFetch<{ error: boolean, code: string, info: string }>('/stat/dashboard/perTWin');
}
