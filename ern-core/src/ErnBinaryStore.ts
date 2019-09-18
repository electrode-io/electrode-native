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
    binaryPath: fs.PathLike,
    {
      flavor,
    }: {
      flavor?: string
    } = {}
  ): Promise<string | Buffer> {
    const pathToBinary = await this.zipBinary(descriptor, binaryPath, {
      flavor,
    })
    return execp(`curl -XPOST ${this.config.url} -F file=@"${pathToBinary}"`)
  }

  public async removeBinary(
    descriptor: NativeApplicationDescriptor,
    {
      flavor,
    }: {
      flavor?: string
    } = {}
  ): Promise<string | Buffer> {
    await this.throwIfNoBinaryExistForDescriptor(descriptor, { flavor })
    return execp(`curl -XDELETE ${this.urlToBinary(descriptor, { flavor })}`)
  }

  public async getBinary(
    descriptor: NativeApplicationDescriptor,
    {
      flavor,
      outDir,
    }: {
      flavor?: string
      outDir?: string
    } = {}
  ): Promise<string> {
    await this.throwIfNoBinaryExistForDescriptor(descriptor, { flavor })
    const pathToZippedBinary = await this.getZippedBinary(descriptor, {
      flavor,
    })
    if (outDir && !fs.existsSync(outDir)) {
      shell.mkdir('-p', outDir)
    }
    return this.unzipBinary(descriptor, pathToZippedBinary, { flavor, outDir })
  }

  public async hasBinary(
    descriptor: NativeApplicationDescriptor,
    {
      flavor,
    }: {
      flavor?: string
    } = {}
  ): Promise<string | Buffer> {
    return execp(
      `curl -XOPTIONS -s -o /dev/null -w '%{http_code}' ${this.urlToBinary(
        descriptor,
        { flavor }
      )}`
    )
  }

  public async getZippedBinary(
    descriptor: NativeApplicationDescriptor,
    {
      flavor,
    }: {
      flavor?: string
    } = {}
  ): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const tmpOutDir = createTmpDir()
      const outputFilePath = path.join(
        tmpOutDir,
        this.buildZipBinaryFileName(descriptor, { flavor })
      )
      const outputFile = fs.createWriteStream(outputFilePath)
      const curl = spawn('curl', [this.urlToBinary(descriptor, { flavor })])
      curl.stdout.pipe(outputFile)
      outputFile.on('error', err => reject(err))
      curl.on('close', err => (err ? reject(err) : resolve(outputFilePath)))
    })
  }
  public urlToBinary(
    descriptor: NativeApplicationDescriptor,
    {
      flavor,
    }: {
      flavor?: string
    } = {}
  ) {
    return `${this.config.url}/${this.buildZipBinaryFileName(descriptor, {
      flavor,
    })}`
  }

  public async zipBinary(
    descriptor: NativeApplicationDescriptor,
    binaryPath: fs.PathLike,
    {
      flavor,
    }: {
      flavor?: string
    } = {}
  ): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const tmpOutDir = createTmpDir()
      const pathToZipFile = path.join(
        tmpOutDir,
        this.buildZipBinaryFileName(descriptor, { flavor })
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
      flavor,
      outDir,
    }: {
      flavor?: string
      outDir?: string
    } = {}
  ): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const outputDirectory = outDir || createTmpDir()
      const pathToOutputBinary = path.join(
        outputDirectory,
        this.buildNativeBinaryFileName(descriptor, { flavor })
      )
      const unzipper = new DecompressZip(zippedBinaryPath)
      unzipper.on('error', err => reject(err))
      unzipper.on('extract', () => {
        if (descriptor.platform === 'android') {
          shell.mv(path.join(outputDirectory, '*.apk'), pathToOutputBinary)
        }
        resolve(pathToOutputBinary)
      })
      if (descriptor.platform === 'android') {
        unzipper.extract({ path: outputDirectory })
      } else {
        unzipper.extract({ path: pathToOutputBinary })
      }
    })
  }

  public buildZipBinaryFileName(
    descriptor: NativeApplicationDescriptor,
    {
      flavor,
    }: {
      flavor?: string
    } = {}
  ) {
    if (!descriptor.version || !descriptor.platform) {
      throw new Error(
        '[buildZipBinaryFileName] Require a complete native application descriptor'
      )
    }
    return `${descriptor.name}-${descriptor.platform}-${descriptor.version}${
      flavor ? `-${flavor}` : ''
    }.zip`
  }

  public buildNativeBinaryFileName(
    descriptor: NativeApplicationDescriptor,
    {
      flavor,
    }: {
      flavor?: string
    } = {}
  ) {
    if (!descriptor.version || !descriptor.platform) {
      throw new Error(
        '[buildNativeBinaryFileName] Require a complete native application descriptor'
      )
    }
    return `${descriptor.name}-${descriptor.platform}-${descriptor.version}${
      flavor ? `-${flavor}` : ''
    }.${this.getNativeBinaryFileExt(descriptor.platform)}`
  }

  public getNativeBinaryFileExt(platformName: string) {
    return platformName === 'android' ? 'apk' : 'app'
  }

  public async throwIfNoBinaryExistForDescriptor(
    descriptor: NativeApplicationDescriptor,
    {
      flavor,
    }: {
      flavor?: string
    } = {}
  ) {
    if ((await this.hasBinary(descriptor, { flavor })) === '404') {
      throw new Error(
        `No binary associated to ${descriptor} ${
          flavor ? `[flavor: ${flavor}]` : ''
        } was found in the store`
      )
    }
  }
}
