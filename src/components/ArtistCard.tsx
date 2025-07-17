import type { Artist, Album } from '@/types';
import Link from 'next/link';
import Image from 'next/image';
import { db } from '@/database';

interface ArtistCardProps {
  artist: Artist;
}

const ArtistCard: React.FC<ArtistCardProps> = ({ artist }) => {
  db.read();
  const firstAlbum: Album | undefined = db.data.albums.find(a => a.id === artist.albumIds[0]);
  const imageUrl = firstAlbum?.artworkPath ? `/api/artwork/${firstAlbum.id}` : '/images/default-artist.svg';

  return (
    <Link href={`/artist/${artist.id}`} className="block group">
      <div className="bg-gray-800 p-4 rounded-lg hover:bg-gray-700 transition-colors duration-200 flex flex-col items-center text-center">
        <div className="relative w-32 h-32 mb-4">
          <Image
            src={imageUrl}
            alt={artist.name ?? 'Unknown Artist'}
            layout="fill"
            objectFit="cover"
            className="rounded-full"
          />
        </div>
        <h3 className="font-bold text-md truncate group-hover:underline">{artist.name}</h3>
        <p className="text-sm text-gray-400">Artist</p>
      </div>
    </Link>
  );
};

export default ArtistCard;

