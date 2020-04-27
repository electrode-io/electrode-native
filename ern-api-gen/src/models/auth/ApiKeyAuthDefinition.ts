/* tslint:disable:variable-name */
import AbstractSecuritySchemeDefinition from './AbstractSecuritySchemeDefinition';
import In from './In';

export default class ApiKeyAuthDefinition extends AbstractSecuritySchemeDefinition {
  public static TYPE = 'apiKey';
  public type = ApiKeyAuthDefinition.TYPE;
  public __in;
  public __name;

  public name(name) {
    this.setName(name);
    return this;
  }

  public in(__in) {
    this.setIn(__in);
    return this;
  }

  public getName() {
    return this.__name;
  }

  public setName(name) {
    this.__name = name;
  }

  public getIn() {
    return this.__in;
  }

  public setIn(__in) {
    this.__in = In(__in);
  }

  public toJSON(): any {
    return {
      in: this.__in + '',
      name: this.__name,
      type: this.type,
    };
  }
}
