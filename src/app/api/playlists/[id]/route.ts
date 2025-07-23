import { NextResponse } from "next/server";
import {
  getPlaylist,
  deletePlaylist,
  getTracksFromPlaylist,
  addToPlaylist,
  removeFromPlaylist,
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

    trackIds?.forEach((t) => {
      void (async () => {
        await addToPlaylist(playlist, t);
      })();
    })

    return NextResponse.json(updatedPlaylist);

  } else if (action === "remove") {

    if (trackIds?.length == 0) {
      return new NextResponse("No trackIds given", { status: 400 });
    }

    // const updatedPlaylist: Playlist = {
    //   ...playlist,
    //   trackIds: playlist.trackIds.filter(id => !trackIds?.includes(id)),
    //   name: name ?? playlist.name,
    // }

    trackIds?.forEach((t) => {
      void (async () => {
        await removeFromPlaylist(playlist, t);
      })();
    })

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

