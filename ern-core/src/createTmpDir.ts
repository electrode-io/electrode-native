import tmp from 'tmp';
import config from './config';
import fs from 'fs-extra';

export default function (): string {
  const tmpdir = config.get('tmp-dir');
  if (tmpdir) {
    fs.ensureDirSync(tmpdir);
  }
  const retainTmpDir = config.get('retain-tmp-dir', false);
  return fs.realpathSync(
    tmp.dirSync({
      tmpdir,
      unsafeCleanup: !retainTmpDir,
    }).name,
  );
}
