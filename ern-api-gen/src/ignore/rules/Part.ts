export default class Part {
  public token;
  public value;

  constructor(token, value?: any) {
    this.token = token;
    this.value = arguments.length < 2 ? token.getPattern() : value;
  }

  public getToken() {
    return this.token;
  }

  public getValue() {
    return this.value;
  }
}
