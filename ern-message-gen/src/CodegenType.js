class CodegenType {
    constructor(type) {
        this.type = type;
    }

    toString() {
        return this.type;
    }

    static ordinal = () => ALL;


}

function makeType(type) {
    return new CodegenType(type);
}

export const CLIENT = makeType("client");
export const SERVER = makeType("server");
export const DOCUMENTATION = makeType("documentation");
export const OTHER = makeType("other");

const ALL = [CLIENT, SERVER, DOCUMENTATION, OTHER];

export function forValue(value) {
    for (const type in ALL) {
        if (type.type == value.toLowerCase())
            return type;
    }
}
export default ({
    CLIENT, SERVER, DOCUMENTATION, OTHER
});
