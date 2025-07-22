'server only';
import { openDb, createTables } from './sqlite';
import fs from 'fs';
import path from 'path';

export async function initializeDatabase() {
  const dataDir = process.env.NODE_ENV === 'development'
    ? path.join(process.cwd(), '.data')
    : path.join(process.cwd(), 'data')

  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
  }

  const db = await openDb();
  await createTables();
  return db;
}
