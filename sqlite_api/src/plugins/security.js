// plugins/decorate.js
import jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key';
// const jwtSecret = await getSecretFromVault('jwt-secret-key'); // pour import key JWT depuis vault

// import verif mdp
import bcrypt from 'bcrypt';

export function generateToken(payload, twofa = true, expiresIn = '12h') {
  const fullPayload = {
    ...payload,
    twofa
  };

  return jwt.sign(fullPayload, JWT_SECRET, { expiresIn });
}

export function requireRole(role) {
  return async function (request, reply) {
    if (!request.user || request.user.role !== role) {
      return reply.code(403).send({ error: 'Forbidden: insufficient rights' });
    }
  };
}

export function authenticate(fastify) {
  return async function Authenticate(request, reply) {
    try {
      const authHeader = request.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return reply.code(401).send({ error: 'Unauthorized' });// : No token provided
      }

      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);

      const user = await fastify.showUserById(fastify.db, parseInt(decoded.id));
      if (!user || !decoded.twofa) {
        return reply.code(401).send({ error: 'Unauthorized' }); // : user no longer exists
      }

      request.user = {
        ...decoded,
        ...user
      };
    } catch (err) {
      return reply.code(401).send({ error: 'Unauthorized', message: err.message }); // Invalid token
    }
  };
}

export async function verifyPassword(password, hashedPassword) {
  return await bcrypt.compare(password, hashedPassword);
}

export function allowSelfOrAdmin(paramKey = 'id') {
  return async function (request, reply) {
    const { user } = request;
    const targetId = Number(request.params[paramKey]);

    if (!user) {
      return reply.code(401).send({ error: 'Not authenticated' });
    }

    if (user.role === 'admin') return;
    if (user.userId !== targetId) {
      return reply.code(403).send({ error: 'Access denied: not your data' });
    }
  };
}

export async function validatePassword(password) {
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

export async function passwordFeedback(errors) {
  const messages = [];
  if (!errors.minLength) messages.push("at least 8 characters");
  if (!errors.uppercase) messages.push("at least one uppercase letter");
  if (!errors.lowercase) messages.push("at least one lowercase letter");
  if (!errors.digit) messages.push("at least one digit");
  if (!errors.symbol) messages.push("at least one symbol");

  return `Password must contain ${messages.join(", ")}.`;
}

const FORBIDDEN_SUFFIX = '_42';

export async function usernameEndsWith42(name) {
  return name.toLowerCase().endsWith(FORBIDDEN_SUFFIX);
}
