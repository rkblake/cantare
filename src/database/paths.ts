import path from 'path';

const dataDirName = process.env.NODE_ENV === 'development' ? '.data' : 'data';

export const dataDir = path.join(process.cwd(), dataDirName);
export const databasePath = path.join(dataDir, 'cantare.db');
export const artworkDir = path.join(dataDir, 'artwork');
