import AbstractSecuritySchemeDefinition from './AbstractSecuritySchemeDefinition';

export default class BasicAuthDefinition extends AbstractSecuritySchemeDefinition {
  public static TYPE = 'basic';
  public type = BasicAuthDefinition.TYPE;

  public toJSON() {
    return Object.assign(super.toJSON(), { type: this.type });
  }
}
