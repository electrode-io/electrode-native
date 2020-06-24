import { shell } from 'ern-core';
import File from './File';

export default {
  copy(src, out) {
    const fsrc = new File(src);
    const fout = new File(out);
    fout.getParentFile().mkdirs();
    shell.cp('-f', fsrc.getPath(), fout.getPath());
  },
};
