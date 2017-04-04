import IgnoreToken from "./IgnoreToken";
import {InvalidRule} from "./InvalidRule";
import {DirectoryRule} from "./DirectoryRule";
import {RootedFileRule} from "./RootedFileRule";
import {FileRule} from "./FileRule";
import {IgnoreLineParser} from "./IgnoreLineParser";

export default function create(definition) {
    let rule = null;
    if ((definition === ".")) {
        return new InvalidRule(null, definition, "Pattern \'.\' is invalid.");
    }
    else if ((definition === "!.")) {
        return new InvalidRule(null, definition, "Pattern \'!.\' is invalid.");
    }
    else if (definition.startsWith("..")) {
        return new InvalidRule(null, definition, "Pattern \'..\' is invalid.");
    }
    try {
        let result = IgnoreLineParser.parse(definition);
        let directoryOnly = null;
        if (result.length === 0) {
            return rule;
        }
        else if (result.length === 1) {
            let part = result[0];
            if (IgnoreToken.MATCH_ANY.equals(part.getToken())) {
                rule = new RootedFileRule(result, definition);
            }
            else {
                rule = new FileRule(result, definition);
            }
        }
        else {
            const head = result[0].getToken();
            directoryOnly = IgnoreToken.DIRECTORY_MARKER.equals(result[result.length - 1].getToken());
            if (directoryOnly) {
                rule = new DirectoryRule(result, definition);
            }
            else if (IgnoreToken.PATH_DELIM.equals(head)) {
                rule = new RootedFileRule(result, definition);
            }
            else {
                rule = new FileRule(result, definition);
            }
        }
    }
    catch (e) {
        console.error(e.message, e);
        return new InvalidRule(null, definition, e.message);
    }

    return rule;
}