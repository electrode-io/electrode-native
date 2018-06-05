import { shell } from 'ern-core'
import path from 'path'

// TODO : [WINDOWS SUPPORT]
export function clearReactPackagerCache() {
  const TMPDIR = process.env.TMPDIR
  if (TMPDIR) {
    shell.rm('-rf', path.join(TMPDIR, 'react-*'))
  }
}
