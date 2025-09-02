// routes/auth/2fa.js
// | Method   | Route              | Description                            | Access           |
// | -------- | ------------------ | -------------------------------------- | ---------------- |
// | `POST`   | `/auth/2fa/setup`  | create QR code auth                    | Public           |
// | `POST`   | `/auth/2fa/verif`  | generate JWT after auth                | Public           |

import speakeasy from 'speakeasy';
import qrcode from 'qrcode';

export default async function (fastify, options) {
  fastify.post('/setup', {preHandler: [fastify.auth]}, async (req, reply) => {
    const ftUser = await fastify.usernameEndsWith42(req.user.username);
    if (ftUser) {
      return reply.code(400).send({ error: '2FA not allowed for 42 users' });
    }

    if (req.user.is_twofa_enabled) {
      return reply.code(400).send({ error: '2FA already enabled' });
    }

    const secret = speakeasy.generateSecret({
        name: `ft_transcendence:${req.user.username}`,
    });

    try {
      await fastify.db.prepare('UPDATE users SET twofa_secret = ?, is_twofa_enabled = 1 WHERE id = ?').run(secret.base32, req.user.id);
    } catch (err) {
      console.error('SQL ERROR:', err);
      return reply.code(500).send({ error: 'DB error' });
    }

    const qrDataUrl = await qrcode.toDataURL(secret.otpauth_url);

    return reply.send({ qrCode: qrDataUrl });
  });

  fastify.post('/verify', {preHandler: [fastify.auth2faPending]}, async (req, reply) => {
    if (req.user.twofa !== false) {
      return reply.code(400).send({ error: '2FA already verified' });
    }

    const isValid = speakeasy.totp.verify({
      secret: req.user.twofa_secret,
      encoding: 'base32',
      token: req.body.token
    });

    if (isValid) {
      await fastify.db.prepare(`UPDATE users SET last_timestamp = CURRENT_TIMESTAMP WHERE id = ?`).run(req.user.id);
      const fullToken = fastify.generateToken(
        {
          id: req.user.id,
          username: req.user.username,
          role: req.user.role
        },
        true,
        '12h'
      );
      return reply.send({ token: fullToken });
    } else {
      return reply.code(401).send({ error: 'Invalid 2FA code' });
    }
  });
}
