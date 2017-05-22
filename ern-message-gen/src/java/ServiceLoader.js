import fs from 'fs'
import path from 'path'
import LoggerFactory from './LoggerFactory'
import File from './File'
import {isEmpty} from './StringUtils'

const Log = LoggerFactory.getLogger('ServiceLoader')

const tryNewRequire = (mod) => {
  try {
    const Clz = require(mod).default
    return new Clz()
  } catch (e) {
    Log.warn(`could not require ${mod}`, e)
  }
}
export const SEARCH_PATH = [path.join(__dirname, '..', '..', 'resources')]

export default ({
  load (className) {
    const ret = []
    const lines = []
    for (const searchPath of SEARCH_PATH) {
      let meta = new File(searchPath, 'META-INF', 'services', className)
      if (!meta.exists()) {
        continue
      }

      try {
        lines.push(...fs.readFileSync(meta.getPath(), 'utf8').split('\n'))
      } catch (e) {
        Log.warn(`Error loading ${className}`, e)
        return ret
      }
    }
    for (const line of lines) {
      const [mod, comment] = line.split('#', 2)
      if (isEmpty(mod)) continue

      const conf = tryNewRequire(path.join(__dirname, '..', ...mod.split('.')))
      if (conf) {
        ret.push(conf)
      }
    }

    return ret
  }
})
