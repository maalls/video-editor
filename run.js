import Server from './src/backend/Server/Server.js';

const videoPath = `/Users/malo/Sites/video-editor/playground/var/sample/videos/`;
const workdir = `/Users/malo/Sites/video-editor/playground/var/work`;

const server = new Server(videoPath, workdir);
server.start();
