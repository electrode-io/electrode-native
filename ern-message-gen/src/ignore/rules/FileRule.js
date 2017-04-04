import {Rule} from "./Rule";
import FileSystems from "../../java/FileSystems";

export class FileRule extends Rule {
    constructor(syntax, definition, root) {
        super(syntax, definition);
        this.matcher = FileSystems.getDefault().getPathMatcher("glob:" + this.getPattern());
    }

    matches(relativePath) {
        return this.matcher.matches(relativePath);
    }
}
