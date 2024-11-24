const socket = io();
let currentTorrent = null;

// DOM Elements
const magnetInput = document.getElementById('magnet-input');
const loadButton = document.getElementById('load-torrent');
const progressSection = document.querySelector('.progress-section');
const progressFill = document.querySelector('.progress-fill');
const progressText = document.getElementById('progress');
const speedText = document.getElementById('speed');
const peersText = document.getElementById('peers');
const filesSection = document.querySelector('.files-section');
const fileList = document.getElementById('file-list');
const playerSection = document.querySelector('.player-section');
const videoPlayer = document.getElementById('video-player');

// Format bytes to human readable format
function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Load torrent when button is clicked
loadButton.addEventListener('click', () => {
    const magnetURI = magnetInput.value.trim();
    if (!magnetURI) return;

    // Reset UI
    progressSection.style.display = 'block';
    filesSection.style.display = 'none';
    playerSection.style.display = 'none';
    fileList.innerHTML = '';
    progressFill.style.width = '0%';
    
    // Add torrent
    socket.emit('add-torrent', magnetURI);
    console.log('Sending magnet URI to server:', magnetURI);
});

// Handle torrent info
socket.on('torrent-info', ({ files, infoHash }) => {
    console.log('Received torrent info:', { files, infoHash });
    currentTorrent = { infoHash, files };
    filesSection.style.display = 'block';
    
    // Display file list
    files.forEach((file, index) => {
        const fileDiv = document.createElement('div');
        fileDiv.className = 'file-item';
        fileDiv.innerHTML = `
            <div>${file.name}</div>
            <div>Size: ${formatBytes(file.length)}</div>
        `;
        
        // Add click handler for file selection
        fileDiv.addEventListener('click', () => {
            console.log('File selected:', file.name, 'index:', index);
            playFile(index);
        });
        
        fileList.appendChild(fileDiv);
    });
});

// Handle download progress
socket.on('download-progress', ({ progress, downloadSpeed, peers }) => {
    console.log('Progress update:', { progress, downloadSpeed, peers });
    const percentage = Math.round(progress * 100);
    progressFill.style.width = `${percentage}%`;
    progressText.textContent = `Progress: ${percentage}%`;
    speedText.textContent = `Speed: ${formatBytes(downloadSpeed)}/s`;
    peersText.textContent = `Peers: ${peers}`;
});

// Handle torrent completion
socket.on('torrent-done', (infoHash) => {
    console.log('Torrent completed:', infoHash);
    if (currentTorrent && currentTorrent.infoHash === infoHash) {
        progressText.textContent = 'Download Complete!';
    }
});

// Play selected file
function playFile(fileIndex) {
    if (!currentTorrent) {
        console.error('No torrent selected');
        return;
    }
    
    console.log('Starting playback of file index:', fileIndex);
    playerSection.style.display = 'block';
    const streamUrl = `/stream/${currentTorrent.infoHash}/${fileIndex}`;
    console.log('Stream URL:', streamUrl);
    videoPlayer.src = streamUrl;
    videoPlayer.style.display = 'block';
    videoPlayer.play().catch(error => {
        console.error('Error playing video:', error);
    });
}

// Error handling for socket connection
socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
});

socket.on('error', (error) => {
    console.error('Socket error:', error);
});
