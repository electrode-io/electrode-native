// @flow

import tmp from 'tmp'
import config from './config.js'

export default function () : string {
  const tmpDir = config.getValue('tmp-dir')
  const retainTmpDir = config.getValue('retain-tmp-dir', false)
  return tmp.dirSync({
    unsafeCleanup: !retainTmpDir,
    dir: tmpDir
  }).name
}
