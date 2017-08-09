import AbstractSecuritySchemeDefinition from "./AbstractSecuritySchemeDefinition";
import In from './In';

export default class ApiKeyAuthDefinition extends AbstractSecuritySchemeDefinition {

    static TYPE = "apiKey";
    type = ApiKeyAuthDefinition.TYPE;


    name(name) {
        this.setName(name);
        return this;
    };

    in(__in) {
        this.setIn(__in);
        return this;
    };

    getName() {
        return this.__name;
    };

    setName(name) {
        this.__name = name;
    };

    getIn() {
        return this.__in;
    };

    setIn(__in) {
        this.__in = In(__in);
    };

    toJSON() {
        return {
            type: this.type,
            name: this.__name,
            in: this.__in + ''
        }
    }
}
