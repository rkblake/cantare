import { NextResponse } from "next/server";
import {
  getPlaylist,
  deletePlaylist,
  getTracksFromPlaylist,
  addToPlaylist,
  removeFromPlaylist,
  updatePlaylist,
} from "@/database/sqlite";
import type { Playlist } from "@/types";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const playlist = await getPlaylist(id);

  if (!playlist) {
    return new NextResponse("Playlist not found", { status: 404 });
  }

  const tracks = await getTracksFromPlaylist(playlist);

  return NextResponse.json({ playlist, tracks });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const playlist = await getPlaylist(id);

  if (!playlist) {
    return new NextResponse("Playlist not found", { status: 404 });
  }

  const { name, trackIds, action } = await request.json() as {
    action: "add" | "remove";
    name?: string;
    trackIds?: string[];
  };

  if (action === "add") {
    const updatedPlaylist: Playlist = {
      ...playlist,
      name: name ?? playlist.name,
      trackIds: trackIds ?? playlist.trackIds,
    };

    await updatePlaylist(id, { name: updatedPlaylist.name });

    if (trackIds) {
      await Promise.all(trackIds.map((trackId) => addToPlaylist(playlist, trackId)));
    }

    return NextResponse.json(updatedPlaylist);

  } else if (action === "remove") {

    if (!trackIds || trackIds.length === 0) {
      return new NextResponse("No trackIds given", { status: 400 });
    }

    await Promise.all(trackIds.map((trackId) => removeFromPlaylist(playlist, trackId)));

    return NextResponse.json({ status: 200 });
  }

}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await deletePlaylist(id);
  return new NextResponse(null, { status: 204 });
}

