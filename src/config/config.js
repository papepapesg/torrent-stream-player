import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(dirname(dirname(__filename)));

export const config = {
    port: process.env.PORT || 3000,
    downloadPath: join(__dirname, 'downloads'),
    publicPath: join(__dirname, 'public'),
    supportedVideoFormats: ['mp4', 'webm', 'mkv', 'avi', 'mov'],
    supportedAudioFormats: ['mp3', 'm4a', 'wav'],
    mimeTypes: {
        'mp4': 'video/mp4',
        'webm': 'video/webm',
        'mkv': 'video/x-matroska',
        'avi': 'video/x-msvideo',
        'mov': 'video/quicktime',
        'mp3': 'audio/mpeg',
        'm4a': 'audio/mp4',
        'wav': 'audio/wav'
    }
};
