import { NextResponse } from "next/server";
import { getPlaylists, createPlaylist } from "@/database/sqlite";
import type { Playlist } from "@/types";
import { v4 as uuidv4 } from "uuid";

export async function GET() {
  const playlists = await getPlaylists();
  return NextResponse.json(playlists);
}

export async function POST(request: Request) {
  const { name } = await request.json() as { name: string };

  const newPlaylist: Playlist = {
    id: uuidv4(),
    name,
    createdAt: Date.now(),
    trackIds: [],
  };

  await createPlaylist(newPlaylist);

  return NextResponse.json(newPlaylist);
}

