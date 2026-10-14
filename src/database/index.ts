'server only';
import { openDb, createTables } from './sqlite';
import { dataDir } from './paths';
import fs from 'fs';

export async function initializeDatabase() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const db = await openDb();
  await createTables();
  return db;
}
