// routes/auth/42auth.js
// | Method   | Route               | Description                | Access           |
// | -------- | ------------------- | -------------------------- | ---------------- |
// | `GET`    | `/auth/42/login`    | login with 42 auth         | Authenticated    |
// | `GET`    | `/auth/42/callback` | url redirect by 42 auth    | Authenticated    |

import crypto from 'crypto';
import bcrypt from 'bcrypt';

const FT_AUTHORIZE_URL = 'https://api.intra.42.fr/oauth/authorize';
const FT_TOKEN_URL = 'https://api.intra.42.fr/oauth/token';
const FT_API_ME = 'https://api.intra.42.fr/v2/me';
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET =  process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;

const stateStore = new Map();

export default async function (fastify) {
  fastify.get('/login', async (req, reply) => {
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
    const q = req.query ?? {};
    const code  = typeof q.code  === 'string' ? q.code.trim()  : '';
    const state = typeof q.state === 'string' ? q.state.trim() : '';

    if (!code || code.length > 2048 ) {
      return reply.code(200).send({ error: true, code: 'INVALID_CODE', info: 'Invalid code' });
    }

    if (!state || state.length > 256 || !stateStore.has(state)) {
      return reply.code(200).send({ error: true, code: 'INVALID_STATE', info: 'Invalid state' });
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
      return reply.code(200).send({ error: true, code: 'TOKEN_EXCHANGE_FAILED', info: 'Token exchange failed',detail });
    }

    const tokens = await tokenRes.json();

    const meRes = await fetch(FT_API_ME, {
      headers: { Authorization: `Bearer ${tokens.access_token}` }
    });

    if (!meRes.ok) {
      const detail = await meRes.text();
      return reply.code(200).send({ error: true, code: 'PROFILE_FETCH_FAILED', info: 'Profile fetch failed',detail });
    }

    const ftUser = await meRes.json();

    const wantedUsername = `${ftUser.login}_42`;

    let user = fastify.db.prepare(`SELECT * FROM users WHERE username = ?`).get(wantedUsername);

    if (!user) {
      const randomePass = await bcrypt.hash(crypto.randomUUID(), 12);
      const info = fastify.db.prepare(`INSERT INTO users (username, password_hash, role) VALUES (?, ?, 'user')`).run(wantedUsername, randomePass);
      user = fastify.db.prepare(`SELECT * FROM users WHERE id = ?`).get(info.lastInsertRowid);
      fastify.apiStat.signup++;
    }

    fastify.updateTimeStamp(fastify.db, user.id);

    const token = fastify.generateToken({ id: user.id, username: user.username, role: user.role, iat: Math.floor(Date.now() / 1000) }, true, '12h');
    fastify.setJwtIAT(fastify.db, user.id);

    return reply.send({ error: false, code: '', info: { token, user: { id: user.id, username: user.username } } });
  });
}

// | Error                       | Code                    |
// | --------------------------- | ----------------------- |
// | Invalid code                | `INVALID_CODE`          |
// | Invalid state               | `INVALID_STATE`         |
// | Token exchange failed       | `TOKEN_EXCHANGE_FAILED` |
// | Profile fetch failed        | `PROFILE_FETCH_FAILED`  |
