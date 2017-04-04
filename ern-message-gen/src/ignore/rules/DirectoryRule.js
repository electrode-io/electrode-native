import {FileRule} from "./FileRule";
import FileSystems from "../../java/FileSystems";
import StringBuilder from "../../java/StringBuilder";

export class DirectoryRule extends FileRule {
    constructor(syntax, definition) {
        super(syntax, definition);
        const pattern = this.getPattern();
        const sb = new StringBuilder("glob:", pattern);
        if (!pattern.endsWith("/")) sb.append("/");
        this.directoryMatcher = FileSystems.getDefault().getPathMatcher(sb.toString());
        this.contentsMatcher = FileSystems.getDefault().getPathMatcher(sb.append("**").toString());
    }

    matches(relativePath) {
        return this.contentsMatcher.matches(relativePath) || this.directoryMatcher.matches(relativePath);
    }
}

