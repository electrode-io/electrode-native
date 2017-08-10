import CodegenModel from './CodegenModel';
import CodegenOperation from './CodegenOperation';
import CodegenParameter from './CodegenParameter';
import CodegenProperty from './CodegenProperty';
import CodegenResponse from './CodegenResponse';
import CodegenSecurity from './CodegenSecurity';

class CodegenModelType {
    constructor(defaultImplementation) {
        this._defaultImplementation = defaultImplementation;
    }

    getDefaultImplementation() {
        return this._defaultImplementation;
    }

    static values = () => ALL;
    ordinal = () => ALL.indexOf(this);
}


const forType = (type) => new CodegenModelType(type);


export const MODEL = forType(CodegenModel),
    OPERATION = forType(CodegenOperation),
    PARAMETER = forType(CodegenParameter),
    PROPERTY = forType(CodegenProperty),
    RESPONSE = forType(CodegenResponse),
    SECURITY = forType(CodegenSecurity);

const ALL = [MODEL, OPERATION, PARAMETER, PROPERTY, RESPONSE, SECURITY];

export default ({
    MODEL, OPERATION, PARAMETER, PROPERTY, RESPONSE, SECURITY
})
