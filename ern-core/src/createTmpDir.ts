import tmp from 'tmp'
import config from './config'
import shell from './shell'
import fs from 'fs'

export default function(): string {
  const tmpDir = config.get('tmp-dir')
  if (tmpDir && !fs.existsSync(tmpDir)) {
    shell.mkdir('-p', tmpDir)
  }
  const retainTmpDir = config.get('retain-tmp-dir', false)
  return tmp.dirSync({
    dir: tmpDir,
    unsafeCleanup: !retainTmpDir,
  }).name
}
