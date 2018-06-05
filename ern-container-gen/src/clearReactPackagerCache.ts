import { shell } from 'ern-core'

// TODO : [WINDOWS SUPPORT]
export function clearReactPackagerCache() {
  const TMPDIR = process.env.TMPDIR
  if (TMPDIR) {
    shell.rm('-rf', `${TMPDIR}/react-*`)
  }
}
