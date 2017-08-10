/**
 * Created by jspear1 on 3/6/17.
 */
export class IgnoreToken {
    constructor(name, pattern) {
        this.name = name;
        this.pattern = pattern;
        IgnoreToken[name] = this;
    }

    getPattern() {
        return this.pattern;
    }

    ordinal() {
        return ENUMS.indexOf(this);
    }

    toString() {
        return this.name;
    }

    equals(that) {
        if (that == null) return false;
        if (this === that) return true;
        if (typeof that === 'string')
            return this.name === that;
        return this.name === that.name;
    }

    static values = () => ENUMS;
}
const ENUMS = [
    new IgnoreToken("MATCH_ALL", "**"),
    new IgnoreToken("MATCH_ANY", "*"),
    new IgnoreToken("ESCAPED_EXCLAMATION", "\\!"),
    new IgnoreToken("ESCAPED_SPACE", "\\ "),
    new IgnoreToken("PATH_DELIM", "/"),
    new IgnoreToken("NEGATE", "!"),
    new IgnoreToken("TEXT", null),
    new IgnoreToken("DIRECTORY_MARKER", "/"),
    new IgnoreToken("ROOTED_MARKER", "/"),
    new IgnoreToken("COMMENT", null)
];
export default ({
    MATCH_ALL: ENUMS[0],
    MATCH_ANY: ENUMS[1],
    ESCAPED_EXCLAMATION: ENUMS[2],
    ESCAPED_SPACE: ENUMS[3],
    PATH_DELIM: ENUMS[4],
    NEGATE: ENUMS[5],
    TEXT: ENUMS[6],
    DIRECTORY_MARKER: ENUMS[7],
    ROOTED_MARKER: ENUMS[8],
    COMMENT: ENUMS[9]
})