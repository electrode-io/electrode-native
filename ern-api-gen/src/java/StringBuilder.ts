export default function StringBuilder(...strs) {
  let tmpStr = '';
  const ret = {
    append(...strsa) {
      for (const str of strsa) {
        tmpStr += str;
      }
      return ret;
    },
    toString() {
      return tmpStr;
    },
    length() {
      return tmpStr.length;
    },
    charAt(idx) {
      return tmpStr[idx];
    },
    setCharAt(idx, ch) {
      (tmpStr as any)[idx] = ch;
      return ret;
    },
    replace(start, end, str) {
      const before = str.substring(0, start);
      const after = str.substring(end);
      tmpStr = before + str + after;
      return ret;
    },
    codePointAt(at) {
      return tmpStr.codePointAt(at);
    },
    delete(from, to) {
      const left = tmpStr.substring(0, from);
      const right = tmpStr.substring(to);
      tmpStr = left + right;
      return this;
    },
  };

  ret.append(...strs);

  return ret;
}
