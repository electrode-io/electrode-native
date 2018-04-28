export default class CodegenProperty {
  isReadOnly = false
  isEnum = false

  toString() {
    return `${this.baseName}(${this.datatype}})`
  }
}
