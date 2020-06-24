import fs from 'fs-extra';
import path from 'path';

export function resolveLocalErnRc(dir?: string) {
  let directory = dir || process.cwd();
  let prevDirectory;
  while (directory !== prevDirectory) {
    prevDirectory = directory;
    const pathToErnRc = path.join(directory, '.ernrc');
    if (fs.existsSync(pathToErnRc)) {
      return pathToErnRc;
    }
    directory = path.dirname(directory);
  }
}
