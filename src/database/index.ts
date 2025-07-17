import { LowSync } from "lowdb";
import { JSONFileSync } from "lowdb/node";
import path from "path";
import type { DatabaseSchema } from "@/types";
import fs from "fs";

const dataDir = process.env.NODE_ENV === 'development'
  ? path.join(process.cwd(), '.data')
  : path.join(process.cwd(), 'data') // TODO: need stable location

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbFile = path.join(dataDir, 'db.json');

const adapter = new JSONFileSync<DatabaseSchema>(dbFile);
const defaultData: DatabaseSchema = {
  tracks: [],
  albums: [],
  artists: [],
  playlists: [],
  settings: { musicDirectory: '', databasePath: dbFile }
};

export const db = new LowSync(adapter, defaultData);

db.read();

if (!db.data || Object.keys(db.data).length == 0) {
  db.data = defaultData;
  db.write();
}
