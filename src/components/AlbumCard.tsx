import type { Album } from "@/types";
import Link from 'next/link';
import Image from 'next/image';

const AlbumCard = ({ album }: { album: Album }) => {
  const imageUrl = album.artworkPath ? `/api/artwork/${album.id}` : '/images/default-album.svg';

  return (
    <Link href={`/album/${album.id}`} className="block group">
      <div className="bg-gray-800 p-4 rounded-lg hover:bg-gray-700 transition-colors duration-200">
        <div className="relative w-full aspect-square mb-4">
          <Image
            src={imageUrl}
            alt={album.name ?? 'Unknown Album'}
            width={500}
            height={500}
            className="rounded-md"
            priority={true}
          />
        </div>
        <h3 className="font-bold text-md truncate group-hover:underline">{album.name}</h3>
        <p className="text-sm text-gray-400 truncate">{album.artist ?? 'Various Artists'}</p>
      </div>
    </Link>
  );
}

export default AlbumCard;
