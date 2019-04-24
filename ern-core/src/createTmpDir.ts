import tmp from 'tmp'
import config from './config'
import shell from './shell'
import fs from 'fs'

export default function(): string {
  const tmpDir = config.getValue('tmp-dir')
  if (!fs.existsSync(tmpDir)) {
    shell.mkdir('-p', tmpDir)
  }
  const retainTmpDir = config.getValue('retain-tmp-dir', false)
  return tmp.dirSync({
    dir: tmpDir,
    unsafeCleanup: !retainTmpDir,
  }).name
}
