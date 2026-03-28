import jwt from 'jsonwebtoken';
import { updateDb } from './db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const TOKEN_TTL_SECONDS = 60 * 60 * 8; // 8h

export function signToken({ userId }) {
  return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: TOKEN_TTL_SECONDS });
}

export function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'UNAUTHENTICATED', message: 'Login required.' });
  }

  const token = header.slice('Bearer '.length);
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.userId = payload.sub;
    return next();
  } catch {
    return res.status(401).json({ error: 'UNAUTHENTICATED', message: 'Session expired. Please log in again.' });
  }
}

export async function getUserSafe(userId) {
  return updateDb((db) => {
    const user = db.users.find((u) => u.id === userId);
    if (!user) return null;
    return {
      id: user.id,
      email: user.email ?? null,
      phone: user.phone ?? null,
      name: user.name ?? null,
      dob: user.dob ?? null,
      city: user.city ?? null,
    };
  });
}
