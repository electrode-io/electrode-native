import {HashMap, newHashMap} from "./java/javaUtil";
import {apply} from './java/beanUtils';
export default class CodegenParameter {
    vendorExtensions = newHashMap();
    isEnum = false;

    toString() {
        return `${this.baseName}(${this.dataType})`
    }
    copy(){
        return apply(new CodegenParameter(), this);
    }
}
