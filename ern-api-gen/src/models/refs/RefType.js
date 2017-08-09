export function forValue(str) {
    str = str.toUpperCase();
    if (str in ALL)
        return ALL[str];
}


class RefType {
    constructor(internalPrefix) {
        this.internalPrefix = internalPrefix;
    }

    getInternalPrefix() {
        return this.internalPrefix;
    }

    ordinal() {
        return ENUMS.indexOf(this);
    }

    static values() {
        return ENUMS;
    }

    static forValue = forValue;
}


export const DEFINITION = new RefType("#/definitions/");
export const PARAMETER = new RefType("#/parameters/");
export const PATH = new RefType("#/paths/");
export const RESPONSE = new RefType("#/responses/");

const ALL = {DEFINITION, PARAMETER, PATH, RESPONSE};
const ENUMS = Object.freeze(Object.keys(ALL).map(v => ALL[v]));

export default ({...ALL, forValue});