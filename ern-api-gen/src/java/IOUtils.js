import {
  shell
} from 'ern-util'
import File from './File'

export default ({

  copy (src, out) {
    const fsrc = new File(src), fout = new File(out)
    fout.getParentFile().mkdirs()
    shell.cp('-f', fsrc.getPath(), fout.getPath())
  }
})
