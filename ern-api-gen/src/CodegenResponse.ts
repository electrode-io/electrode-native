export default class CodegenResponse {
  public headers = [];
  public isBinary = false;
  // [TSCONV not set]
  public code;
  public containerType;

  public isWildcard() {
    return '0' === this.code || 'default' === this.code;
  }

  public toString() {
    return `${this.code}(${this.containerType})`;
  }
}
