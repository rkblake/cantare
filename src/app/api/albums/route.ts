import { NextResponse } from 'next/server';
import { db } from '@/database';

export async function GET() {
  db.read();
  return NextResponse.json(db.data.albums);
}