import { NextResponse } from "next/server";
import { db } from "@/database";
import type { Playlist } from "@/types";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  db.read();

  const playlist = db.data.playlists.find((p: Playlist) => p.id === id);
  if (!playlist) {
    return new NextResponse("Playlist not found", { status: 404 });
  }

  const tracks = db.data.tracks.filter((t) => playlist.trackIds.includes(t.id));
  return NextResponse.json({ playlist, tracks });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  db.read();

  const playlistIndex = db.data.playlists.findIndex((p: Playlist) => p.id === id);
  if (playlistIndex === -1) {
    return new NextResponse("Playlist not found", { status: 404 });
  }

  const { name, trackIds } = await request.json() as { name: string, trackIds: string[] };
  const originalPlaylist = db.data.playlists[playlistIndex];

  if (!originalPlaylist) {
    return new NextResponse("Playlist not found", { status: 404 });
  }

  const updatedPlaylist = {
    ...originalPlaylist,
    name: name ?? originalPlaylist.name,
    trackIds: trackIds ?? originalPlaylist.trackIds,
  };

  db.data.playlists[playlistIndex] = updatedPlaylist;
  db.write();

  return NextResponse.json(updatedPlaylist);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  db.read();

  const initialLength = db.data.playlists.length;
  db.data.playlists = db.data.playlists.filter((p: Playlist) => p.id !== id);

  if (db.data.playlists.length < initialLength) {
    db.write();
    return new NextResponse(null, { status: 204 });
  } else {
    return new NextResponse("Playlist not found", { status: 404 });
  }
}
