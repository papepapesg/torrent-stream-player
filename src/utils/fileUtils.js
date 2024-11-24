import { config } from '../config/config.js';

export function getContentType(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    return config.mimeTypes[ext] || 'application/octet-stream';
}

export function handleStreamError(error, res) {
    console.error('Stream error:', error);
    if (!res.headersSent) {
        res.status(500).send('Streaming error occurred');
    }
}

export function setupStream(file, range, res) {
    const contentType = getContentType(file.name);

    if (!range) {
        return setupFullStream(file, contentType, res);
    }

    return setupRangeStream(file, range, contentType, res);
}

function setupFullStream(file, contentType, res) {
    const head = {
        'Content-Length': file.length,
        'Content-Type': contentType,
        'Accept-Ranges': 'bytes'
    };
    res.writeHead(200, head);
    
    const stream = file.createReadStream();
    stream.on('error', (error) => handleStreamError(error, res));
    
    return stream;
}

function setupRangeStream(file, range, contentType, res) {
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
    stream.on('error', (error) => handleStreamError(error, res));
    
    return stream;
}
