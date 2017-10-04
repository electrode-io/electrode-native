// @flow

import type { BinaryStore } from './BinaryStore'
import {
  NativeApplicationDescriptor
} from 'ern-util'
import {
  exec,
  spawn
} from 'child_process'
import fs from 'fs'
import path from 'path'
import tmp from 'tmp'

export default class ErnBinaryStore implements BinaryStore {
  _config: Object

  constructor (config: Object) {
    this._config = config
  }

  async addBinary (descriptor: NativeApplicationDescriptor, binaryPath: string) : Promise<boolean> {
    return new Promise((resolve, reject) => {
      exec(`curl -XPOST ${this._config.url} -F file=@"${binaryPath};filename=${this.buildNativeBinaryFileName(descriptor)}"`,
        (error, stdout, stderr) => {
          if (error) {
            reject(error)
          } else {
            resolve(true)
          }
        })
    })
  }

  async removeBinary (descriptor: NativeApplicationDescriptor) : Promise<boolean> {
    return new Promise((resolve, reject) => {
      exec(`curl -XDELETE ${this.urlToBinary(descriptor)}`,
        (error, stdout, stderr) => {
          if (error) {
            reject(error)
          } else {
            resolve(true)
          }
        })
    })
  }

  async getBinary (descriptor: NativeApplicationDescriptor, {
    outDir
  } : {
    outDir?: string
  } = {}) : Promise<string> {
    return new Promise((resolve, reject) => {
      const tmpOutDir = outDir || tmp.dirSync({ unsafeCleanup: true }).name
      const outputFilePath = path.join(tmpOutDir, this.buildNativeBinaryFileName(descriptor))
      const outputFile = fs.createWriteStream(outputFilePath)
      const curl = spawn('curl', [ this.urlToBinary(descriptor) ])
      curl.stdout.pipe(outputFile)
      outputFile.on('error', err => reject(err))
      curl.on('close', err => err ? reject(err) : resolve(outputFilePath))
    })
  }

  async hasBinary (descriptor: NativeApplicationDescriptor) : Promise<boolean> {
    return new Promise((resolve, reject) => {
      exec(`curl -XOPTIONS -s -o /dev/null -w '%{http_code}' ${this.urlToBinary(descriptor)}`,
        (error, stdout, stderr) => {
          if (error) {
            reject(error)
          } else {
            stdout.startsWith('404') ? resolve(false) : resolve(true)
          }
        })
    })
  }

  urlToBinary (descriptor: NativeApplicationDescriptor) {
    return `${this._config.url}/${this.buildNativeBinaryFileName(descriptor)}`
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
