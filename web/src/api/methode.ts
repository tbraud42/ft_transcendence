// api/methode.ts

import { apiFetch } from "./jwt"
import { ApiInit, Tournament, TournamentPayload } from "./types";
import { Difficulty } from "../games/pong/pongState";
import i18n from "../utils/lang/i18n";

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
  return apiFetch<{ error: boolean, code: string, info: string }>(`/user/me`)
    .then(data => {
      if (data.error === true) {
        switch (data.code) {
          case "USER_NOT_FOUND":
            throw new Error(i18n.t(''));
        }
      }
      return data;
    });
}

// POST
export function userInfoById(id: number) {
  return apiFetch<{ error: boolean, code: string, info: string }>(`/user/${id}`, { method: 'POST'})
    .then(data => {
      if (data.error === true) {
        switch (data.code) {
          case "USER_INVALID_ID":
            throw new Error(i18n.t(''));
          case "USER_NOT_FOUND":
            throw new Error(i18n.t(''));
        }
      }
      return data;
    });
}

// POST
export function userInfoByUsername(username: string) {
  return apiFetch<{ error: boolean, code: string, info: string }>(`/user/username`,{ method: 'POST',
    json: { username: username }})
    .then(data => {
      if (data.error === true) {
        switch (data.code) {
          case "USER_INVALID_ID":
            throw new Error(i18n.t(''));
          case "USER_NOT_FOUND":
            throw new Error(i18n.t(''));
        }
      }
      return data;
    });
}


// PATCH
export function changeUserPass(oldPassword: string, newPassword: string) {
  return apiFetch<{ error: boolean, code: string, info: string }>(`/user/pass`, { method: 'PATCH',
    json: { oldPassword: oldPassword, newPassword: newPassword } })
    .then(data => {
      if (data.error === true) {
        switch (data.code) {
          case "AUTH_42_PASSWORD_CHANGE_FORBIDDEN":
            throw new Error(i18n.t(''));
          case "VALIDATION_MISSING_OR_INVALID_CREDENTIALS":
            throw new Error(i18n.t(''));
          case "AUTH_ACCESS_DENIED":
            throw new Error(i18n.t(''));
          case "PASSWORD_CHANGE_REQUIRED":
            throw new Error(i18n.t(''));
          case "INVALID_PASSWORD_POLICY":
            throw new Error(i18n.t(''));
        }
      }
      return data;
    });
}

// PATCH
export function changeUserAvatar(newAvatar: string) {
  return apiFetch<{ error: boolean, code: string, info: string }>(`/user/avatar`, { method: 'PATCH',
    json: {newAvatar: newAvatar}})
    .then(data => {
      if (data.error === true) {
        switch (data.code) {
          case "VALIDATION_MISSING_OR_INVALID_AVATAR":
            throw new Error(i18n.t(''));
          case "AVATAR_TOO_LARGE":
            throw new Error(i18n.t(''));
        }
      }
      return data;
    });
}

// DELETE
export function deleteUser(id: number) {
  return apiFetch<{ error: boolean, code: string, info: string }>(`/user/${id}`, { method: 'DELETE' })
    .then(data => {
      if (data.error === true) {
        switch (data.code) {
          case "AUTH_ACCESS_DENIED":
            throw new Error(i18n.t(''));
        }
      }
      return data;
  });
}

// GET
export function userTournament(id: number) {
  return apiFetch<{ error: boolean, code: string, info: string }>(`/user/${id}/tournaments`)
    .then(data => {
      if (data.error === true) {
        switch (data.code) {
          case "AUTH_ACCESS_DENIED":
            throw new Error(i18n.t(''));
        }
      }
      return data;
  });
}

// -------------- Friend ---------------
// | Method   | Function                   | Description                                 |
// | -------- | -------------------------- | ------------------------------------------- |
// | `GET`    | `getFriends`               | View all friends                            |
// | `POST`   | `addFriend`                | Add a friend by id                          |
// | `DELETE` | `deleteFriend`             | Delete a friend by id                       |

// GET
export function getFriends() {
  return apiFetch<{ error: boolean, code: string, info: string }>(`/user/friends`);
}

// POST
export function addFriend(id: number) {
  return apiFetch<{ error: boolean, code: string, info: string }>(`/user/friends/${id}`, { method: 'POST'})
    .then(data => {
      if (data.error === true) {
        switch (data.code) {
          case "USER_INVALID_ID":
            throw new Error(i18n.t(''));
          case "USER_ALREADY_FRIEND":
            throw new Error(i18n.t(''));
          case "MAX_FRIEND_LIMIT":
            throw new Error(i18n.t(''));
        }
      }
      return data;
  });
}

// DELETE
export function deleteFirend(id: number) {
  return apiFetch<{ error: boolean, code: string, info: string }>(`/user/friends/${id}`, { method: 'DELETE' })
    .then(data => {
      if (data.error === true) {
        switch (data.code) {
          case "USER_INVALID_ID":
            throw new Error(i18n.t(''));
          case "USER_NOT_FRIENDS":
            throw new Error(i18n.t(''));
        }
      }
      return data;
  });
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
  return apiFetch<{ error: boolean, code: string, info: string }>(`/tournaments`);
}

// GET
export async function fetchTournamentsId(id: number) {
  return apiFetch<{ error: boolean, code: string, info: string }>(`/tournaments/${id}`)
    .then(data => {
      if (data.error === true) {
        switch (data.code) {
          case "TOURNAMENT_NOT_FOUND":
            throw new Error(i18n.t(''));
        }
      }
      return data;
  });
}

// GET
export function fetchTournamentsWaitting() {
  return apiFetch<{ error: boolean, code: string, info: string }>(`/tournaments/waitting`);
}

// GET
export function fetchTournamentsPlaying() {
  return apiFetch<{ error: boolean, code: string, info: string }>(`/tournaments/playing`);
}

// GET
export function fetchTournamentsFinished() {
  return apiFetch<{ error: boolean, code: string, info: string }>(`/tournaments/finished`);
}

// POST
export function createTournament(name: string, difficulty: Difficulty, maxPlayer: 2 | 4 | 8) {
  return apiFetch<{ error: boolean, code: string, info: string }>(`/tournaments`, { method: 'POST',
  json: { name, description: '', difficulty, maxPlayer, isPrivate: false } })
    .then(data => {
      if (data.error === true) {
        switch (data.code) {
          case "VALIDATION_MISSING_OR_INVALID_FIELD":
            throw new Error(i18n.t(''));
          case "TOURNAMENT_NAME_ALREADY_TAKEN":
            throw new Error(i18n.t(''));
        }
      }
      return data;
  });
}

// POST
export function stateTournament(id: number) {
  return apiFetch<{ error: boolean, code: string, info: string }>(`/tournaments/state/${id}`, { method: 'POST'})
    .then(data => {
      if (data.error === true) {
        switch (data.code) {
          case "TOURNAMENT_NOT_FOUND":
            throw new Error(i18n.t(''));
          case "AUTH_ACCESS_DENIED":
            throw new Error(i18n.t(''));
        }
      }
      return data;
  });
}

// POST
export function resulTournament(id:number, games: string, winner: string) {
  return apiFetch<{ error: boolean, code: string, info: string }>(`/tournaments/result/${id}`, { method: 'POST',
  json: { games, winner } })
    .then(data => {
      if (data.error === true) {
        switch (data.code) {
          case "TOURNAMENT_NOT_FOUND":
            throw new Error(i18n.t(''));
          case "AUTH_ACCESS_DENIED":
            throw new Error(i18n.t(''));
          case "TOURNAMENT_INVALID_FIELD":
            throw new Error(i18n.t(''));
          case "TOURNAMENT_INVALID_WINNER":
            throw new Error(i18n.t(''));
        }
      }
      return data;
  });
}

// DELETE
export function deleteTournament(id: number) {
  return apiFetch<{ error: boolean, code: string, info: string }>(`/tournaments/${id}`, { method: 'DELETE' })
    .then(data => {
      if (data.error === true) {
        switch (data.code) {
          case "TOURNAMENT_NOT_FOUND":
            throw new Error(i18n.t(''));
          case "AUTH_ACCESS_DENIED":
            throw new Error(i18n.t(''));
        }
      }
      return data;
  });
}

// -------------- Stat ---------------
// | Method   | Function                     | Description                             |
// | -------- | ---------------------------- | --------------------------------------- |
// | `GET`    | `/stat`                      | show api's stats                        |
// | `GET`    | `/stat/dashboard/:id`        | show user(id) stats for dashboard       |
// | `GET`    | `/stat/dashboard/perWin`     | show stats dashboard per win            |
// | `GET`    | `/stat/dashboard/perLose`    | show stats dashboard per lose           |
// | `GET`    | `/stat/dashboard/perTWon`    | show stats dashboard per tournament win |
// | `GET`    | `/stat/dashboard/perWinRate` | show stats dashboard per win rate       |
// | `GET`    | `/stat/dashboard/perTime`    | show stats dashboard per time           |
// | `GET`    | `/stat/dashboard/perCreat`   | show stats dashboard per creat          |

// GET
export function getStatApi() {
  return apiFetch<{ error: boolean, code: string, info: string }>(`/stat`)
    .then(data => {
      if (data.error === true) {
        switch (data.code) {
          case "AUTH_ACCESS_DENIED":
            throw new Error(i18n.t(''));
        }
      }
      return data;
  });
}

// GET
export function getDashboard(id: number) {
  return apiFetch<{ error: boolean, code: string, info: string }>(`/stat/dashboard/${id}`);
}

// GET
export function getDashboardWin() {
  return apiFetch<{ error: boolean, code: string, info: string }>(`/stat/dashboard/perWin`);
}

// GET
export function getDashboardLose() {
  return apiFetch<{ error: boolean, code: string, info: string }>(`/stat/dashboard/perLose`);
}
// GET
export function getDashboardTWon() {
  return apiFetch<{ error: boolean, code: string, info: string }>(`/stat/dashboard/perTWon`);
}

// GET
export function getDashboardwinRate() {
  return apiFetch<{ error: boolean, code: string, info: string }>(`/stat/dashboard/perWinRate`);
}

// GET
export function getDashboardTime() {
  return apiFetch<{ error: boolean, code: string, info: string }>(`/stat/dashboard/perTime`);
}

// GET
export function getDashboardCreat() {
  return apiFetch<{ error: boolean, code: string, info: string }>(`/stat/dashboard/perCreat`);
}

