PRAGMA foreign_keys = ON;

-- USERS
CREATE TABLE users (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  username         VARCHAR(30) NOT NULL UNIQUE,
  password_hash    VARCHAR(100) NOT NULL,
  role             VARCHAR(10) NOT NULL DEFAULT 'user' CHECK (role IN ('user','admin')),
  avatar           BLOB,
  created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_timestamp   DATETIME DEFAULT CURRENT_TIMESTAMP,
  twofa_secret     TEXT,
  is_twofa_enabled INTEGER NOT NULL DEFAULT 0,
  total_seconds    INTEGER NOT NULL DEFAULT 0,
  total_games      INTEGER NOT NULL DEFAULT 0
);

-- FRIENDS
CREATE TABLE user_friends (
  user_id    INTEGER NOT NULL,
  friend_id  INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CHECK (user_id < friend_id),
  PRIMARY KEY (user_id, friend_id),
  FOREIGN KEY (user_id)   REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (friend_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_friends_user   ON user_friends(user_id);
CREATE INDEX IF NOT EXISTS idx_user_friends_friend ON user_friends(friend_id);

CREATE TRIGGER IF NOT EXISTS trg_limit_friends_ins
AFTER INSERT ON user_friends
BEGIN
  SELECT CASE
    WHEN (SELECT COUNT(*) FROM user_friends uf WHERE uf.user_id = NEW.user_id OR uf.friend_id = NEW.user_id) > 10
    THEN RAISE(ABORT, 'FRIEND_LIMIT')
  END;
  SELECT CASE
    WHEN (SELECT COUNT(*) FROM user_friends uf WHERE uf.user_id = NEW.friend_id OR uf.friend_id = NEW.friend_id) > 10
    THEN RAISE(ABORT, 'FRIEND_LIMIT')
  END;
END;

-- TOURNAMENTS
CREATE TABLE tournaments (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  name         VARCHAR(50) NOT NULL,
  description  VARCHAR(255),
  creator_id   INTEGER NOT NULL,
  winner       INTEGER,
  difficulty   VARCHAR(15) NOT NULL CHECK (difficulty IN ('easy','medium','hard')),
  status       INTEGER NOT NULL DEFAULT 0 CHECK (status IN (0,1,2)),
  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (creator_id) REFERENCES users(id),
  FOREIGN KEY (winner)     REFERENCES users(id) ON DELETE SET NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_tournaments_name_nocase
  ON tournaments(name COLLATE NOCASE);
CREATE INDEX IF NOT EXISTS idx_tournaments_status     ON tournaments(status);
CREATE INDEX IF NOT EXISTS idx_tournaments_creator_id ON tournaments(creator_id);
CREATE INDEX IF NOT EXISTS idx_tournaments_winner     ON tournaments(winner);

-- GAMES
CREATE TABLE games (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  tournament_id INTEGER NOT NULL,
  player1_id    INTEGER NOT NULL,
  player2_id    INTEGER NOT NULL,
  winner_id     INTEGER,
  started_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  duration_sec  INTEGER,
  p1_score      INTEGER,
  p2_score      INTEGER,
  FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
  FOREIGN KEY (player1_id)    REFERENCES users(id),
  FOREIGN KEY (player2_id)    REFERENCES users(id),
  FOREIGN KEY (winner_id)     REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_games_tournament ON games(tournament_id);
CREATE INDEX IF NOT EXISTS idx_games_p1         ON games(player1_id);
CREATE INDEX IF NOT EXISTS idx_games_p2         ON games(player2_id);
CREATE INDEX IF NOT EXISTS idx_games_winner     ON games(winner_id);

