import type { Artist } from '@/types';
import Link from 'next/link';
import Image from 'next/image';

interface ArtistCardProps {
  artist: Artist;
  imageUrl: string;
}

const ArtistCard: React.FC<ArtistCardProps> = ({ artist, imageUrl }) => {

  return (
    <Link href={`/artist/${artist.id}`} className="block group">
      <div className="bg-gray-800 p-4 rounded-lg hover:bg-gray-700 transition-colors duration-200 flex flex-col items-center text-center">
        <div className="w-32 h-32 mb-4">
          <Image
            src={imageUrl}
            alt={artist.name ?? 'Unknown Artist'}
            width={500}
            height={500}
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

