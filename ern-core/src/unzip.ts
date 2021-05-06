import fs from 'fs-extra';
import path from 'path';
import shell from 'shelljs';
import yauzl from 'yauzl';

export async function unzip(zippedData: Buffer, destPath: string) {
  await fs.ensureDir(destPath);
  return new Promise<void>((resolve, reject) => {
    yauzl.fromBuffer(zippedData, { lazyEntries: true }, (err, zipfile) => {
      if (err) {
        reject(err);
      } else if (zipfile == null) {
        reject(new Error('zipFile is null or undefined'));
      } else {
        zipfile.readEntry();
        zipfile.on('end', () => resolve());
        zipfile.on('entry', (entry) => {
          if (/\$/.test(entry.fileName)) {
            // Current entry is an empty directory
            shell.mkdir('-p', path.join(destPath, entry.fileName));
            zipfile.readEntry();
          } else {
            // Current entry is a file
            shell.mkdir(
              '-p',
              path.join(destPath, path.dirname(entry.fileName)),
            );
            const ws = fs.createWriteStream(
              path.join(destPath, entry.fileName),
            );
            zipfile.openReadStream(entry, (error, rs) => {
              if (error) {
                reject(error);
              } else if (rs == null) {
                reject(new Error('rs is null or undefined'));
              } else {
                rs.pipe(ws);
                rs.on('end', () => zipfile.readEntry());
              }
            });
          }
        });
      }
    });
  });
}
