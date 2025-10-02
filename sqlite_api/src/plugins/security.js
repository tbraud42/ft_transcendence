// plugins/security.js
import jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key';

// import verif password
import bcrypt from 'bcrypt';

export function generateToken(payload, twofa = true, expiresIn = '12h') {
  const fullPayload = {
    ...payload,
    twofa
  };

  return jwt.sign(fullPayload, JWT_SECRET, { expiresIn });
}

export function authenticate(fastify, { allow2FAPending = false } = {}) {
  return async function Authenticate(request, reply) {
    const auth = request.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) {
      return reply.code(401).send({ error: 'Unauthorized' }); // No token provided
    }

    const token = auth.slice(7);
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch {
      return reply.code(401).send({ error: 'Unauthorized' }); // Invalid token
    }

    const user = await fastify.showUserById(fastify.db, Number(decoded.id));
    if (!user) {
      return reply.code(401).send({ error: 'Unauthorized' }); // user no longer exists
    }

    const is2FAEnabled = !!(user.is_twofa_enabled === true || user.is_twofa_enabled === 1);
    const tokenHas2FA = !!decoded.twofa;

    if (is2FAEnabled && !tokenHas2FA && !allow2FAPending) {
      return reply.code(401).send({ error: 'Unauthorized' }); // Invalid token
    }

    request.user = { ...user, twofa: tokenHas2FA };
  };
}

export async function verifyPassword(password, hashedPassword) {
  return await bcrypt.compare(password, hashedPassword);
}

export function allowSelfOrAdmin(paramKey = 'id') {
  return async function allowSelfOrAdminHook(request, reply) {
    const user = request.user;
    if (!user) return reply.code(401).send({ error: 'Unauthorized' });

    const targetId = Number(request.params?.[paramKey]);
    if (!Number.isFinite(targetId)) {
      return reply.code(400).send({ error: 'Bad Request' });
    }

    if (user.role?.toLowerCase?.() === 'admin') return;
    if (Number(user.id) === targetId) return;

    return reply.code(403).send({ error: 'Access denied' });
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

export function usernameEndsWith42(name) {
  return name.toLowerCase().endsWith(FORBIDDEN_SUFFIX);
}
