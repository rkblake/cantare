import { NextResponse } from "next/server";
import { db } from "@/database";
import type { Playlist } from "@/types";
import { v4 as uuidv4 } from "uuid";

export async function GET() {
  db.read();
  return NextResponse.json(db.data.playlists);
}

export async function POST(request: Request) {
  db.read();
  const { name } = await request.json() as { name: string };

  const newPlaylist: Playlist = {
    id: uuidv4(),
    name,
    createdAt: Date.now(),
    trackIds: [],
  };

  db.data.playlists.push(newPlaylist);
  db.write();

  return NextResponse.json(newPlaylist);
}
