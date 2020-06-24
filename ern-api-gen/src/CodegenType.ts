export class CodegenType {
  public static ordinal = () => ALL;
  public type;

  constructor(type) {
    this.type = type;
  }

  public toString() {
    return this.type;
  }
}

function makeType(type) {
  return new CodegenType(type);
}

export const CLIENT = makeType('client');
export const SERVER = makeType('server');
export const DOCUMENTATION = makeType('documentation');
export const OTHER = makeType('other');

const ALL = [CLIENT, SERVER, DOCUMENTATION, OTHER];

export function forValue(value) {
  for (const type in ALL) {
    if ((type as any).type === value.toLowerCase()) {
      return type;
    }
  }
}
export default {
  CLIENT,
  DOCUMENTATION,
  OTHER,
  SERVER,
};
