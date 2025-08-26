// routes/auth/42auth.js
// | Method   | Route               | Description                            | Access           |
// | -------- | ------------------- | -------------------------------------- | ---------------- |
// | `GET`    | `/auth/42/login`    | login with 42 auth                     | public           |
// | `GET`    | `/auth/42/callback` | url redirect by 42 auth                | public           | ??

import crypto from 'crypto';

const FT_AUTHORIZE_URL = 'https://api.intra.42.fr/oauth/authorize';
const FT_TOKEN_URL = 'https://api.intra.42.fr/oauth/token';
const FT_API_ME = 'https://api.intra.42.fr/v2/me';
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET =  process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;

const stateStore = new Map();

export default async function ft42Routes(fastify) {

  fastify.get('/login', async (req, reply) => {
    console.log(`id = ${CLIENT_ID}, secret = ${CLIENT_SECRET}, URI = ${REDIRECT_URI}`);

    const state = crypto.randomBytes(16).toString('hex');
    stateStore.set(state, true);

    const params = new URLSearchParams({
      client_id: CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      response_type: 'code',
      scope: 'public',
      state
    });

    reply.redirect(`${FT_AUTHORIZE_URL}?${params.toString()}`);
  });

  fastify.get('/callback', async (req, reply) => {
    const { code, state } = req.query;

    if (!state || !stateStore.has(state)) {
      return reply.code(400).send({ error: 'Invalid state' });
    }
    stateStore.delete(state);

    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      code,
      redirect_uri: REDIRECT_URI
    });

    const tokenRes = await fetch(FT_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body
    });

    if (!tokenRes.ok) {
      const detail = await tokenRes.text();
      return reply.code(502).send({ error: 'Token exchange failed', detail });
    }

    const tokens = await tokenRes.json();

    const meRes = await fetch(FT_API_ME, {
      headers: { Authorization: `Bearer ${tokens.access_token}` }
    });

    if (!meRes.ok) {
      const detail = await meRes.text();
      return reply.code(502).send({ error: 'Profile fetch failed', detail });
    }

    const ftUser = await meRes.json();

    const wantedUsername = `${ftUser.login}_42`;

    let user = fastify.db.prepare(`SELECT * FROM users WHERE username = ?`).get(wantedUsername);

    if (!user) {
      const info = fastify.db.prepare(`INSERT INTO users (username, password_hash, role) VALUES (?, 'OAUTH_ONLY', 'user')`).run(wantedUsername); // quelle password?
      user = fastify.db.prepare(`SELECT * FROM users WHERE id = ?`).get(info.lastInsertRowid);
    }

    fastify.db.prepare(`UPDATE users SET last_timestamp = CURRENT_TIMESTAMP WHERE id = ?`).run(user.id);

    const token = fastify.generateToken({
      id: user.id,
      username: user.username,
      role: user.role
    });

    return reply.send({ token, user: { id: user.id, username: user.username } });
  });
}
