import fs from 'fs';
import path from 'path';
import mkdirp from 'mkdirp';

function json(path) {
    return JSON.parse(fs.readFileSync(path, 'utf8'));
}

export default class Db {
    constructor(dbPath) {
        try {
            fs.statSync(dbPath);
        } catch (e) {
            mkdirp(path.dirname(dbPath));
            console.log("-");
            fs.writeFileSync(dbPath, '{"nativeApps":[], "reactNativeApps":[]}');
        }
        this._dbPath = dbPath;
        this._cauldron = json(this._dbPath);
    }

    get cauldron() {
        return this._cauldron = json(this._dbPath);
    }

    commit() {
        fs.writeFileSync(this._dbPath, JSON.stringify(this._cauldron));
    }
};
