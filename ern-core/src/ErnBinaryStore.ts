import { BinaryStore } from './BinaryStore'
import { NativeApplicationDescriptor } from './NativeApplicationDescriptor'
import { execp } from './childProcess'
import createTmpDir from './createTmpDir'
import { spawn } from 'child_process'
import shell from './shell'
import fs from 'fs'
import path from 'path'
import archiver from 'archiver'
import DecompressZip = require('decompress-zip')

export class ErnBinaryStore implements BinaryStore {
  private readonly config: any

  constructor(config: any) {
    this.config = config
  }

  public async addBinary(
    descriptor: NativeApplicationDescriptor,
    binaryPath: fs.PathLike
  ): Promise<string | Buffer> {
    const pathToBinary = await this.zipBinary(descriptor, binaryPath)
    return execp(`curl -XPOST ${this.config.url} -F file=@"${pathToBinary}"`)
  }

  public async removeBinary(
    descriptor: NativeApplicationDescriptor
  ): Promise<string | Buffer> {
    await this.throwIfNoBinaryExistForDescriptor(descriptor)
    return execp(`curl -XDELETE ${this.urlToBinary(descriptor)}`)
  }

  public async getBinary(
    descriptor: NativeApplicationDescriptor,
    {
      outDir,
    }: {
      outDir?: string
    } = {}
  ): Promise<string> {
    await this.throwIfNoBinaryExistForDescriptor(descriptor)
    const pathToZippedBinary = await this.getZippedBinary(descriptor)
    if (outDir && !fs.existsSync(outDir)) {
      shell.mkdir('-p', outDir)
    }
    return this.unzipBinary(descriptor, pathToZippedBinary, { outDir })
  }

  public async hasBinary(
    descriptor: NativeApplicationDescriptor
  ): Promise<string | Buffer> {
    return execp(
      `curl -XOPTIONS -s -o /dev/null -w '%{http_code}' ${this.urlToBinary(
        descriptor
      )}`
    )
  }

  public async getZippedBinary(
    descriptor: NativeApplicationDescriptor
  ): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const tmpOutDir = createTmpDir()
      const outputFilePath = path.join(
        tmpOutDir,
        this.buildZipBinaryFileName(descriptor)
      )
      const outputFile = fs.createWriteStream(outputFilePath)
      const curl = spawn('curl', [this.urlToBinary(descriptor)])
      curl.stdout.pipe(outputFile)
      outputFile.on('error', err => reject(err))
      curl.on('close', err => (err ? reject(err) : resolve(outputFilePath)))
    })
  }

  public urlToBinary(descriptor: NativeApplicationDescriptor) {
    return `${this.config.url}/${this.buildZipBinaryFileName(descriptor)}`
  }

  public async zipBinary(
    descriptor: NativeApplicationDescriptor,
    binaryPath: fs.PathLike
  ): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const tmpOutDir = createTmpDir()
      const pathToZipFile = path.join(
        tmpOutDir,
        this.buildZipBinaryFileName(descriptor)
      )
      const outputZipStream = fs.createWriteStream(pathToZipFile)
      const archive = archiver('zip', { zlib: { level: 9 } })
      outputZipStream.on('close', () => resolve(pathToZipFile))
      archive.on('error', err => reject(err))
      archive.pipe(outputZipStream)
      if (descriptor.platform === 'android') {
        archive.file(binaryPath.toString(), {
          name: path.basename(binaryPath.toString()),
        })
      } else {
        archive.glob('**/*', { cwd: binaryPath.toString() })
      }
      archive.finalize()
    })
  }

  public async unzipBinary(
    descriptor: NativeApplicationDescriptor,
    zippedBinaryPath: string,
    {
      outDir,
    }: {
      outDir?: string
    } = {}
  ): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const outputDirectory = outDir || createTmpDir()
      const pathToOutputBinary = path.join(
        outputDirectory,
        this.buildNativeBinaryFileName(descriptor)
      )
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

  public buildZipBinaryFileName(descriptor: NativeApplicationDescriptor) {
    if (!descriptor.version || !descriptor.platform) {
      throw new Error(
        '[buildZipBinaryFileName] Require a complete native application descriptor'
      )
    }
    return `${descriptor.name}-${descriptor.platform}-${descriptor.version}.zip`
  }

  public buildNativeBinaryFileName(descriptor: NativeApplicationDescriptor) {
    if (!descriptor.version || !descriptor.platform) {
      throw new Error(
        '[buildNativeBinaryFileName] Require a complete native application descriptor'
      )
    }
    return `${descriptor.name}-${descriptor.platform}-${
      descriptor.version
    }.${this.getNativeBinaryFileExt(descriptor.platform)}`
  }

  public getNativeBinaryFileExt(platformName: string) {
    return platformName === 'android' ? 'apk' : 'app'
  }

  public async throwIfNoBinaryExistForDescriptor(
    descriptor: NativeApplicationDescriptor
  ) {
    if (!(await this.hasBinary(descriptor))) {
      throw new Error(
        `No binary associated to ${descriptor} was found in the store`
      )
    }
  }
}
