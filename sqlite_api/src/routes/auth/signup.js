// routes/auth/signup.js
// | Method   | Route              | Description                            | Access           |
// | -------- | ------------------ | -------------------------------------- | ---------------- |
// | `POST`   | `/auth/signup`     | signup, reply by JWT token             | Public           |

export default async function (fastify, options) {
  fastify.post('/', async (req, reply) => {
    const { username, password } = req.body;

    const user = await fastify.showUserByUsername(fastify.db, username);
    if (user) {
      return reply.code(401).send({ error: 'username already use' });
    }

    const validation = await fastify.validatePassword(password);
    if (!validation.valid) {
      const message = await fastify.passwordFeedback(validation.errors);

      return reply.code(400).send({
        error: "Bad Request",
        code: "INVALID_PASSWORD_POLICY",
        message
      });
    }

    fastify.stat.signup++;
    const newUser = await fastify.createUser(fastify.db, { username: username, password: password});
    const token = fastify.generateToken({id: newUser.userId, username: newUser.username, role: newUser.role,}, true, '12h');
    return reply.send({ token });
  });
}

// Longueur et complexité raisonnables
//  Minimum 8-12 caractères
//  Inclure majuscules, minuscules, chiffres, symboles

// Hachage sécurisé
//  Utiliser argon2, bcrypt, ou PBKDF2 avec un sel unique

// Pas de stockage en clair
//  Même en base locale, tout doit être hashé

// 2FA fortement recommandé
//  Surtout si des données sensibles sont accessibles

// Gestion des tentatives
//  Limiter les tentatives de connexion (ex: rate limit, CAPTCHA)

// Réinitialisation sécurisée
//  Token temporaire, expiration rapide, lien à usage unique

// Journalisation des connexions
//  Pour détecter les comportements suspects (conforme à l’obligation de surveillance)
