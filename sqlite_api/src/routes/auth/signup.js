// routes/auth/signup.js
export default async function (fastify, options) {
  fastify.post('/', async (request, reply) => {
    const { username, password } = request.body;

    const user = await fastify.showUser(fastify.db, username);

    if (user) {
      return reply.code(401).send({ error: 'username already use' });
    }

    // rajouter notre politique de mots de pass

    await fastify.createUser(fastify.db, { username: username, password: password});
    const token = fastify.generateToken({ username });
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
