import Rule from "./Rule";
/**
 * An ignore rule which matches everything.
 */
export  class EverythingRule extends Rule {
    constructor(syntax, definition) {
        super(syntax, definition);
    }

    matches(relativePath) {
        return true;
    }

    getExcludeOperation() {
        return Rule.Operation.EXCLUDE_AND_TERMINATE;
    }
}
