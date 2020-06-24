import glob from 'glob';
import path from 'path';

export async function findDirectoriesHavingRnConfig(
  rootDir: string,
): Promise<string[]> {
  return new Promise((resolve, reject) => {
    glob(path.join(rootDir, '**/react-native.config.js'), (err, files) => {
      if (err) {
        reject(err);
      } else {
        resolve(files.map(path.normalize).map(path.dirname));
      }
    });
  });
}
