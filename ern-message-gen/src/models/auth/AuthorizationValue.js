/* Generated from Java with JSweet 1.2.0 - http://www.jsweet.org */

export default class AuthorizationValue {
    constructor(keyName, value, type) {
        this.keyName(keyName).value(value).type(type);
    }

    value(value) {
        this.setValue(value);
        return this;
    };

    type(type) {
        this.setType(type);
        return this;
    };

    keyName(keyName) {
        this.setKeyName(keyName);
        return this;
    };

    getValue() {
        return this.__value;
    };

    setValue(value) {
        this.__value = value;
    };

    getType() {
        return this.__type;
    };

    setType(type) {
        this.__type = type;
    };

    getKeyName() {
        return this.__keyName;
    };

    setKeyName(keyName) {
        this.__keyName = keyName;
    };

}
