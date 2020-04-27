export function forValue(str) {
  str = str.toUpperCase();
  if (str in ALL) {
    return ALL[str];
  }
}

class RefType {
  public static forValue = forValue;

  public static values() {
    return ENUMS;
  }

  public internalPrefix;

  constructor(internalPrefix) {
    this.internalPrefix = internalPrefix;
  }

  public getInternalPrefix() {
    return this.internalPrefix;
  }

  public ordinal() {
    return ENUMS.indexOf(this);
  }
}

export const DEFINITION = new RefType('#/definitions/');
export const PARAMETER = new RefType('#/parameters/');
export const PATH = new RefType('#/paths/');
export const RESPONSE = new RefType('#/responses/');

const ALL = { DEFINITION, PARAMETER, PATH, RESPONSE };
const ENUMS = Object.freeze(Object.keys(ALL).map(v => ALL[v]));

export default { ...ALL, forValue };
