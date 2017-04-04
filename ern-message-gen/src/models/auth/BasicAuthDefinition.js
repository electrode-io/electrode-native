import AbstractSecuritySchemeDefinition from "./AbstractSecuritySchemeDefinition";
export default class BasicAuthDefinition extends AbstractSecuritySchemeDefinition {
    static TYPE = "basic";
    type = BasicAuthDefinition.TYPE;

    toJSON() {
        return Object.assign(super.toJSON(), {type: this.type});
    }
}
