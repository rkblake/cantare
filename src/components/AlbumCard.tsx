import type { Album } from "@/types";

const AlbumCard = ({ album }: { album: Album }) => {
  return (
    <div>
      Album: {album.name}
    </div>
  )
}

export default AlbumCard;
