import fs from 'fs'
import BaseGit from './base-git'
import path from 'path'
import { writeFile, mkdirp} from './fs-util'
function trim(v) {
  return v && v.trim()
}
export default class FileStore extends BaseGit {
  
  constructor(ernPath, repository, branch, prefix) {
    super(ernPath, repository, branch)
    this._prefix = prefix
  }
  
  /**
  * Stores a file in this file store
  *
  * @param {string} filename - The name of the file to store
  * @param {string|Buffer} data - The file binary data
  * @return sha1 hash from git.
  */
  async storeFile(identifier, content) {
    await this.sync()
    await mkdirp(path.resolve(this.path, this._prefix))
    const relPath = this.pathToFile(identifier)
    await writeFile(path.resolve(this.path, relPath), content, {flag: 'w'})
    await this.git.addAsync(relPath)
    await this.git.commitAsync(`[added file] ${identifier}`)
    await this.push()
    
    const sha1 = await this.git.revparseAysnc([`:${relPath}`])
    return trim(sha1)
  }
  
  
  async hasFile(filename) {
    await this.sync()
    try {
      fs.statSync(this.pathToFile(filename)).isFile()
      return true
    } catch (e) {
      return false
    }
  }
  
  /**
  * Retrieves a file from this store
  *
  * @param {string} filename - The name of the file to retrieve
  * @return {Buffer} The file binary data
  */
  async getFile(filename) {
    await this.sync()
    return fs.readFileSync(this.pathToFile(filename))
  }
  
  /**
  * Removes a file from this store
  *
  * @param {string} filename - The name of the file to remove
  */
  async removeFile(filename) {
    await this.sync()
    await this.git.rmAsync(this.pathToFile(filename))
    return this.push()
  }
  
  pathToFile(filename) {
    return path.join(this._prefix, filename)
  }
}
