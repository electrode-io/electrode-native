import File from './File'
import {Minimatch} from 'minimatch'

const GLOB = 'glob:'
const glob = (str) => {
  str = str || '**'
  const mm = new Minimatch(str, {empty: false})
  return (to) => {
    const ret = mm.match(to)
    return ret
  }
}
const match = (str) => {
  const f = new File(str).getAbsolutePath()
  return (to) => {
    return new File(to).getAbsolutePath() === f
  }
}

const EmptyMatcher = {
  matches () {
    return false
  }
}

const FileSystems = {
  getDefault () {
    return {
      getPathMatcher (str) {
        if (str == GLOB) {
          return EmptyMatcher
        }
        const matches = str.startsWith(GLOB) ? glob(str.substring(GLOB.length)) : match(str)
        return {
          matches
        }
      },
      getPath (file) {
        return new File(file).getAbsolutePath()
      }
    }
  }
}

export default FileSystems
