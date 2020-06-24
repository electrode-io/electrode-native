import fs from 'fs-extra';
import path from 'path';

export async function createWatchmanConfig({ cwd }: { cwd: string }) {
  return fs.writeFile(path.join(cwd, '.watchmanconfig'), '{}');
}
