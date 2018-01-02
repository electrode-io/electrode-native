// @flow

import type { BinaryStore } from './BinaryStore'
import NativeApplicationDescriptor from './NativeApplicationDescriptor'
import * as childProcess from './childProcess'
import {
  spawn
} from 'child_process'
import fs from 'fs'
import path from 'path'
import tmp from 'tmp'
import archiver from 'archiver'
const DecompressZip = require('decompress-zip')
const {
  execp
} = childProcess

export default class ErnBinaryStore implements BinaryStore {
  _config: Object

  constructor (config: Object) {
    this._config = config
  }

  async addBinary (descriptor: NativeApplicationDescriptor, binaryPath: string) : Promise<string | Buffer> {
    const pathToBinary = await this.zipBinary(descriptor, binaryPath)
    return execp(`curl -XPOST ${this._config.url} -F file=@"${pathToBinary}"`)
  }

  async removeBinary (descriptor: NativeApplicationDescriptor) : Promise<string | Buffer> {
    return execp(`curl -XDELETE ${this.urlToBinary(descriptor)}`)
  }

  async getBinary (descriptor: NativeApplicationDescriptor, {
    outDir
  } : {
    outDir?: string
  } = {}) : Promise<string> {
    const pathToZippedBinary = await this.getZippedBinary(descriptor)
    return this.unzipBinary(descriptor, pathToZippedBinary, { outDir })
  }

  async hasBinary (descriptor: NativeApplicationDescriptor) : Promise<string | Buffer> {
    return execp(`curl -XOPTIONS -s -o /dev/null -w '%{http_code}' ${this.urlToBinary(descriptor)}`)
  }

  async getZippedBinary (descriptor: NativeApplicationDescriptor) : Promise<string> {
    return new Promise((resolve, reject) => {
      const tmpOutDir = tmp.dirSync({ unsafeCleanup: true }).name
      const outputFilePath = path.join(tmpOutDir, this.buildZipBinaryFileName(descriptor))
      const outputFile = fs.createWriteStream(outputFilePath)
      const curl = spawn('curl', [ this.urlToBinary(descriptor) ])
      curl.stdout.pipe(outputFile)
      outputFile.on('error', err => reject(err))
      curl.on('close', err => err ? reject(err) : resolve(outputFilePath))
    })
  }

  urlToBinary (descriptor: NativeApplicationDescriptor) {
    return `${this._config.url}/${this.buildZipBinaryFileName(descriptor)}`
  }

  async zipBinary (descriptor: NativeApplicationDescriptor, binaryPath: string) : Promise<string> {
    return new Promise((resolve, reject) => {
      const tmpOutDir = tmp.dirSync({ unsafeCleanup: true }).name
      const pathToZipFile = path.join(tmpOutDir, this.buildZipBinaryFileName(descriptor))
      const outputZipStream = fs.createWriteStream(pathToZipFile)
      const archive = archiver('zip', { zlib: { level: 9 } })
      outputZipStream.on('close', () => resolve(pathToZipFile))
      archive.on('error', err => reject(err))
      archive.pipe(outputZipStream)
      if (descriptor.platform === 'android') {
        archive.file(binaryPath, { name: path.basename(binaryPath) })
      } else {
        archive.glob('**/*', { cwd: binaryPath })
      }
      archive.finalize()
    })
  }

  async unzipBinary (
    descriptor: NativeApplicationDescriptor,
     zippedBinaryPath: string, {
      outDir
    } : {
      outDir?: string
    } = {}) : Promise<string> {
    return new Promise((resolve, reject) => {
      const outputDirectory = outDir || tmp.dirSync({ unsafeCleanup: true }).name
      const pathToOutputBinary = path.join(outputDirectory, this.buildNativeBinaryFileName(descriptor))
      const unzipper = new DecompressZip(zippedBinaryPath)
      unzipper.on('error', err => reject(err))
      unzipper.on('extract', () => resolve(pathToOutputBinary))
      if (descriptor.platform === 'android') {
        unzipper.extract({ path: path.dirname(pathToOutputBinary) })
      } else {
        unzipper.extract({ path: pathToOutputBinary })
      }
    })
  }

  buildZipBinaryFileName (descriptor: NativeApplicationDescriptor) {
    if (!descriptor.version || !descriptor.platform) {
      throw new Error('[buildZipBinaryFileName] Require a complete native application descriptor')
    }
    return `${descriptor.name}-${descriptor.platform}-${descriptor.version}.zip`
  }

  buildNativeBinaryFileName (descriptor: NativeApplicationDescriptor) {
    if (!descriptor.version || !descriptor.platform) {
      throw new Error('[buildNativeBinaryFileName] Require a complete native application descriptor')
    }
    return `${descriptor.name}-${descriptor.platform}-${descriptor.version}.${this.getNativeBinaryFileExt(descriptor.platform)}`
  }

  getNativeBinaryFileExt (platformName: string) {
    return platformName === 'android' ? 'apk' : 'app'
  }
}
