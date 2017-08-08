// @flow

import {
  mkdirp,
  writeFile
} from './fs-util'
import BaseGit from './base-git'
import fs from 'fs'
import path from 'path'

function trim (v: string) : string {
  return v && v.trim()
}
export default class FileStore extends BaseGit {
  _prefix : string

  constructor (
    ernPath: string,
    repository: string,
    branch: string,
    prefix: string) {
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
  async storeFile (identifier: string, content: string | Buffer) {
    await this.sync()
    const storeDirectoryPath = path.resolve(this.path, this._prefix)
    console.log(`creating dir ${storeDirectoryPath}`)
    await mkdirp(storeDirectoryPath)
    const pathToFile = path.resolve(storeDirectoryPath, identifier)
    await writeFile(pathToFile, content, {flag: 'w'})
    await this.git.addAsync(pathToFile)
    await this.git.commitAsync(`[added file] ${identifier}`)
    await this.push()
  }

  async hasFile (filename: string) {
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
  async getFile (filename: string) {
    await this.sync()
    return fs.readFileSync(this.pathToFile(filename))
  }

  /**
  * Removes a file from this store
  *
  * @param {string} filename - The name of the file to remove
  */
  async removeFile (filename: string) {
    await this.sync()
    await this.git.rmAsync(this.pathToFile(filename))
    await this.git.commitAsync(`[removed file] ${filename}`)
    return this.push()
  }

  pathToFile (filename: string) {
    return path.join(this.path, this._prefix, filename)
  }
}
