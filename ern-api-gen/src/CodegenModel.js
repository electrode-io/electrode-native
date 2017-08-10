import {newHashSet} from "./java/javaUtil";

export default class CodegenModel {
    vars = [];
    requiredVars = [];
    optionalVars = [];
    readOnlyVars = [];
    readWriteVars = [];
    parentVars = [];
    mandatory = newHashSet();
    imports = newHashSet();
    hasOnlyReadOnly = true;
    allVars = this.vars;
    allMandatory = this.mandatory;

    toString() {
        return `${this.name}(${this.classname})`;
    }

}
