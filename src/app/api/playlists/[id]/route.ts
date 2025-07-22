import { NextResponse } from "next/server";
import {
  getPlaylist,
  getTracks,
  updatePlaylist,
  deletePlaylist,
} from "@/database/sqlite";
import type { Playlist } from "@/types";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const playlist = await getPlaylist(id);

  if (!playlist) {
    return new NextResponse("Playlist not found", { status: 404 });
  }

  const tracks = await getTracks();
  const playlistTracks = tracks.filter((t) => playlist.trackIds.includes(t.id));

  return NextResponse.json({ playlist, tracks: playlistTracks });
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const playlist = await getPlaylist(id);

  if (!playlist) {
    return new NextResponse("Playlist not found", { status: 404 });
  }

  const { name, trackIds } = await request.json() as {
    name?: string;
    trackIds?: string[];
  };

  const updatedPlaylist: Playlist = {
    ...playlist,
    name: name ?? playlist.name,
    trackIds: trackIds ?? playlist.trackIds,
  };

  await updatePlaylist(id, updatedPlaylist);

  return NextResponse.json(updatedPlaylist);
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  await deletePlaylist(id);
  return new NextResponse(null, { status: 204 });
}

