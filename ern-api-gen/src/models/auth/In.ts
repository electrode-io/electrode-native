export class In {
  public static readonly HEADER = new In('header');
  public static readonly QUERY = new In('query');

  public key;

  constructor(key) {
    this.key = key;
  }

  public toValue() {
    return this.key;
  }

  public toJSON() {
    return this.key;
  }
  public toString() {
    return this.key;
  }
}

export default function forValue(value) {
  if (value == null || value instanceof In) {
    return value;
  }
  value = value.toLowerCase();
  if (value === In.HEADER.key) {
    return In.HEADER;
  }
  if (value === In.QUERY.key) {
    return In.QUERY;
  }
}
