PRAGMA foreign_keys = ON;

-- USERS
CREATE TABLE IF NOT EXISTS users (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  username         VARCHAR(30) NOT NULL UNIQUE,
  password_hash    VARCHAR(100) NOT NULL,
  role             VARCHAR(10) NOT NULL DEFAULT 'user' CHECK (role IN ('user','admin')),
  avatar           BLOB,
  created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_timestamp   DATETIME DEFAULT CURRENT_TIMESTAMP,
  twofa_secret     TEXT,
  is_twofa_enabled INTEGER NOT NULL DEFAULT 0,
  total_seconds    INTEGER NOT NULL DEFAULT 0 CHECK (total_seconds >= 0),
  total_games      INTEGER NOT NULL DEFAULT 0 CHECK (total_games >= 0)
);

-- FRIENDS
CREATE TABLE IF NOT EXISTS user_friends (
  user_id    INTEGER NOT NULL,
  friend_id  INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
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
    WHEN (SELECT COUNT(*) FROM user_friends uf
          WHERE uf.user_id = NEW.user_id OR uf.friend_id = NEW.user_id) > 10
    THEN RAISE(ABORT, 'FRIEND_LIMIT')
  END;
  SELECT CASE
    WHEN (SELECT COUNT(*) FROM user_friends uf
          WHERE uf.user_id = NEW.friend_id OR uf.friend_id = NEW.friend_id) > 10
    THEN RAISE(ABORT, 'FRIEND_LIMIT')
  END;
END;

-- TOURNAMENTS
CREATE TABLE IF NOT EXISTS tournaments (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  name         VARCHAR(50) NOT NULL,
  description  VARCHAR(255),
  maxPlayer    INTEGER NOT NULL DEFAULT 2 CHECK (maxPlayer IN (2,4,8)),
  creator      VARCHAR(30),
  winner       VARCHAR(30),
  difficulty   VARCHAR(15) NOT NULL CHECK (difficulty IN ('easy','medium','hard')),
  status       INTEGER NOT NULL DEFAULT 0 CHECK (status IN (0,1,2)), -- 0=waiting,1=playing,2=finished
  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (creator) REFERENCES users(username) ON DELETE SET NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_tournaments_name_nocase
  ON tournaments(name COLLATE NOCASE);
CREATE INDEX IF NOT EXISTS idx_tournaments_status  ON tournaments(status);
CREATE INDEX IF NOT EXISTS idx_tournaments_creator ON tournaments(creator);
CREATE INDEX IF NOT EXISTS idx_tournaments_winner  ON tournaments(winner);

-- GAMES
CREATE TABLE IF NOT EXISTS games (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  game_num      INTEGER NOT NULL,
  tournament_id INTEGER NOT NULL,
  player1       VARCHAR(30),
  player2       VARCHAR(30),
  winner        VARCHAR(30),
  started_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  duration_sec  INTEGER CHECK (duration_sec IS NULL OR duration_sec >= 0),
  p1_score      INTEGER CHECK (p1_score IS NULL OR p1_score >= 0),
  p2_score      INTEGER CHECK (p2_score IS NULL OR p2_score >= 0),
  CHECK (player1 IS NULL OR player2 IS NULL OR player1 <> player2),
  CHECK (winner IS NULL OR winner IN (player1, player2)),
  FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_games_tournament ON games(tournament_id);
CREATE INDEX IF NOT EXISTS idx_games_p1         ON games(player1);
CREATE INDEX IF NOT EXISTS idx_games_p2         ON games(player2);
CREATE INDEX IF NOT EXISTS idx_games_winner     ON games(winner);

CREATE VIEW IF NOT EXISTS v_tournament_participants AS
SELECT DISTINCT
  g.tournament_id,
  u.username AS username
FROM games g
JOIN users u ON u.username IN (g.player1, g.player2);

CREATE VIEW IF NOT EXISTS v_user_matches AS
SELECT
  g.id            AS game_id,
  g.tournament_id,
  t.name          AS tournament_name,
  g.started_at,
  g.p1_score,
  g.p2_score,
  g.winner        AS winner_username,
  CASE WHEN g.player1 = u.username THEN g.player2 ELSE g.player1 END AS opponent_username
FROM games g
JOIN tournaments t ON t.id = g.tournament_id
JOIN users u ON u.username IN (g.player1, g.player2);
