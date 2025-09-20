import fs from 'fs';
import path from 'path';
import { execSync } from "child_process";
export default class Database {


    constructor(sourceFolder, workdir) {

        this.sourceFolder = sourceFolder;
        if(!workdir) {
            workdir = sourceFolder;
        }
        this.databaseFile = path.join(workdir, 'database.json');
        this.data = {};
    }

    refresh() {
        this.scan(true);

    }

    save() {
        fs.writeFileSync(this.databaseFile, JSON.stringify(this.data, null, 2));
    }

    load() {
        this.data = {};
        if (fs.existsSync(this.databaseFile)) {
            //console.log("Loading database from file:", this.databaseFile);
            const fileContent = fs.readFileSync(this.databaseFile);
            const data = JSON.parse(fileContent);
            this.data = data;
        } else {
            //console.log("Database file does not exist:", this.databaseFile);
            this.import();
        }
        return this.data;
    }

    import() {
        const files = this.getVideoFilenames();
        const data = files.map(file => {
            const videoInfo = this.getVideoInfoFromFilename(file);
            this.set(file, videoInfo);
        });
    }

    

    

    getVideoFilenames() {
        const files = fs.readdirSync(this.sourceFolder);
        const videoFiles = files.filter(file => file.endsWith('.MP4') && file.startsWith('GX'));
        return videoFiles;
    }

    getVideoInfoFromFilename(filename) {
        
        const fullPath = this.sourceFolder + '/' + filename;
        const ffprob = this.getFfprobeInfo(fullPath);
        const videoStream = ffprob.streams.find(s => s.codec_type === "video");
        const audioStream = ffprob.streams.find(s => s.codec_type === "audio");
    
        return {
            filename: filename,
            info: {
                ffprob: {
                    source: ffprob,
                    video: videoStream,
                    audio: audioStream
                }
            }
        };
    }

    getFfprobeInfo(filePath) {
        const output = execSync(
            `/usr/local/bin/ffprobe -v quiet -print_format json -show_format -show_streams "${filePath}"`
        ).toString();

        const info = JSON.parse(output);
        return info;
    }

    get(key) {
        return this.data[key];
    }

    set(key, value) {
        this.data[key] = value;
    }

    delete(key) {
        delete this.data[key];
    }

    has(key) {
        return key in this.data;
    }

    values() {
        console.log("values", Object.values(this.data));
        return Object.values(this.data);
    }

    size() {
        return Object.keys(this.data).length;
    }

}
