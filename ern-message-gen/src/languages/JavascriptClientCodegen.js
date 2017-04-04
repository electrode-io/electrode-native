import CliOption from "../CliOption";
import CodegenConstants from "../CodegenConstants";
import CodegenModel from "../CodegenModel";
import CodegenOperation from "../CodegenOperation";
import CodegenParameter from "../CodegenParameter";
import CodegenProperty from "../CodegenProperty";
import CodegenType from "../CodegenType";
import DefaultCodegen from "../DefaultCodegen";
import SupportingFile from "../SupportingFile";
import ArrayModel from "../models/ArrayModel";
import ModelImpl from "../models/ModelImpl";
import {
    ArrayProperty,
    BooleanProperty,
    DateProperty,
    DateTimeProperty,
    DoubleProperty,
    FloatProperty,
    IntegerProperty,
    LongProperty,
    MapProperty,
    RefProperty,
    StringProperty
} from "../models/properties";
import LoggerFactory from "../java/LoggerFactory";
import File from "../java/File";
import {newHashSet, newHashMap, Collections} from "../java/javaUtil";
import StringBuilder from "../java/StringBuilder";
import {isEmpty} from "../java/StringUtils";

export default class JavascriptClientCodegen extends DefaultCodegen {
    static  PROJECT_NAME = "projectName";
    static  MODULE_NAME = "moduleName";
    static  PROJECT_DESCRIPTION = "projectDescription";
    static  PROJECT_VERSION = "projectVersion";
    static  PROJECT_LICENSE_NAME = "projectLicenseName";
    static  USE_PROMISES = "usePromises";
    static  USE_INHERITANCE = "useInheritance";
    static  EMIT_MODEL_METHODS = "emitModelMethods";
    static  EMIT_JS_DOC = "emitJSDoc";

    sourceFolder = "src";
    localVariablePrefix = "";
    emitJSDoc = true;
    apiDocPath = "docs/";
    modelDocPath = "docs/";
    apiTestPath = "api/";
    modelTestPath = "model/";
    usePromises = false;
    emitModelMethods = false;
    __outputFolder = "generated-code/js";
    __templateDir = "Javascript";
    __apiPackage = "api";
    __modelPackage = "model";
    __typeMapping = newHashMap(
        ["array", "Array"],
        ["map", "Object"],
        ["List", "Array"],
        ["boolean", "Boolean"],
        ["string", "String"],
        ["int", "Integer"],
        ["float", "Number"],
        ["number", "Number"],
        ["DateTime", "Date"],
        ["date", "Date"],
        ["long", "Integer"],
        ["short", "Integer"],
        ["char", "String"],
        ["double", "Number"],
        ["object", "Object"],
        ["integer", "Integer"],
        ["ByteArray", "String"],
        ["binary", "String"],
        ["UUID", "String"]);

    __languageSpecificPrimitives = newHashSet("String", "Boolean", "Integer", "Number", "Array", "Object", "Date", "File");

    constructor() {
        super();
        this.__modelTemplateFiles.put("model.mustache", ".js");
        this.__modelTestTemplateFiles.put("model_test.mustache", ".js");
        this.__apiTemplateFiles.put("api.mustache", ".js");
        this.__apiTestTemplateFiles.put("api_test.mustache", ".js");
        this.__modelDocTemplateFiles.put("model_doc.mustache", ".md");
        this.__apiDocTemplateFiles.put("api_doc.mustache", ".md");
        this.__defaultIncludes = newHashSet(...this.__languageSpecificPrimitives);
        this.__instantiationTypes.put("array", "Array");
        this.__instantiationTypes.put("list", "Array");
        this.__instantiationTypes.put("map", "Object");
        this.setReservedWordsLowerCase(["abstract", "arguments", "boolean", "break", "byte", "case", "catch", "char", "class", "const", "continue", "debugger", "default", "delete", "do", "double", "else", "enum", "eval", "export", "extends", "false", "final", "finally", "float", "for", "function", "goto", "if", "implements", "import", "in", "instanceof", "int", "interface", "let", "long", "native", "new", "null", "package", "private", "protected", "public", "return", "short", "static", "super", "switch", "synchronized", "this", "throw", "throws", "transient", "true", "try", "typeof", "var", "void", "volatile", "while", "with", "yield", "Array", "Date", "eval", "function", "hasOwnProperty", "Infinity", "isFinite", "isNaN", "isPrototypeOf", "Math", "NaN", "Number", "Object", "prototype", "String", "toString", "undefined", "valueOf"]);
    }

    initalizeCliOptions() {
        super.initalizeCliOptions();
        this.__cliOptions.add(new CliOption(CodegenConstants.SOURCE_FOLDER, CodegenConstants.SOURCE_FOLDER_DESC).defaultValue("src"));
        this.__cliOptions.add(new CliOption(CodegenConstants.LOCAL_VARIABLE_PREFIX, CodegenConstants.LOCAL_VARIABLE_PREFIX_DESC));
        this.__cliOptions.add(new CliOption(CodegenConstants.INVOKER_PACKAGE, CodegenConstants.INVOKER_PACKAGE_DESC));
        this.__cliOptions.add(new CliOption(CodegenConstants.API_PACKAGE, CodegenConstants.API_PACKAGE_DESC));
        this.__cliOptions.add(new CliOption(CodegenConstants.MODEL_PACKAGE, CodegenConstants.MODEL_PACKAGE_DESC));
        this.__cliOptions.add(new CliOption(JavascriptClientCodegen.PROJECT_NAME, "name of the project (Default: generated from info.title or \"swagger-js-client\")"));
        this.__cliOptions.add(new CliOption(JavascriptClientCodegen.MODULE_NAME, "module name for AMD, Node or globals (Default: generated from <projectName>)"));
        this.__cliOptions.add(new CliOption(JavascriptClientCodegen.PROJECT_DESCRIPTION, "description of the project (Default: using info.description or \"Client library of <projectName>\")"));
        this.__cliOptions.add(new CliOption(JavascriptClientCodegen.PROJECT_VERSION, "version of the project (Default: using info.version or \"1.0.0\")"));
        this.__cliOptions.add(new CliOption(JavascriptClientCodegen.PROJECT_LICENSE_NAME, "name of the license the project uses (Default: using info.license.name)"));
        this.__cliOptions.add(new CliOption(JavascriptClientCodegen.USE_PROMISES, "use Promises as return values from the client API, instead of superagent callbacks").defaultValue("false"));
        this.__cliOptions.add(new CliOption(JavascriptClientCodegen.EMIT_MODEL_METHODS, "generate getters and setters for model properties").defaultValue("false"));
        this.__cliOptions.add(new CliOption(JavascriptClientCodegen.EMIT_JS_DOC, "generate JSDoc comments").defaultValue("true"));
        this.__cliOptions.add(new CliOption(JavascriptClientCodegen.USE_INHERITANCE, "use JavaScript prototype chains & delegation for inheritance").defaultValue("true"));
    }

    getTag() {
        return CodegenType.CLIENT;
    }

    getName() {
        return "javascript";
    }

    getHelp() {
        return "Generates a Javascript client library.";
    }

    processOpts() {
        super.processOpts();
        if (this.__additionalProperties.containsKey(JavascriptClientCodegen.PROJECT_NAME)) {
            this.setProjectName(this.__additionalProperties.get(JavascriptClientCodegen.PROJECT_NAME));
        }
        if (this.__additionalProperties.containsKey(JavascriptClientCodegen.MODULE_NAME)) {
            this.setModuleName(this.__additionalProperties.get(JavascriptClientCodegen.MODULE_NAME));
        }
        if (this.__additionalProperties.containsKey(JavascriptClientCodegen.PROJECT_DESCRIPTION)) {
            this.setProjectDescription(this.__additionalProperties.get(JavascriptClientCodegen.PROJECT_DESCRIPTION));
        }
        if (this.__additionalProperties.containsKey(JavascriptClientCodegen.PROJECT_VERSION)) {
            this.setProjectVersion(this.__additionalProperties.get(JavascriptClientCodegen.PROJECT_VERSION));
        }
        if (this.__additionalProperties.containsKey(JavascriptClientCodegen.PROJECT_LICENSE_NAME)) {
            this.setProjectLicenseName(this.__additionalProperties.get(JavascriptClientCodegen.PROJECT_LICENSE_NAME));
        }
        if (this.__additionalProperties.containsKey(CodegenConstants.LOCAL_VARIABLE_PREFIX)) {
            this.setLocalVariablePrefix(this.__additionalProperties.get(CodegenConstants.LOCAL_VARIABLE_PREFIX));
        }
        if (this.__additionalProperties.containsKey(CodegenConstants.SOURCE_FOLDER)) {
            this.setSourceFolder(this.__additionalProperties.get(CodegenConstants.SOURCE_FOLDER));
        }
        if (this.__additionalProperties.containsKey(CodegenConstants.INVOKER_PACKAGE)) {
            this.setInvokerPackage(this.__additionalProperties.get(CodegenConstants.INVOKER_PACKAGE));
        }
        if (this.__additionalProperties.containsKey(JavascriptClientCodegen.USE_PROMISES)) {
            this.usePromises = parseBoolean(this.__additionalProperties.get(JavascriptClientCodegen.USE_PROMISES));
        }
        if (this.__additionalProperties.containsKey(JavascriptClientCodegen.USE_INHERITANCE)) {
           this.supportsInheritance = parseBoolean(this.__additionalProperties.get(JavascriptClientCodegen.USE_INHERITANCE));
        }
        else {
            this.supportsInheritance = true;
        }
        if (this.__additionalProperties.containsKey(JavascriptClientCodegen.EMIT_MODEL_METHODS)) {
            this.setEmitModelMethods(parseBoolean(this.__additionalProperties.get(JavascriptClientCodegen.EMIT_MODEL_METHODS)));
        }
        if (this.__additionalProperties.containsKey(JavascriptClientCodegen.EMIT_JS_DOC)) {
            this.setEmitJSDoc(parseBoolean(this.__additionalProperties.get(JavascriptClientCodegen.EMIT_JS_DOC)));
        }
    }

    preprocessSwagger(swagger) {
        super.preprocessSwagger(swagger);
        if (swagger.getInfo() != null) {
            let info = swagger.getInfo();
            if (isEmpty(this.projectName) && info.getTitle() != null) {
                this.projectName = this.sanitizeName(this.dashize(info.getTitle()));
            }
            if (isEmpty(this.projectVersion)) {
                this.projectVersion = this.escapeUnsafeCharacters(this.escapeQuotationMark(info.getVersion()));
            }
            if (this.projectDescription == null && info.getDescription()) {
                this.projectDescription = this.sanitizeName(info.getDescription());
            }
            if (this.__additionalProperties.get(JavascriptClientCodegen.PROJECT_LICENSE_NAME) == null) {
                if (info.getLicense() != null) {
                    let license = info.getLicense();
                    this.__additionalProperties.put(JavascriptClientCodegen.PROJECT_LICENSE_NAME, this.sanitizeName(license.getName()));
                }
            }
        }
        if (isEmpty(this.projectName)) {
            this.projectName = "swagger-js-client";
        }
        if (isEmpty(this.moduleName)) {
            this.moduleName = DefaultCodegen.camelize(DefaultCodegen.underscore(this.projectName));
        }
        if (isEmpty(this.projectVersion)) {
            this.projectVersion = "1.0.0";
        }
        if (this.projectDescription == null) {
            this.projectDescription = "Client library of " + this.projectName;
        }
        this.__additionalProperties.put(JavascriptClientCodegen.PROJECT_NAME, this.projectName);
        this.__additionalProperties.put(JavascriptClientCodegen.MODULE_NAME, this.moduleName);
        this.__additionalProperties.put(JavascriptClientCodegen.PROJECT_DESCRIPTION, this.escapeText(this.projectDescription));
        this.__additionalProperties.put(JavascriptClientCodegen.PROJECT_VERSION, this.projectVersion);
        this.__additionalProperties.put(CodegenConstants.API_PACKAGE, this.__apiPackage);
        this.__additionalProperties.put(CodegenConstants.INVOKER_PACKAGE, this.invokerPackage);
        this.__additionalProperties.put(CodegenConstants.LOCAL_VARIABLE_PREFIX, this.localVariablePrefix);
        this.__additionalProperties.put(CodegenConstants.MODEL_PACKAGE, this.__modelPackage);
        this.__additionalProperties.put(CodegenConstants.SOURCE_FOLDER, this.sourceFolder);
        this.__additionalProperties.put(JavascriptClientCodegen.USE_PROMISES, this.usePromises);
        this.__additionalProperties.put(JavascriptClientCodegen.USE_INHERITANCE, this.supportsInheritance);
        this.__additionalProperties.put(JavascriptClientCodegen.EMIT_MODEL_METHODS, this.emitModelMethods);
        this.__additionalProperties.put(JavascriptClientCodegen.EMIT_JS_DOC, this.emitJSDoc);
        this.__additionalProperties.put("apiDocPath", this.apiDocPath);
        this.__additionalProperties.put("modelDocPath", this.modelDocPath);
        this.__supportingFiles.add(new SupportingFile("package.mustache", "", "package.json"));
        this.__supportingFiles.add(new SupportingFile("index.mustache", this.createPath(this.sourceFolder, this.invokerPackage), "index.js"));
        this.__supportingFiles.add(new SupportingFile("ApiClient.mustache", this.createPath(this.sourceFolder, this.invokerPackage), "ApiClient.js"));
        this.__supportingFiles.add(new SupportingFile("git_push.sh.mustache", "", "git_push.sh"));
        this.__supportingFiles.add(new SupportingFile("README.mustache", "", "README.md"));
        this.__supportingFiles.add(new SupportingFile("mocha.opts", "", "mocha.opts"));
        this.__supportingFiles.add(new SupportingFile("travis.yml", "", ".travis.yml"));
    }

    escapeReservedWord(name) {
        return "_" + name;
    }

    /**
     * Concatenates an array of path segments into a path string.
     * @param segments The path segments to concatenate. A segment may contain either of the file separator characters '\' or '/'.
     * A segment is ignored if it is <code>null</code>, empty or &quot;.&quot;.
     * @return A path string using the correct platform-specific file separator character.
     */
    createPath(...segments) {
        let buf = new StringBuilder();
        for (const segment of segments) {
            if (!isEmpty(segment) && !(segment === ".")) {
                if (buf.length() !== 0)
                    buf.append(File.separatorChar);
                buf.append(segment);
            }
        }
        for (let i = 0; i < buf.length(); i++) {
            let c = buf.charAt(i);
            if ((c === '/' || c === '\\') && c !== File.separatorChar)
                buf.setCharAt(i, File.separatorChar);
        }
        return buf.toString();
    }

    apiTestFileFolder() {
        return (this.__outputFolder + "/test/" + this.apiTestPath).split('/').join(File.separatorChar);
    }

    modelTestFileFolder() {
        return (this.__outputFolder + "/test/" + this.modelTestPath).split('/').join(File.separatorChar);
    }

    apiFileFolder() {
        return this.createPath(this.__outputFolder, this.sourceFolder, this.invokerPackage, this.apiPackage());
    }

    modelFileFolder() {
        return this.createPath(this.__outputFolder, this.sourceFolder, this.invokerPackage, this.modelPackage());
    }

    apiDocFileFolder() {
        return this.createPath(this.__outputFolder, this.apiDocPath);
    }

    modelDocFileFolder() {
        return this.createPath(this.__outputFolder, this.modelDocPath);
    }

    toApiDocFilename(name) {
        return this.toApiName(name);
    }

    toModelDocFilename(name) {
        return this.toModelName(name);
    }

    toApiTestFilename(name) {
        return this.toApiName(name) + ".spec";
    }

    toModelTestFilename(name) {
        return this.toModelName(name) + ".spec";
    }

    toVarName(name) {
        name = this.sanitizeName(name);
        if (("_" === name)) {
            name = "_u";
        }
        if (name.match("^[A-Z_]*$")) {
            return name;
        }
        name = DefaultCodegen.camelize(name, true);
        if (this.isReservedWord(name) || name.match("^\\d.*")) {
            name = this.escapeReservedWord(name);
        }
        return name;
    }

    toParamName(name) {
        return this.toVarName(name);
    }

    toModelName(name) {
        name = this.sanitizeName(name);
        if (!isEmpty(this.modelNamePrefix)) {
            name = this.modelNamePrefix + "_" + name;
        }
        if (!isEmpty(this.modelNameSuffix)) {
            name = name + "_" + this.modelNameSuffix;
        }
        name = DefaultCodegen.camelize(name);
        if (this.isReservedWord(name)) {
            let modelName = "Model" + name;
            Log.warn(name + " (reserved word) cannot be used as model name. Renamed to " + modelName);
            return modelName;
        }
        if (name.match("^\\d.*")) {
            let modelName = "Model" + name;
            Log.warn(name + " (model name starts with number) cannot be used as model name. Renamed to " + modelName);
            return modelName;
        }
        return name;
    }

    toModelFilename(name) {
        return this.toModelName(name);
    }

    toModelImport(name) {
        return name;
    }

    toApiImport(name) {
        return this.toApiName(name);
    }

    getTypeDeclaration(p) {
        if (p != null && p instanceof ArrayProperty) {
            const inner = p.getItems();
            return "[" + this.getTypeDeclaration(inner) + "]";
        }
        else if (p != null && p instanceof MapProperty) {
            const inner = p.getAdditionalProperties();
            return "{String: " + this.getTypeDeclaration(inner) + "}";
        }
        return super.getTypeDeclaration(p);
    }

    toDefaultValue(p) {
        const dp = p.getDefault();
        if (dp != null) {
            if (p instanceof StringProperty) {
                return JSON.stringify(dp) + '';
            }
            if (p instanceof BooleanProperty || p instanceof DoubleProperty || p instanceof FloatProperty || p instanceof IntegerProperty || p instanceof LongProperty) {
                return dp.toString();
            }
        }

        return dp;
    }

    toDefaultValueWithParam(name, p) {
        let type = this.normalizeType(this.getTypeDeclaration(p));
        if (p instanceof RefProperty) {
            return " = " + type + ".constructFromObject(data[\'" + name + "\']);";
        }
        else {
            return " = ApiClient.convertToType(data[\'" + name + "\'], " + type + ");";
        }
    }

    setParameterExampleValue(p) {
        let example;
        if (p.defaultValue == null) {
            example = p.example;
        }
        else {
            example = p.defaultValue;
        }
        let type = p.baseType;
        if (type == null) {
            type = p.dataType;
        }
        if (("String" === type)) {
            if (example == null) {
                example = p.paramName + "_example";
            }
            example = "\"" + this.escapeText(example) + "\"";
        }
        else if (("Integer" === type)) {
            if (example == null) {
                example = "56";
            }
        }
        else if (("Number" === type)) {
            if (example == null) {
                example = "3.4";
            }
        }
        else if (("Boolean" === type)) {
            if (example == null) {
                example = "true";
            }
        }
        else if (("File" === type)) {
            if (example == null) {
                example = "/path/to/file";
            }
            example = "\"" + this.escapeText(example) + "\"";
        }
        else if (("Date" === type)) {
            if (example == null) {
                example = "2013-10-20T19:20:30+01:00";
            }
            example = "new Date(\"" + this.escapeText(example) + "\")";
        }
        else if (!this.__languageSpecificPrimitives.contains(type)) {
            example = "new " + this.moduleName + "." + type + "()";
        }
        if (example == null) {
            example = "null";
        }
        else if ((p.isListContainer)) {
            example = "[" + example + "]";
        }
        else if ((p.isMapContainer)) {
            example = "{key: " + example + "}";
        }
        p.example = example;
    }

    /**
     * Normalize type by wrapping primitive types with single quotes.
     *
     * @param type Primitive type
     * @return Normalized type
     */
    normalizeType(type) {
        return type.replace(new RegExp("\\b(Boolean|Integer|Number|String|Date)\\b", 'g'), "\'$1\'");
    }

    getSwaggerType(p) {
        let swaggerType = super.getSwaggerType(p);
        let type = null;
        if (this.__typeMapping.containsKey(swaggerType)) {
            type = this.__typeMapping.get(swaggerType);
            if (!this.needToImport(type)) {
                return type;
            }
        }
        else {
            type = swaggerType;
        }
        if (null == type) {
            Log.error("No Type defined for Property " + p);
        }
        return this.toModelName(type);
    }

    toOperationId(operationId) {
        if (isEmpty(operationId)) {
            throw new Error("Empty method/operation name (operationId) not allowed");
        }
        operationId = DefaultCodegen.camelize(this.sanitizeName(operationId), true);
        if (this.isReservedWord(operationId)) {
            let newOperationId = DefaultCodegen.camelize("call_" + operationId, true);
            Log.warn(operationId + " (reserved word) cannot be used as method name. Renamed to " + newOperationId);
            return newOperationId;
        }
        return operationId;
    }

    fromOperation(path, httpMethod, operation, definitions, swagger) {
        if (arguments.length > 4) {
            let op = super.fromOperation(path, httpMethod, operation, definitions, swagger);
            if (op.returnType != null) {
                op.returnType = this.normalizeType(op.returnType);
            }
            op.path = this.sanitizePath(op.path);
            let lastRequired = null;
            let lastOptional = null;
            for (const p of  op.allParams) {
                if (p.required) {
                    lastRequired = p;
                }
                else {
                    lastOptional = p;
                }
            }
            for (const p of  op.allParams) {
                if (p === lastRequired) {
                    p._hasMoreRequired = false;
                }
                else if (p === lastOptional) {
                    p._hasMoreOptional = false;
                }
                else {
                    p._hasMoreRequired = true;
                    p._hasMoreOptional = true;
                }
            }
            op._hasRequiredParams = lastRequired != null;
            return op;
        }
        return super.fromOperation(path, httpMethod, operation, definitions);
    }


    fromModel(name, model, allDefinitions) {
        if (arguments.length > 2) {
            let codegenModel = super.fromModel(name, model, allDefinitions);
            if (allDefinitions != null && codegenModel != null && codegenModel.parent != null && codegenModel.hasEnums) {
                let parentModel = allDefinitions.get(codegenModel.parentSchema);
                let parentCodegenModel = super.fromModel(codegenModel.parent, parentModel, allDefinitions);
                codegenModel = JavascriptClientCodegen.reconcileInlineEnums(codegenModel, parentCodegenModel);
            }
            if (model != null && model instanceof ArrayModel) {
                let am = model;
                if (am.getItems() != null) {
                    codegenModel._isArray = true;
                    codegenModel._itemType = this.getSwaggerType(am.getItems());
                }
            }
            else if (model != null && model instanceof ModelImpl) {
                let mm = model;
                if (mm.getAdditionalProperties() != null) {
                    codegenModel._isMap = true;
                    codegenModel._itemType = this.getSwaggerType(mm.getAdditionalProperties());
                }
            }
            return codegenModel;
        }
        else
            return super.fromModel(name, model);
    }


    sanitizePath(p) {
        return p.replace(new RegExp("\'", 'g'), "%27");
    }

    trimBrackets(s) {
        if (s != null) {
            let beginIdx = s[0] === '[' ? 1 : 0;
            let endIdx = s.length;
            if (s[endIdx - 1] === ']')
                endIdx--;
            return s.substring(beginIdx, endIdx);
        }
        return null;
    }

    getModelledType(dataType) {
        return "module:" + (isEmpty(this.invokerPackage) ? "" : (this.invokerPackage + "/")) + (isEmpty(this.__modelPackage) ? "" : (this.__modelPackage + "/")) + dataType;
    }

    getJSDocType(cm, cp) {
        if (((cm != null && cm instanceof CodegenModel) || cm === null) && ((cp != null && cp instanceof CodegenProperty) || cp === null)) {
            if ((cp.isContainer)) {
                if ((cp.containerType === "array"))
                    return "Array.<" + this.getJSDocType(cm, cp.items) + ">";
                else if ((cp.containerType === "map"))
                    return "Object.<String, " + this.getJSDocType(cm, cp.items) + ">";
            }
            let dataType = this.trimBrackets(cp.datatypeWithEnum);
            if (cp.isEnum) {
                dataType = cm.classname + '.' + dataType;
            }
            if (this.isModelledType(cp))
                dataType = this.getModelledType(dataType);
            return dataType;
        }
        else if (((cm != null && cm instanceof CodegenParameter) || cm === null) && cp === undefined) {
            let dataType = this.trimBrackets(cm.dataType);
            if (this.isModelledType(cm))
                dataType = this.getModelledType(dataType);
            if ((cm.isListContainer)) {
                return "Array.<" + dataType + ">";
            }
            else if ((cm.isMapContainer)) {
                return "Object.<String, " + dataType + ">";
            }
            return dataType;
        }
        else if (((cm != null && cm instanceof CodegenOperation) || cm === null) && cp === undefined) {
            let returnType = this.trimBrackets(cm.returnType);
            if (returnType != null) {
                if (this.isModelledType(cm))
                    returnType = this.getModelledType(returnType);
                if ((cm.isListContainer)) {
                    return "Array.<" + returnType + ">";
                }
                else if ((cm.isMapContainer)) {
                    return "Object.<String, " + returnType + ">";
                }
            }
            return returnType;
        }
        else
            throw new Error('invalid overload');
    }

    isModelledType(cp) {
        if (((cp != null && cp instanceof CodegenProperty) || cp === null)) {
            return cp.isEnum || !this.__languageSpecificPrimitives.contains(cp.baseType == null ? cp.datatype : cp.baseType);
        }
        else if (((cp != null && cp instanceof CodegenParameter) || cp === null)) {
            return cp.isEnum || !this.__languageSpecificPrimitives.contains(cp.baseType == null ? cp.dataType : cp.baseType);
        }
        else if (((cp != null && cp instanceof CodegenOperation) || cp === null)) {
            return !(cp.returnTypeIsPrimitive);
        }
        throw new Error('invalid overload');
    }

    postProcessOperations(objs) {
        let operations = objs.get("operations");
        if (operations != null) {
            let ops = operations.get("operation");
            for (const operation of ops) {
                let argList = [];
                let hasOptionalParams = false;
                for (const p of operation.allParams) {
                    if (p.required) {
                        argList.push(p.paramName);
                    }
                    else {
                        hasOptionalParams = true;
                    }
                }
                if (hasOptionalParams) {
                    argList.push("opts");
                }
                if (!this.usePromises) {
                    argList.push("callback");
                }
                operation._argList = argList.join(", ");
                for (const cp of operation.allParams) {
                    cp._jsDocType = this.getJSDocType(cp);
                }
                operation._jsDocType = this.getJSDocType(operation);
            }
        }
        Collections.sort(objs.get("imports"), (a, b) => {
            const a1 = a.get("import"), b1 = b.get("import");
            return a1.localeCompare(b1);
        });
        return objs;
    }

    postProcessModels(objs) {
        objs = super.postProcessModelsEnum(objs);
        let models = objs.get("models");
        for (const mo of models) {

            let cm = mo.get("model");
            let required = [];
            let allRequired = this.supportsInheritance ? [] : required;
            cm._required = required;

            cm._allRequired = allRequired;

            for (const __var of cm.vars) {
                let jsDocType = this.getJSDocType(cm, __var);
                __var._jsDocType = jsDocType;

                if ((__var.required)) {
                    required.push(__var);
                }
            }
            if (this.supportsInheritance) {
                for (const vars of cm.allVars) {
                    if (vars.required) {
                        allRequired.push(vars);
                    }
                }
            }
            let lastRequired = null;
            for (const vars of cm.vars) {
                if (vars.required != null && vars.required) {
                    lastRequired = vars;
                }
            }
            for (const vars of cm.vars) {
                if (vars === lastRequired) {
                    vars._hasMoreRequired = false;
                }
                else if (vars.required != null && vars.required) {
                    vars._hasMoreRequired = true;
                }
            }

        }
        return objs;
    }

    needToImport(type) {
        return !this.__defaultIncludes.contains(type) && !this.__languageSpecificPrimitives.contains(type);
    }

    static reconcileInlineEnums(codegenModel, parentCodegenModel) {
        if (parentCodegenModel.hasEnums) {
            let parentModelCodegenProperties = parentCodegenModel.vars;
            let codegenProperties = codegenModel.vars;
            let removedChildEnum = false;
            for (const parentModelCodegenPropery of parentModelCodegenProperties) {
                if (parentModelCodegenPropery.isEnum) {
                    for (let i = codegenProperties.length; i--;) {
                        const codegenProperty = codegenProperties[i];
                        if (codegenProperty.isEnum && codegenProperty.equals(parentModelCodegenPropery)) {
                            codegenProperties.splice(i, 1);
                            removedChildEnum = true;
                        }
                    }
                }
            }
            if (removedChildEnum) {
                let codegenProperty;
                for (codegenProperty of codegenProperties) {
                    codegenProperty.hasMore = true;
                }
                codegenProperty.hasMore = false;
                codegenModel.vars = codegenProperties;
            }
        }
        return codegenModel;
    }

    staticsanitizePackageName(packageName) {
        packageName = packageName.trim();
        packageName = packageName.replace(new RegExp("[^a-zA-Z0-9_\\.]", 'g'), "_");
        if (isEmpty(packageName)) {
            return "invalidPackageName";
        }
        return packageName;
    }

    toEnumName(property) {
        return this.sanitizeName(DefaultCodegen.camelize(property.name)) + "Enum";
    }

    toEnumVarName(value, datatype) {
        return value;
    }

    toEnumValue(value, datatype) {
        if (("Integer" === datatype) || ("Number" === datatype)) {
            return value;
        }
        else {
            return "\"" + this.escapeText(value) + "\"";
        }
    }

    escapeQuotationMark(input) {
        return input && input.split("\"").join("").split("\'").join("");
    }

    escapeUnsafeCharacters(input) {
        return input && input.split("*/").join("*_/").split("/*").join("/_*");
    }
}


const Log = LoggerFactory.getLogger(JavascriptClientCodegen);
