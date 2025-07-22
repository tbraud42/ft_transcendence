// routes/auth/signup.js
// | Method   | Route              | Description                            | Access           |
// | -------- | ------------------ | -------------------------------------- | ---------------- |
// | `POST`   | `/signup`          | signup, reply by JWT token             | Public           |

export default async function (fastify, options) {
  fastify.post('/', async (request, reply) => {
    const { username, password } = request.body;

    const user = await fastify.showUser(fastify.db, username);

    if (user) {
      return reply.code(401).send({ error: 'username already use' });
    }

    const validation = validatePassword(password);
    if (!validation.valid) {
      const message = passwordFeedback(validation.errors);

      return reply.code(400).send({
        error: "Bad Request",
        code: "INVALID_PASSWORD_POLICY",
        message
      });
    }

    fastify.stat.signup++;
    await fastify.createUser(fastify.db, { username: username, password: password});
    const token = fastify.generateToken({ username });
    return reply.send({ token });
  });
}

function validatePassword(password) {
  const minLength = 8;

  const hasMinLength = password.length >= minLength;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);

  return {
    valid: hasMinLength && hasUppercase && hasLowercase && hasDigit && hasSymbol,
    errors: {
      minLength: hasMinLength,
      uppercase: hasUppercase,
      lowercase: hasLowercase,
      digit: hasDigit,
      symbol: hasSymbol
    }
  };
}

function passwordFeedback(errors) {
  const messages = [];
  if (!errors.minLength) messages.push("at least 8 characters");
  if (!errors.uppercase) messages.push("at least one uppercase letter");
  if (!errors.lowercase) messages.push("at least one lowercase letter");
  if (!errors.digit) messages.push("at least one digit");
  if (!errors.symbol) messages.push("at least one symbol");

  return `Password must contain ${messages.join(", ")}.`;
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
