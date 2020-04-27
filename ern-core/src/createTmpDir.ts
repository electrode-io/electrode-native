import tmp from 'tmp';
import config from './config';
import fs from 'fs-extra';

export default function(): string {
  const tmpDir = config.get('tmp-dir');
  if (tmpDir) {
    fs.ensureDirSync(tmpDir);
  }
  const retainTmpDir = config.get('retain-tmp-dir', false);
  return fs.realpathSync(
    tmp.dirSync({
      dir: tmpDir,
      unsafeCleanup: !retainTmpDir,
    }).name,
  );
}
