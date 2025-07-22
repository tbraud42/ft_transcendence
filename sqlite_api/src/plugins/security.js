// plugins/decorate.js
import jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key';
// const jwtSecret = await getSecretFromVault('jwt-secret-key'); // pour import cle JWT depuis vault

// import verif mdp
import bcrypt from 'bcrypt';

export function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
}

export function requireRole(role) {
  return async function (request, reply) {
    if (!request.user || request.user.role !== role) {
      return reply.code(403).send({ error: 'Forbidden: insufficient rights' });
    }
  };
}

export async function authenticate(request, reply) {
  try {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    request.user = decoded;
  } catch (err) {
    reply.code(401).send({ error: 'Invalid token', message: err.message });
  }
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
