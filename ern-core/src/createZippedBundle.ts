import yazl from 'yazl';
import path from 'path';
import readDir from 'fs-readdir-recursive';
import log from './log';

export async function createZippedBundle({
  bundlePath,
  assetsPath,
}: {
  bundlePath: string;
  assetsPath: string;
}): Promise<Buffer> {
  log.debug('Creating zipped bundle');
  const zippedbundle = new yazl.ZipFile();
  log.trace(`Adding ${bundlePath} to zipped bundle`);
  zippedbundle.addFile(bundlePath, path.basename(bundlePath));
  const assetsFiles = readDir(assetsPath);
  for (const assetFile of assetsFiles) {
    const pathToAssetFile = path.join(assetsPath, assetFile);
    log.trace(`Adding ${pathToAssetFile} to zipped bundle`);
    zippedbundle.addFile(pathToAssetFile, assetFile);
  }
  zippedbundle.end();

  const chunks: any = [];
  zippedbundle.outputStream.on('data', (chunk) => {
    chunks.push(chunk);
  });

  return new Promise<Buffer>((resolve, reject) => {
    zippedbundle.outputStream.on('error', (err) => {
      reject(err);
    });
    zippedbundle.outputStream.on('end', () => {
      log.debug('Bundle was successfully zipped');
      resolve(Buffer.concat(chunks));
    });
  });
}
