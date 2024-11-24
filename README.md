# Torrent Stream Player

A modern web application for streaming media content directly from torrent magnet links. Built with Node.js, WebTorrent, and Socket.IO.

## Features

- Stream videos and audio directly from torrent magnet links
- Real-time download progress tracking
- Support for multiple file formats
- Range request support for media streaming
- Modern, responsive UI
- WebSocket-based real-time updates

## Supported Formats

### Video
- MP4
- WebM
- MKV
- AVI
- MOV

### Audio
- MP3
- M4A
- WAV

## Prerequisites

- Node.js >= 18.0.0
- npm >= 8.0.0

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/torrent-stream-player.git
cd torrent-stream-player
```

2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
npm start
```

4. Open your browser and navigate to `http://localhost:3000`

## Usage

1. Enter a magnet link in the input field
2. Wait for the torrent metadata to load
3. Select the file you want to stream
4. The media player will start streaming the content

## Project Structure

```
torrent-stream-player/
├── src/
│   ├── app.js              # Main application file
│   ├── config/             # Configuration files
│   ├── controllers/        # Request handlers
│   ├── services/          # Business logic
│   └── utils/             # Utility functions
├── public/                # Static files
├── downloads/            # Temporary download directory
└── package.json         # Project metadata and dependencies
```

## Development

To start the server in development mode with auto-reload:

```bash
npm run dev
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Disclaimer

This application is for educational purposes only. Make sure you have the right to stream the content you're accessing.
