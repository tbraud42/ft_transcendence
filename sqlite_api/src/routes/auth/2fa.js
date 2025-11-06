// routes/auth/2fa.js
// | Method   | Route              | Description                 | Access           |
// | -------- | ------------------ | --------------------------- | ---------------- |
// | `POST`   | `/auth/2fa/setup`  | create QR code auth         | Authenticated    |
// | `POST`   | `/auth/2fa/verif`  | generate JWT after auth     | Authenticated    |
// | `POST`   | `/auth/2fa/disable`| disable 2FA                 | Authenticated    |
// | `POST`   | `/auth/2fa/activate`| activate 2FA               | Authenticated    |

import speakeasy from 'speakeasy';
import qrcode from 'qrcode';

export default async function (fastify, options) {
  fastify.post('/setup', {preHandler: [fastify.auth]}, async (req, reply) => {

    if (fastify.usernameEndsWith42(req.user.username)) {
      return reply.code(403).send({ error: true, code: 'TFA_NOT_ALLOWED_42' , info: '2FA not allowed for 42 users' } );
    }

    if (req.user.is_twofa_enabled) {
      return reply.code(403).send({ error: true, code: 'TFA_ALREADY_ENABLED', info: '2FA already enabled' });
    }

    const secret = speakeasy.generateSecret({
        name: `ft_transcendence:${req.user.username}`,
    });

    await fastify.db.prepare('UPDATE users SET twofa_secret = ? WHERE id = ?').run(secret.base32, req.user.id);

    const qrDataUrl = await qrcode.toDataURL(secret.otpauth_url);

    return reply.send({ error: false, code: '', info: { qrCode: qrDataUrl, secret: secret.base32 } });
  });

  fastify.post('/activate', {preHandler: [fastify.auth]}, async (req, reply) => {
    if (req.user.is_twofa_enabled) {
      return reply.code(403).send({ error: true, code: 'TFA_ALREADY_ENABLED', info: '2FA already enabled' });
    }

    const body = req.body ?? {};
    const token = typeof body.token === 'string' ? body.token.trim() : typeof body.token === 'number' ? Number(body.token) : '';

    const isValid = speakeasy.totp.verify({
      secret: req.user.twofa_secret,
      encoding: 'base32',
      token: token
    });

    if (isValid) {
      await fastify.db.prepare('UPDATE users SET is_twofa_enabled = 1 WHERE id = ?').run(req.user.id);
      return reply.send({ error: false, code: '', info: {} });
    }

    return reply.code(401).send({ error: true, code: 'TFA_INVALID_CODE', info: 'Invalid 2FA code' });
  });

  fastify.post('/verify', {preHandler: [fastify.auth2faPending]}, async (req, reply) => {
    if (req.user.twofa !== false) {
      return reply.code(400).send({ error: true, code: 'TFA_ALREADY_DISABLED', info: '2FA disabled' });
    }

    const body = req.body ?? {};
    const token = typeof body.token === 'string' ? body.token.trim() : typeof body.token === 'number' ? Number(body.token) : '';

    const isValid = speakeasy.totp.verify({
      secret: req.user.twofa_secret,
      encoding: 'base32',
      token: token
    });

    if (isValid) {
      fastify.updateTimeStamp(fastify.db, req.user.id);
      const fullToken = fastify.generateToken(
        {
          id: req.user.id,
          username: req.user.username,
          role: req.user.role
        }, true, '12h');

      return reply.send({ error: false, code: '', info: { token: fullToken } });
    }

    return reply.code(401).send({ error: true, code: 'TFA_INVALID_CODE', info: 'Invalid 2FA code' });
  });

    fastify.post('/disable', {preHandler: [fastify.auth]}, async (req, reply) => {
        if (!req.user.is_twofa_enabled) {
            return reply.code(403).send({ error: true, code: 'TFA_ALREADY_DISABLED', info: '2FA disabled' });
        }

        const body = req.body ?? {};
        const token = typeof body.token === 'string' ? body.token.trim() : typeof body.token === 'number' ? Number(body.token) : '';

        const isValid = speakeasy.totp.verify({
            secret: req.user.twofa_secret,
            encoding: 'base32',
            token: token
        });

        if (isValid) {
            await fastify.db.prepare('UPDATE users SET is_twofa_enabled = 0, twofa_secret = null WHERE id = ?').run(req.user.id);
            return reply.send({ error: false, code: '', info: {} });
        }

        return reply.code(401).send({ error: true, code: 'TFA_INVALID_CODE', info: 'Invalid 2FA code' });
    });
}

// | Error                       | Code                    |
// | --------------------------- | ----------------------- |
// | 2FA not allowed for 42 user | `TFA_NOT_ALLOWED_42`    |
// | 2FA already enabled         | `TFA_ALREADY_ENABLED`   |
// | 2FA already verified        | `TFA_ALREADY_VERIFIED`  |
// | 2FA disabled                | `TFA_ALREADY_DISABLED`  |
// | Invalid 2FA code            | `TFA_INVALID_CODE`      |
