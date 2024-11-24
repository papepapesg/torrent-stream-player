import { torrentService } from '../services/TorrentService.js';
import { setupStream } from '../utils/fileUtils.js';

export async function handleStream(req, res) {
    const { infoHash, fileIndex } = req.params;
    console.log('Stream request:', { infoHash, fileIndex });
    
    try {
        const torrent = torrentService.getTorrent(infoHash);
        if (!torrent) {
            console.error('Torrent not found:', infoHash);
            return res.status(404).send('Torrent not found');
        }

        const index = parseInt(fileIndex, 10);
        const file = torrent.files[index];
        
        if (!file) {
            console.error('File not found:', { index, totalFiles: torrent.files.length });
            return res.status(404).send('File not found');
        }

        const stream = setupStream(file, req.headers.range, res);

        // Handle client disconnection
        req.on('close', () => {
            console.log('Client disconnected, cleaning up stream');
            stream.destroy();
        });

        stream.pipe(res);
    } catch (error) {
        console.error('Streaming error:', error);
        if (!res.headersSent) {
            res.status(500).send('Internal server error');
        }
    }
}
