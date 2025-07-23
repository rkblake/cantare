import { getSettings } from '@/database/sqlite';
import { scanMusicDirectorySql } from '@/database/utils';

export async function GET() {
  const settings = await getSettings();
  const musicDirectory = settings?.musicDirectory;

  if (!musicDirectory) {
    return new Response('Music directory not set', { status: 400 });
  }

  const stream = new ReadableStream({
    start(controller) {
      const onProgress = (progress: { total: number, processed: number }) => {
        const data = `data: ${JSON.stringify(progress)}\n\n`;
        controller.enqueue(new TextEncoder().encode(data));
      };

      scanMusicDirectorySql(musicDirectory, onProgress)
        .then(() => {
          console.log('Scan complete, sending close event.');
          controller.enqueue('event: close\ndata: Scan complete\n\n');
          controller.close();
        })
        .catch((error) => {
          console.error('Scan failed, closing stream with error:', error);
          controller.error(error);
        });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
