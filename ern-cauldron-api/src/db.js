import fs from 'fs';
import path from 'path';
import mkdirp from 'mkdirp';

export default class Db {
  constructor(dbPath) {
    try {
      fs.statSync(dbPath);
    } catch (e) {
      mkdirp(path.dirname(dbPath));
      console.log("-");
      fs.writeFileSync(dbPath, '{"nativeApps":[], "reactNativeApps":[]}');
    }

    this._cauldron = require(dbPath);
    this._dbPath = dbPath;
  }

  get cauldron() {
    return this._cauldron;
  }

  commit() {
    fs.writeFileSync(this._dbPath, JSON.stringify(this._cauldron));
  }
};
