import express from 'express';
import { Server } from 'socket.io';
import { createServer } from 'http';
import { config } from './config/config.js';
import { torrentService } from './services/TorrentService.js';
import { handleStream } from './controllers/streamController.js';

const app = express();
const server = createServer(app);
const io = new Server(server);

// Serve static files
app.use(express.static(config.publicPath));

// WebSocket connection
io.on('connection', (socket) => {
    console.log('Client connected');
    
    socket.on('add-torrent', (magnetURI) => {
        torrentService.addTorrent(magnetURI, socket);
    });
});

// Stream endpoint
app.get('/stream/:infoHash/:fileIndex', handleStream);

server.listen(config.port, () => {
    console.log(`Server running at http://localhost:${config.port}`);
});
