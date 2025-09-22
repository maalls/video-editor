import MultiProjectServer from './src/backend/Server/MultiProjectServer.js';

const videoPath = `/Users/malo/Sites/video-editor/playground/var/work/legacy-project/dailies/`;
const workdir = `/Users/malo/Sites/video-editor/playground/var/work`;

const server = new MultiProjectServer(videoPath, workdir);
server.start();
