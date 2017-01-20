import fs from 'fs';
import mkdirp from 'mkdirp';

export default class FileStore {
  /**
   * Instanciate a FileStore
   *
   * @param {string} path - Path to the folder where this FileStore will store files
   */
  constructor(path) {
    this._path = path;
    try {
      fs.statSync(this._path);
    } catch (e) {
      mkdirp(this._path);
    }
  }

  /**
   * Stores a file in this file store
   *
   * @param {string} filename - The name of the file to store
   * @param {string|Buffer} data - The file binary data
   */
  storeFile(filename, data) {
    fs.writeFileSync(this.pathToFile(filename), data);
  }

  hasFile(filename) {
    try {
      fs.statSync(this.pathToFile(filename)).isFile();
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Retrieves a file from this store
   *
   * @param {string} filename - The name of the file to retrieve
   * @return {Buffer} The file binary data
   */
  getFile(filename) {
    return fs.readFileSync(this.pathToFile(filename));
  }

  /**
   * Removes a file from this store
   *
   * @param {string} filename - The name of the file to remove
   */
  removeFile(filename) {
    fs.unlinkSync(this.pathToFile(filename));
  }

  pathToFile(filename) {
    return this._path + '/' + filename;
  }
}
