-- Users
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username VARCHAR(30) NOT NULL UNIQUE,
  password_hash VARCHAR(100) NOT NULL,
  role VARCHAR(10) NOT NULL DEFAULT 'user'
    CHECK (role IN ('user', 'admin')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2FA
ALTER TABLE users ADD COLUMN twofa_secret TEXT;
ALTER TABLE users ADD COLUMN is_twofa_enabled BOOLEAN DEFAULT false;

-- Tournaments
CREATE TABLE tournaments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name VARCHAR(50) NOT NULL,
  description VARCHAR(255),
  creator_id INTEGER NOT NULL,
  winner INTEGER, -- nullable tant que le tournoi n'est pas fini
  difficulty VARCHAR(15) NOT NULL
    CHECK (difficulty IN ('easy','medium','hard')),
  maxPlayers INTEGER DEFAULT 16,
  isPrivate INTEGER NOT NULL DEFAULT 0, -- 0/1 en SQLite
  status INTEGER NOT NULL DEFAULT 0      -- 0=waiting, 1=playing, 2=finished
    CHECK (status IN (0,1,2)),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (creator_id) REFERENCES users(id),
  FOREIGN KEY (winner)     REFERENCES users(id) ON DELETE SET NULL
);

-- Tournament_participants
CREATE TABLE tournament_participants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tournament_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  wins INTEGER DEFAULT 0,   -- corrige "win"
  losses INTEGER DEFAULT 0, -- corrige "loose"
  joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)       REFERENCES users(id),
  UNIQUE(tournament_id, user_id)
);

-- Index
CREATE UNIQUE INDEX IF NOT EXISTS uq_tournaments_name_nocase
  ON tournaments(name COLLATE NOCASE);
CREATE INDEX IF NOT EXISTS idx_tournaments_status     ON tournaments(status);
CREATE INDEX IF NOT EXISTS idx_tournaments_creator_id ON tournaments(creator_id);
CREATE INDEX IF NOT EXISTS idx_tp_tournament_id       ON tournament_participants(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tp_user_id             ON tournament_participants(user_id);




-- -- Utilisateurs (auth + profil joueur)
-- CREATE TABLE users (
--   id INTEGER PRIMARY KEY AUTOINCREMENT,
--   username VARCHAR(30) NOT NULL UNIQUE,
--   password_hash VARCHAR(100) NOT NULL,
--   role VARCHAR(10) NOT NULL DEFAULT 'user'
--     CHECK (role IN ('user', 'admin')), -- 'user' or 'admin'
--   created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
--   last_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
-- );

-- -- 2FA
-- ALTER TABLE users ADD COLUMN twofa_secret TEXT;
-- ALTER TABLE users ADD COLUMN is_twofa_enabled BOOLEAN DEFAULT false;

-- -- Tournois
-- CREATE TABLE tournaments (
--   id INTEGER PRIMARY KEY AUTOINCREMENT,
--   name VARCHAR(50) NOT NULL,
--   description VARCHAR(255),
--   creator_id INTEGER NOT NULL,
--   winner INTEGER, -- nullable tant que le tournoi n'est pas fini
--   difficulty VARCHAR(15), -- ex: 'easy', 'medium', 'hard'
--   maxPlayers INTEGER DEFAULT 16,
--   isPrivate BOOLEAN DEFAULT 0,
--   -- status INTEGER DEFAULT 0, -- 0=waiting, 1=playing, 2=finished
--   status INTEGER NOT NULL DEFAULT 0  -- 0=waiting, 1=playing, 2=finished
--     CHECK (status IN (0,1,2)),
--   created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
--   FOREIGN KEY (creator_id) REFERENCES users(id),
--   FOREIGN KEY (winner) REFERENCES users(id)
-- );

-- -- Participants aux tournois
-- CREATE TABLE tournament_participants ( -- temps total
--   id INTEGER PRIMARY KEY AUTOINCREMENT,
--   tournament_id INTEGER NOT NULL,
--   user_id INTEGER NOT NULL,
--   win INTEGER DEFAULT 0,   -- a implementer
--   loose INTEGER DEFAULT 0, -- a implementer
--   joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
--   FOREIGN KEY (tournament_id) REFERENCES tournaments(id),
--   FOREIGN KEY (user_id) REFERENCES users(id),
--   UNIQUE(tournament_id, user_id)
-- );

-- -- Tournois
-- CREATE TABLE tournaments (
--   id INTEGER PRIMARY KEY AUTOINCREMENT,
--   name VARCHAR(50) NOT NULL,
--   description VARCHAR(255),
--   creator_id INTEGER NOT NULL,
--   winner INTEGER NOT NULL, -- a implmenter
--   difficulty VARCHAR(15), -- ex: 'easy', 'medium', 'hard'
--   maxPlayers INTEGER DEFAULT 16,
--   isPrivate BOOLEAN DEFAULT 0,
--   -- status INTEGER DEFAULT 0, -- 0=waiting, 1=playing, 2=finished
--   status INTEGER NOT NULL DEFAULT 0  -- 0=waiting, 1=playing, 2=finished
--     CHECK (status IN (0,1,2)),
--   created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
--   FOREIGN KEY (creator_id) REFERENCES users(id)
--   FOREIGN KEY (winner) REFERENCES users(id)
-- );

-- -- Participants aux tournois
-- CREATE TABLE tournament_participants ( -- temps total
--   id INTEGER PRIMARY KEY AUTOINCREMENT,
--   tournament_id INTEGER NOT NULL,
--   user_id INTEGER NOT NULL,
--   win INTEGER DEFAULT 0, -- a implmenter
--   loose INTEGER DEFAULT 0, -- a implmenter
--   joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
--   FOREIGN KEY (tournament_id) REFERENCES tournaments(id),
--   FOREIGN KEY (user_id) REFERENCES users(id),
--   UNIQUE(tournament_id, user_id)
-- );
