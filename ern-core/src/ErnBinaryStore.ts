import { BinaryStore } from './BinaryStore';
import { AppVersionDescriptor } from './descriptors';
import createTmpDir from './createTmpDir';
import shell from './shell';
import fs from 'fs-extra';
import path from 'path';
import archiver from 'archiver';
import got from 'got';
import FormData from 'form-data';
import { createProxyAgentFromErnConfig } from './createProxyAgent';
import DecompressZip = require('decompress-zip');

export class ErnBinaryStore implements BinaryStore {
  public readonly gotCommonOpts = {
    agent: createProxyAgentFromErnConfig('binaryStoreProxy'),
  };

  private readonly config: any;

  constructor(config: any) {
    this.config = config;
  }

  public async addBinary(
    descriptor: AppVersionDescriptor,
    binaryPath: fs.PathLike,
    {
      flavor,
    }: {
      flavor?: string;
    } = {},
  ): Promise<void> {
    const pathToBinary = await this.zipBinary(descriptor, binaryPath, {
      flavor,
    });
    try {
      const binaryRs = fs.createReadStream(pathToBinary);
      const form = new FormData();
      form.append('file', binaryRs);
      await got.post(this.config.url, { ...this.gotCommonOpts, body: form });
    } catch (err) {
      throw new Error(err.response?.text ?? err.message);
    }
  }

  public async removeBinary(
    descriptor: AppVersionDescriptor,
    {
      flavor,
    }: {
      flavor?: string;
    } = {},
  ): Promise<void> {
    await this.throwIfNoBinaryExistForDescriptor(descriptor, { flavor });
    try {
      await got.delete(this.urlToBinary(descriptor, { flavor }), {
        ...this.gotCommonOpts,
      });
    } catch (err) {
      throw new Error(err.response?.text ?? err.message);
    }
  }

  public async getBinary(
    descriptor: AppVersionDescriptor,
    {
      flavor,
      outDir,
    }: {
      flavor?: string;
      outDir?: string;
    } = {},
  ): Promise<string> {
    await this.throwIfNoBinaryExistForDescriptor(descriptor, { flavor });
    const pathToZippedBinary = await this.getZippedBinary(descriptor, {
      flavor,
    });
    if (outDir) {
      await fs.ensureDir(outDir);
    }
    return this.unzipBinary(descriptor, pathToZippedBinary, { flavor, outDir });
  }

  public async hasBinary(
    descriptor: AppVersionDescriptor,
    {
      flavor,
    }: {
      flavor?: string;
    } = {},
  ): Promise<boolean> {
    try {
      const res = await got.head(this.urlToBinary(descriptor, { flavor }), {
        ...this.gotCommonOpts,
      });
      return res.statusCode === 200;
    } catch (err) {
      if (err.response && err.response.statusCode === 404) {
        return false;
      }
      throw new Error(err.response?.text ?? err.message);
    }
  }

  public async getZippedBinary(
    descriptor: AppVersionDescriptor,
    {
      flavor,
    }: {
      flavor?: string;
    } = {},
  ): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const tmpOutDir = createTmpDir();
      const outputFilePath = path.join(
        tmpOutDir,
        this.buildZipBinaryFileName(descriptor, { flavor }),
      );
      const outputFile = fs.createWriteStream(outputFilePath);
      const gotStream = got
        .stream(this.urlToBinary(descriptor, { flavor }))
        .pipe(outputFile);
      gotStream.on('close', () => resolve(outputFilePath));
      gotStream.on('error', err => reject(err));
    });
  }

  public urlToBinary(
    descriptor: AppVersionDescriptor,
    {
      flavor,
    }: {
      flavor?: string;
    } = {},
  ) {
    return `${this.config.url}/${this.buildZipBinaryFileName(descriptor, {
      flavor,
    })}`;
  }

  public async zipBinary(
    descriptor: AppVersionDescriptor,
    binaryPath: fs.PathLike,
    {
      flavor,
    }: {
      flavor?: string;
    } = {},
  ): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const tmpOutDir = createTmpDir();
      const pathToZipFile = path.join(
        tmpOutDir,
        this.buildZipBinaryFileName(descriptor, { flavor }),
      );
      const outputZipStream = fs.createWriteStream(pathToZipFile);
      const archive = archiver('zip', { zlib: { level: 9 } });
      outputZipStream.on('close', () => resolve(pathToZipFile));
      archive.on('error', err => reject(err));
      archive.pipe(outputZipStream);
      if (descriptor.platform === 'android') {
        archive.file(binaryPath.toString(), {
          name: path.basename(binaryPath.toString()),
        });
      } else {
        archive.glob('**/*', { cwd: binaryPath.toString() });
      }
      archive.finalize();
    });
  }

  public async unzipBinary(
    descriptor: AppVersionDescriptor,
    zippedBinaryPath: string,
    {
      flavor,
      outDir,
    }: {
      flavor?: string;
      outDir?: string;
    } = {},
  ): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const outputDirectory = outDir || createTmpDir();
      const pathToOutputBinary = path.join(
        outputDirectory,
        this.buildNativeBinaryFileName(descriptor, { flavor }),
      );
      const unzipper = new DecompressZip(zippedBinaryPath);
      unzipper.on('error', (err: any) => reject(err));
      unzipper.on('extract', () => {
        if (descriptor.platform === 'android') {
          shell.mv(path.join(outputDirectory, '*.apk'), pathToOutputBinary);
        }
        resolve(pathToOutputBinary);
      });
      if (descriptor.platform === 'android') {
        unzipper.extract({ path: outputDirectory });
      } else {
        unzipper.extract({ path: pathToOutputBinary });
      }
    });
  }

  public buildZipBinaryFileName(
    descriptor: AppVersionDescriptor,
    {
      flavor,
    }: {
      flavor?: string;
    } = {},
  ) {
    return `${descriptor.name}-${descriptor.platform}-${descriptor.version}${
      flavor ? `-${flavor}` : ''
    }.zip`;
  }

  public buildNativeBinaryFileName(
    descriptor: AppVersionDescriptor,
    {
      flavor,
    }: {
      flavor?: string;
    } = {},
  ) {
    return `${descriptor.name}-${descriptor.platform}-${descriptor.version}${
      flavor ? `-${flavor}` : ''
    }.${this.getNativeBinaryFileExt(descriptor.platform)}`;
  }

  public getNativeBinaryFileExt(platformName: string) {
    return platformName === 'android' ? 'apk' : 'app';
  }

  public async throwIfNoBinaryExistForDescriptor(
    descriptor: AppVersionDescriptor,
    {
      flavor,
    }: {
      flavor?: string;
    } = {},
  ) {
    if (!(await this.hasBinary(descriptor, { flavor }))) {
      throw new Error(
        `No binary associated to ${descriptor} ${
          flavor ? `[flavor: ${flavor}]` : ''
        } was found in the store`,
      );
    }
  }
}
