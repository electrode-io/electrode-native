import fs from 'fs'
import path from 'path'
import { log } from 'ern-core'
import File from './File'
import { isEmpty } from './StringUtils'

const tryNewRequire = mod => {
  try {
    const Clz = require(mod).default
    return new Clz()
  } catch (e) {
    log.warn(`could not require ${mod}. error: ${e}`)
  }
}
export const SEARCH_PATH = [path.join(__dirname, '..', '..', 'resources')]

export default {
  load(className) {
    const ret: any[] = []
    const lines: string[] = []
    for (const searchPath of SEARCH_PATH) {
      const meta = new File(searchPath, 'META-INF', 'services', className)
      if (!meta.exists()) {
        continue
      }

      try {
        lines.push(...fs.readFileSync(meta.getPath(), 'utf8').split(/\r?\n/))
      } catch (e) {
        log.warn(`Error loading ${className}. error: ${e}`)
        return ret
      }
    }
    for (const line of lines) {
      const [mod, comment] = line.split('#', 2)
      if (isEmpty(mod)) {
        continue
      }

      const conf = tryNewRequire(path.join(__dirname, '..', ...mod.split('.')))
      if (conf) {
        ret.push(conf)
      }
    }

    return ret
  },
}
