import WebTorrent from 'webtorrent';
import { config } from '../config/config.js';
import { getContentType } from '../utils/fileUtils.js';

class TorrentService {
    constructor() {
        this.client = new WebTorrent();
        this.activeTorrents = new Map();
    }

    addTorrent(magnetURI, socket) {
        console.log('Adding torrent:', magnetURI);
        
        // Check if torrent already exists
        const existingTorrent = Array.from(this.client.torrents)
            .find(t => t.magnetURI === magnetURI);
            
        if (existingTorrent) {
            console.log('Torrent already exists, reusing:', existingTorrent.infoHash);
            this.activeTorrents.set(existingTorrent.infoHash, existingTorrent);
            this._sendTorrentInfo(socket, existingTorrent);
            return;
        }

        // Add new torrent
        this.client.add(magnetURI, { path: config.downloadPath }, (torrent) => {
            console.log('Torrent added:', torrent.infoHash);
            this.activeTorrents.set(torrent.infoHash, torrent);
            this._prioritizeVideoFiles(torrent);
            this._sendTorrentInfo(socket, torrent);
            this._setupErrorHandling(torrent, socket);
        });
    }

    getTorrent(infoHash) {
        return this.activeTorrents.get(infoHash);
    }

    _prioritizeVideoFiles(torrent) {
        if (torrent.files.length > 0) {
            const videoFiles = torrent.files.filter(file => {
                const ext = file.name.split('.').pop().toLowerCase();
                return config.supportedVideoFormats.includes(ext);
            });
            
            if (videoFiles.length > 0) {
                videoFiles[0].select();
            }
        }
    }

    _setupErrorHandling(torrent, socket) {
        torrent.on('error', (err) => {
            console.error('Torrent error:', err);
            socket.emit('error', 'Torrent error: ' + err.message);
        });
    }

    _sendTorrentInfo(socket, torrent) {
        const files = torrent.files.map(file => ({
            name: file.name,
            length: file.length,
            path: file.path
        }));
        
        socket.emit('torrent-info', {
            files,
            infoHash: torrent.infoHash
        });

        this._setupProgressUpdates(socket, torrent);
    }

    _setupProgressUpdates(socket, torrent) {
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
}

export const torrentService = new TorrentService();
