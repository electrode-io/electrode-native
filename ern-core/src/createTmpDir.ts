import tmp from 'tmp'
import config from './config'

export default function(): string {
  const tmpDir = config.getValue('tmp-dir')
  const retainTmpDir = config.getValue('retain-tmp-dir', false)
  return tmp.dirSync({
    dir: tmpDir,
    unsafeCleanup: !retainTmpDir,
  }).name
}
