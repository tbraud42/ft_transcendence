export const user_stat = `
    WITH p AS (
      SELECT username, SUM(win) AS wins, SUM(loss) AS losses
      FROM (
        SELECT g.player1 AS username,
               CASE WHEN g.winner = g.player1 THEN 1 ELSE 0 END AS win,
               CASE WHEN g.winner IS NOT NULL AND g.winner != g.player1 THEN 1 ELSE 0 END AS loss
        FROM games g
        UNION ALL
        SELECT g.player2 AS username,
               CASE WHEN g.winner = g.player2 THEN 1 ELSE 0 END AS win,
               CASE WHEN g.winner IS NOT NULL AND g.winner != g.player2 THEN 1 ELSE 0 END AS loss
        FROM games g
      )
      GROUP BY username
    ),
    tc AS (
      SELECT creator AS username, COUNT(*) AS "create"
      FROM tournaments
      GROUP BY creator
    )
    SELECT
      u.id                     AS userId,
      u.username               AS username,
      COALESCE(p.wins, 0)      AS wins,
      COALESCE(p.losses, 0)    AS losses,
      u.total_games            AS games,
      CASE WHEN u.total_games > 0
           THEN CAST(COALESCE(p.wins,0) AS REAL) / u.total_games
           ELSE 0 END          AS winRate,
      u.total_seconds          AS time,
      COALESCE(tc."create", 0) AS "create"
    FROM users u
    LEFT JOIN p  ON p.username  = u.username
    LEFT JOIN tc ON tc.username = u.username
    WHERE u.id = ?`;

export const recent_matches = `
    SELECT
      g.id       AS game_id,
      g.tournament_id,
      g.started_at,
      g.p1_score,
      g.p2_score,
      g.winner   AS winner_username,
      g.game_num AS game_num,

      CASE WHEN g.player1 = ? THEN g.player2  ELSE g.player1  END AS opponent_username,
      CASE WHEN g.player1 = ? THEN g.p1_score ELSE g.p2_score END AS your_score,
      CASE WHEN g.player1 = ? THEN g.p2_score ELSE g.p1_score END AS opp_score,
      CASE WHEN g.winner = ?  THEN 1          ELSE 0          END AS did_win
    FROM games g
    WHERE g.player1 = ? OR g.player2 = ?
    ORDER BY g.started_at DESC, g.id DESC
    LIMIT ?`;

export const dashboard_stat = `
    WITH p AS (
      SELECT username, SUM(win) AS wins, SUM(loss) AS losses
      FROM (
        SELECT g.player1 AS username,
              CASE WHEN g.winner = g.player1 THEN 1 ELSE 0 END AS win,
              CASE WHEN g.winner IS NOT NULL AND g.winner != g.player1 THEN 1 ELSE 0 END AS loss
        FROM games g
        UNION ALL
        SELECT g.player2 AS username,
              CASE WHEN g.winner = g.player2 THEN 1 ELSE 0 END AS win,
              CASE WHEN g.winner IS NOT NULL AND g.winner != g.player2 THEN 1 ELSE 0 END AS loss
        FROM games g
      )
      GROUP BY username
    ),
    tc AS (
      SELECT creator AS username, COUNT(*) AS "create"
      FROM tournaments
      GROUP BY creator
    ),
    tw AS (
      SELECT winner AS username, COUNT(*) AS tWon
      FROM tournaments
      WHERE winner IS NOT NULL
      GROUP BY winner
    )
    SELECT
      u.id                    AS userId,
      u.username              AS username,
      COALESCE(p.wins, 0)     AS wins,
      COALESCE(p.losses, 0)   AS losses,
      u.total_games           AS games,
      CASE
        WHEN (COALESCE(p.wins,0) + COALESCE(p.losses,0)) > 0
          THEN CAST(COALESCE(p.wins,0) AS REAL)
              / (COALESCE(p.wins,0) + COALESCE(p.losses,0))
        ELSE 0
      END                     AS winRate,
      u.total_seconds         AS time,
      COALESCE(tc."create",0) AS "create",
      COALESCE(tw.tWon, 0)    AS tWon
    FROM users u
    LEFT JOIN p  ON p.username  = u.username
    LEFT JOIN tc ON tc.username = u.username
    LEFT JOIN tw ON tw.username = u.username
    WHERE 1=1
      AND u.total_games >= @minGames`;
