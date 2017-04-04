class In {
    constructor(key) {
        this.key = key;
    }

    toValue() {
        return this.key;
    }

    toJSON() {
        return this.key;
    }
    toString(){
        return this.key;
    }
}

export default function forValue(value) {
    if (value == null || value instanceof In) return value;
    value = value.toLowerCase();
    if (value == HEADER.key) return HEADER;
    if (value == QUERY.key) return QUERY;
}

export const HEADER = new In("header");
export const QUERY = new In("query");

