/* tslint:disable:variable-name */
import CodegenModel from './CodegenModel';
import CodegenOperation from './CodegenOperation';
import CodegenParameter from './CodegenParameter';
import CodegenProperty from './CodegenProperty';
import CodegenResponse from './CodegenResponse';
import CodegenSecurity from './CodegenSecurity';

class CodegenModelType {
  public static values = () => ALL;

  private _defaultImplementation;

  constructor(defaultImplementation) {
    this._defaultImplementation = defaultImplementation;
  }

  public getDefaultImplementation() {
    return this._defaultImplementation;
  }

  public ordinal = () => ALL.indexOf(this);
}

const forType = (type) => new CodegenModelType(type);

export const MODEL = forType(CodegenModel);
export const OPERATION = forType(CodegenOperation);
export const PARAMETER = forType(CodegenParameter);
export const PROPERTY = forType(CodegenProperty);
export const RESPONSE = forType(CodegenResponse);
export const SECURITY = forType(CodegenSecurity);

const ALL = [MODEL, OPERATION, PARAMETER, PROPERTY, RESPONSE, SECURITY];

export default {
  MODEL,
  OPERATION,
  PARAMETER,
  PROPERTY,
  RESPONSE,
  SECURITY,
};
