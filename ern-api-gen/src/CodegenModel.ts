import { newHashSet } from './java/javaUtil';

export default class CodegenModel {
  public vars = [];
  public requiredVars = [];
  public optionalVars = [];
  public readOnlyVars = [];
  public readWriteVars = [];
  public parentVars = [];
  public mandatory = newHashSet();
  public imports = newHashSet();
  public hasOnlyReadOnly = true;
  public allVars = this.vars;
  public allMandatory = this.mandatory;
  // [TSCONV] Not set
  public name;
  public classname;

  public toString() {
    return `${this.name}(${this.classname})`;
  }
}
