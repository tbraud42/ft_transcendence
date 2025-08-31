// routes/auth/2fa.js
// | Method   | Route              | Description                            | Access           |
// | -------- | ------------------ | -------------------------------------- | ---------------- |
// | `POST`   | `/auth/2fa/setup`  | create QR code auth                    | Public           |
// | `POST`   | `/auth/2fa/verif`  | verify code and generate JWT           | Public           |

import speakeasy from 'speakeasy';
import qrcode from 'qrcode';

export default async function (fastify) {
    fastify.post('/setup', { preHandler: [fastify.authenticate(fastify)] }, async (req, reply) => {
        try {
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
                await fastify.db
                    .prepare('UPDATE users SET twofa_secret = ? WHERE id = ?')
                    .run(secret.base32, req.user.id);
            } catch (err) {
                fastify.log.error({ err }, 'SQL error while setting twofa_secret');
                return reply.code(500).send({ error: 'DB error' });
            }

            let qrDataUrl;
            try {
                qrDataUrl = await qrcode.toDataURL(secret.otpauth_url);
            } catch (err) {
                fastify.log.error({ err }, 'QR generation error');
                return reply.code(500).send({ error: 'QR generation error' });
            }

            return reply.send({
                qrCode: qrDataUrl,
                secret: secret.base32,
                otpauthUrl: secret.otpauth_url,
            });
        } catch (err) {
            fastify.log.error({ err }, '2FA setup error');
            return reply.code(500).send({ error: 'internal_error' });
        }
    });

    fastify.post('/verify', { preHandler: [fastify.authenticate(fastify)] }, async (req, reply) => {
        try {
            const code = req.body && typeof req.body.code === 'string' ? req.body.code.trim() : '';
            if (!code) {
                return reply.code(400).send({ error: 'code_required' });
            }

            let row;
            try {
                row = fastify.db
                    .prepare('SELECT twofa_secret, is_twofa_enabled FROM users WHERE id = ?')
                    .get(req.user.id);
            } catch (err) {
                fastify.log.error({ err }, 'SQL error while fetching twofa_secret');
                return reply.code(500).send({ error: 'DB error' });
            }

            const twofa_secret = row && row.twofa_secret;
            if (!twofa_secret) {
                return reply.code(400).send({ error: '2FA not set up' });
            }

            const isValid = speakeasy.totp.verify({
                secret: twofa_secret,
                encoding: 'base32',
                token: code,
                window: 1,
            });


            if (!isValid) {
                return reply.code(401).send({ error: 'Invalid 2FA code' });
            }

            if (!row.is_twofa_enabled) {
                try {
                    await fastify.db
                        .prepare('UPDATE users SET is_twofa_enabled = 1, last_timestamp = CURRENT_TIMESTAMP WHERE id = ?')
                        .run(req.user.id);
                } catch (err) {
                    fastify.log.error({ err }, 'SQL error while enabling 2FA');
                    return reply.code(500).send({ error: 'DB error' });
                }
            } else {
                try {
                    await fastify.db
                        .prepare('UPDATE users SET last_timestamp = CURRENT_TIMESTAMP WHERE id = ?')
                        .run(req.user.id);
                } catch (err) {
                    fastify.log.warn({ err }, 'SQL warn while updating last_timestamp');
                }
            }

            const token = fastify.generateToken(
                {
                    id: req.user.id,
                    username: req.user.username,
                    role: req.user.role,
                },
                true,
                '12h'
            );

            return reply.send({ token });
        } catch (err) {
            fastify.log.error({ err }, '2FA verify error');
            return reply.code(500).send({ error: 'internal_error' });
        }
    });
}