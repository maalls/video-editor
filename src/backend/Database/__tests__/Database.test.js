import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import Database from '../Database.js';
const DIR = new URL('.', import.meta.url).pathname;
const VAR_DIR = DIR + '../../../../var';

describe('Database', () => {
    let database;
    const mockSourceFolder = VAR_DIR + '/sample/videos';
    const mockWorkDir = VAR_DIR + '/test/database';

    beforeEach(() => {
        // Setup before each test
        database = new Database(mockSourceFolder, mockWorkDir);
    });

    afterEach(() => {
        // Cleanup after each test
        database = null;
    });

    describe('Constructor', () => {
        test('should initialize with source folder and database file', () => {
            // TODO: Add constructor tests
            assert.strictEqual(database.sourceFolder, mockSourceFolder);
        });
    });

    describe("Database Operations", () => {

        test("Test videoFilenames()", () => {
            const videoFiles = database.getVideoFilenames();
            assert.strictEqual(videoFiles.length, 3);
            assert.ok(videoFiles.every(file => file.endsWith('.MP4')));
        });

        test.only("Test getVideoInfoFromFilename()", () => {
            const testFilename = 'GX012246.MP4';
            const videoInfo = database.getVideoInfoFromFilename(testFilename);
            assert.ok(videoInfo);
            //console.log("Video info:", videoInfo);
            assert.strictEqual(videoInfo.filename, testFilename);
            console.log("Video info:", JSON.stringify(videoInfo, null, 2));
        });

        test("Test set()", () => {
            const testFilename = 'GX012246.MP4';
            const testData = { duration: 447.73, fileSize: 1073741824 };
            database.set(testFilename, testData);
            assert.deepStrictEqual(database.get(testFilename), testData);
        });

        test("Test import()", () => {
            database.import();
            //console.log("Database data after import:", JSON.stringify(database.data, null, 2));
            assert.strictEqual(database.size(), 3);
        });

        test("Test load()", () => {
            database.load();
            //console.log("Database data after load:", JSON.stringify(database.data, null, 2));
            assert.strictEqual(database.size(), 3);
        });
        
        test("test save()", () => {
            database.load();
            const initialSize = database.size();
            database.save();
            const sample = fs.readFileSync(database.databaseFile);
            console.log("sample:", sample.toString());
        });
    });
});
