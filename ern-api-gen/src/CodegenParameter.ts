import { newHashMap } from './java/javaUtil';
import { apply } from './java/beanUtils';

export default class CodegenParameter {
  public vendorExtensions = newHashMap();
  public isEnum = false;
  // [TSCONV not set]
  public baseName;
  public dataType;

  public toString() {
    return `${this.baseName}(${this.dataType})`;
  }

  public copy() {
    return apply(new CodegenParameter(), this);
  }
}
