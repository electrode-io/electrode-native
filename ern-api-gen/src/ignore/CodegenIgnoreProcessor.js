import {DirectoryRule} from "./rules/DirectoryRule";
import ruleCreate from "./rules/create";
import File from "../java/File";
import LoggerFactory from "../java/LoggerFactory";
import {Rule} from "./rules/Rule";
import fs from "fs";
const {Operation} = Rule;
export default class CodegenIgnoreProcessor {
    static IGNORE_FILE = ".swagger-codegen-ignore";
    exclusionRules = [];
    inclusionRules = [];

    constructor(outputPath) {
        this.outputPath = outputPath;
        let directory = new File(outputPath);
        if (directory.exists() && directory.isDirectory()) {
            const codegenIgnore = new File(directory, CodegenIgnoreProcessor.IGNORE_FILE);
            if (codegenIgnore.exists() && codegenIgnore.isFile()) {
                try {
                    this.loadCodegenRules(codegenIgnore.getAbsolutePath());
                } catch (e) {
                    Log.error("Could not process .swagger-codegen-ignore.", e.message);
                }
            }
            else {
                Log.info("No .swagger-codegen-ignore file found.");
            }
        }
    }


    loadCodegenRules(codegenIgnore) {
        const lines = fs.readFileSync(codegenIgnore, 'utf8').split('\n');
        for (const line of lines) {
            if (line.trim().length === 0)
                continue;
            const rule = ruleCreate(line);
            if (rule != null) {
                if (rule.getNegated()) {
                    this.inclusionRules.push(rule);
                }
                else {
                    this.exclusionRules.push(rule);
                }
            }
        }
    }

    allowsFile(targetFile) {
        if (this.exclusionRules.length === 0 && this.inclusionRules.length === 0) {
            return true;
        }
        const file = new File(this.outputPath, targetFile).relativeTo(this.outputPath);
        let directoryExcluded = false;
        let exclude = false;
        EXCLUDE: for (const current of this.exclusionRules) {
            const op = current.evaluate(file.getPath());
            switch (op) {
                case Operation.EXCLUDE:
                    exclude = true;
                    if (current != null && current instanceof DirectoryRule) {
                        directoryExcluded = true;
                    }
                    break;
                case Operation.INCLUDE:
                    break;
                case Operation.NOOP:
                    break;
                case Operation.EXCLUDE_AND_TERMINATE:
                    break EXCLUDE;
            }
        }
        if (exclude) {
            for (const current of this.inclusionRules) {
                const op = current.evaluate(file.getPath());
                if (op === Rule.Operation.INCLUDE) {
                    if ((current != null && current instanceof DirectoryRule) && directoryExcluded) {
                        exclude = false;
                    }
                    else if (!directoryExcluded) {
                        exclude = false;
                    }
                }
            }
        }
        return !exclude;
    }

    getInclusionRules() {
        return this.inclusionRules.concat();
    }

    getExclusionRules() {
        return this.exclusionRules.concat();
    }
}
const Log = LoggerFactory.getLogger(CodegenIgnoreProcessor);