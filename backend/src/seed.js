import { nanoid } from 'nanoid';
import bcrypt from 'bcryptjs';
import { updateDb, nowIso } from './db.js';

export const DEMO_USER = {
  email: 'hire-me@anshumat.org',
  password: 'HireMe@2025!',
  name: 'Demo Reviewer',
};

export async function ensureDemoUser() {
  await updateDb(async (db) => {
    const existing = db.users.find((u) => (u.email || '').toLowerCase() === DEMO_USER.email.toLowerCase());
    if (existing) return;

    const passwordHash = await bcrypt.hash(DEMO_USER.password, 10);
    db.users.push({
      id: nanoid(),
      email: DEMO_USER.email,
      passwordHash,
      name: DEMO_USER.name,
      createdAt: nowIso(),
    });
  });
}
