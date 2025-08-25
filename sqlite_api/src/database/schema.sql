-- Utilisateurs (auth + profil joueur)
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username VARCHAR(30) NOT NULL UNIQUE,
  password_hash VARCHAR(100) NOT NULL,
  role VARCHAR(10) DEFAULT 'user', -- 'user' or 'admin'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2FA
ALTER TABLE users ADD COLUMN twofa_secret TEXT;
ALTER TABLE users ADD COLUMN is_twofa_enabled BOOLEAN DEFAULT false;

-- Tournois
CREATE TABLE tournaments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name VARCHAR(50) NOT NULL,
  description VARCHAR(255),
  creator_id INTEGER NOT NULL,
  difficulty VARCHAR(15), -- ex: 'easy', 'medium', 'hard'
  maxPlayers INTEGER DEFAULT 16,
  isPrivate BOOLEAN DEFAULT 0,
  status INTEGER DEFAULT 0, -- 0=waiting, 1=playing, 2=finished
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (creator_id) REFERENCES users(id)
);

-- Participants aux tournois
CREATE TABLE tournament_participants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tournament_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  score INTEGER DEFAULT 0,
  rank INTEGER, -- classement final s’il y a
  joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tournament_id) REFERENCES tournaments(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE(tournament_id, user_id)
);
