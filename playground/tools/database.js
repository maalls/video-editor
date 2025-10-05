import Database from '../src/backend/Database/Database.js';

import funcpick from './funcpick';

const videoPath = `/Users/malo/Sites/video-editor/playground/var/sample/videos/`;
const workdir = `/Users/malo/Sites/video-editor/playground/var/work`;

const db = new Database(videoPath, workdir);
const data = db.load();
console.log('data', data);
