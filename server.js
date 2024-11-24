import express from 'express';
import { Server } from 'socket.io';
import { createServer } from 'http';
import WebTorrent from 'webtorrent';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = createServer(app);
const io = new Server(server);
const client = new WebTorrent();

// Store active torrents
const activeTorrents = new Map();

// Serve static files
app.use(express.static(join(__dirname, 'public')));

// WebSocket connection
io.on('connection', (socket) => {
    console.log('Client connected');
    
    socket.on('add-torrent', (magnetURI) => {
        console.log('Adding torrent:', magnetURI);
        
        // Check if we already have this torrent
        const existingTorrent = Array.from(client.torrents).find(t => t.magnetURI === magnetURI);
        if (existingTorrent) {
            console.log('Torrent already exists, reusing:', existingTorrent.infoHash);
            activeTorrents.set(existingTorrent.infoHash, existingTorrent);
            sendTorrentInfo(socket, existingTorrent);
            return;
        }

        client.add(magnetURI, { path: join(__dirname, 'downloads') }, (torrent) => {
            console.log('Torrent added:', torrent.infoHash);
            activeTorrents.set(torrent.infoHash, torrent);
            
            // Select the first file to prioritize its download
            if (torrent.files.length > 0) {
                const videoFiles = torrent.files.filter(file => {
                    const ext = file.name.split('.').pop().toLowerCase();
                    return ['mp4', 'mkv', 'avi', 'mov', 'webm'].includes(ext);
                });
                
                if (videoFiles.length > 0) {
                    videoFiles[0].select();
                }
            }
            
            sendTorrentInfo(socket, torrent);

            torrent.on('error', (err) => {
                console.error('Torrent error:', err);
                socket.emit('error', 'Torrent error: ' + err.message);
            });
        });
    });
});

function sendTorrentInfo(socket, torrent) {
    const files = torrent.files.map(file => ({
        name: file.name,
        length: file.length,
        path: file.path
    }));
    
    socket.emit('torrent-info', {
        files,
        infoHash: torrent.infoHash
    });

    // Send progress updates
    const interval = setInterval(() => {
        if (!torrent.client) {
            clearInterval(interval);
            return;
        }
        
        socket.emit('download-progress', {
            progress: torrent.progress,
            downloadSpeed: torrent.downloadSpeed,
            peers: torrent.numPeers
        });

        if (torrent.progress === 1) {
            clearInterval(interval);
            socket.emit('torrent-done', torrent.infoHash);
        }
    }, 1000);
}

// Stream endpoint
app.get('/stream/:infoHash/:fileIndex', async (req, res) => {
    const { infoHash, fileIndex } = req.params;
    console.log('Stream request:', { infoHash, fileIndex });
    
    const torrent = activeTorrents.get(infoHash);
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

    // Set proper content type based on file extension
    const contentType = getContentType(file.name);

    // Handle range requests
    const range = req.headers.range;
    
    try {
        if (!range) {
            const head = {
                'Content-Length': file.length,
                'Content-Type': contentType,
                'Accept-Ranges': 'bytes'
            };
            res.writeHead(200, head);
            
            const stream = file.createReadStream();
            stream.on('error', (error) => {
                console.error('Stream error:', error);
                if (!res.headersSent) {
                    res.status(500).send('Streaming error occurred');
                }
            });
            
            stream.pipe(res);
            return;
        }

        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : file.length - 1;
        const chunksize = (end - start) + 1;

        const head = {
            'Content-Range': `bytes ${start}-${end}/${file.length}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunksize,
            'Content-Type': contentType,
        };

        res.writeHead(206, head);
        const stream = file.createReadStream({ start, end });
        
        stream.on('error', (error) => {
            console.error('Stream error:', error);
            if (!res.headersSent) {
                res.status(500).send('Streaming error occurred');
            }
        });

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
});

function getContentType(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    const types = {
        'mp4': 'video/mp4',
        'webm': 'video/webm',
        'mkv': 'video/x-matroska',
        'avi': 'video/x-msvideo',
        'mov': 'video/quicktime',
        'mp3': 'audio/mpeg',
        'm4a': 'audio/mp4',
        'wav': 'audio/wav'
    };
    return types[ext] || 'application/octet-stream';
}

const port = process.env.PORT || 3000;
server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
