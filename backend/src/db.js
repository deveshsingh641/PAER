import fs from 'node:fs/promises';
import path from 'node:path';

const dataDir = path.resolve(process.cwd(), 'data');
const dbPath = path.join(dataDir, 'db.json');

const emptyDb = {
  users: [],
  otpChallenges: [],
  applications: [],
};

let memoryCache = null;
let writeChain = Promise.resolve();

async function ensureDbFile() {
  await fs.mkdir(dataDir, { recursive: true });
  try {
    await fs.access(dbPath);
  } catch {
    await fs.writeFile(dbPath, JSON.stringify(emptyDb, null, 2), 'utf8');
  }
}

export async function readDb() {
  if (memoryCache) return memoryCache;
  await ensureDbFile();
  const raw = await fs.readFile(dbPath, 'utf8');
  memoryCache = JSON.parse(raw);
  return memoryCache;
}

export async function writeDb(nextDb) {
  await ensureDbFile();
  memoryCache = nextDb;
  const tmpPath = dbPath + '.tmp';

  writeChain = writeChain.then(async () => {
    await fs.writeFile(tmpPath, JSON.stringify(nextDb, null, 2), 'utf8');
    await fs.rename(tmpPath, dbPath);
  });

  return writeChain;
}

export async function updateDb(mutator) {
  const db = await readDb();
  const result = await mutator(db);
  await writeDb(db);
  return result;
}

export function nowIso() {
  return new Date().toISOString();
}
