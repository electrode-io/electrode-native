export default class CodegenResponse {
  headers = []
  isBinary = false

  isWildcard() {
    return '0' === this.code || 'default' === this.code
  }

  toString() {
    return `${this.code}(${this.containerType})`
  }
}
