import fs from 'fs';
import path from 'path';
import mkdirp from 'mkdirp';

function json(path) {
    return JSON.parse(fs.readFileSync(path, 'utf8'));
}

//
// This Db class is using synchronous access to the underlying file system.
// Therefore we don't have to be concerned about thread safety / concurent
// db access as the event looped is blocked during such synchronous operations
// This does not allow to scale properly, but for now we follow YAGNI principle
// as the Cauldron is not -yet- meant to be accessed concurently by a lot of
// users. We currently therefore favor safety using synchronous reads/writes.
export default class Db {
    constructor(dbPath) {
      if (!fs.existsSync(dbPath)) {
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

    commit(cb) {
        fs.writeFile(this._dbPath, JSON.stringify(this._cauldron), {encoding: 'utf8'}, cb);
    }
};
