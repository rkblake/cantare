export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const db = await import('@/database');
    await db.initializeDatabase();
  }
}
