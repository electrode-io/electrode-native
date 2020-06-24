export default class CodegenProperty {
  public isReadOnly = false;
  public isEnum = false;
  // [TSCONV not set]
  public baseName;
  public datatype;

  public toString() {
    return `${this.baseName}(${this.datatype}})`;
  }
}
