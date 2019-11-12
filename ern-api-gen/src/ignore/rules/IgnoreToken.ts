export class IgnoreToken {
  public name
  public pattern

  constructor(name, pattern) {
    this.name = name
    this.pattern = pattern
    IgnoreToken[name] = this
  }

  public getPattern() {
    return this.pattern
  }

  public ordinal() {
    return ENUMS.indexOf(this)
  }

  public toString() {
    return this.name
  }

  public equals(that) {
    if (that == null) {
      return false
    }
    if (this === that) {
      return true
    }
    if (typeof that === 'string') {
      return this.name === that
    }
    return this.name === that.name
  }
}

const ENUMS = [
  new IgnoreToken('COMMENT', null),
  new IgnoreToken('DIRECTORY_MARKER', '/'),
  new IgnoreToken('ESCAPED_EXCLAMATION', '\\!'),
  new IgnoreToken('ESCAPED_SPACE', '\\ '),
  new IgnoreToken('MATCH_ALL', '**'),
  new IgnoreToken('MATCH_ANY', '*'),
  new IgnoreToken('NEGATE', '!'),
  new IgnoreToken('PATH_DELIM', '/'),
  new IgnoreToken('ROOTED_MARKER', '/'),
  new IgnoreToken('TEXT', null),
]

export default {
  COMMENT: ENUMS[0],
  DIRECTORY_MARKER: ENUMS[1],
  ESCAPED_EXCLAMATION: ENUMS[2],
  ESCAPED_SPACE: ENUMS[3],
  MATCH_ALL: ENUMS[4],
  MATCH_ANY: ENUMS[5],
  NEGATE: ENUMS[6],
  PATH_DELIM: ENUMS[7],
  ROOTED_MARKER: ENUMS[8],
  TEXT: ENUMS[9],
}
