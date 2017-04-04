import CliOption from "../CliOption";
import CodegenConstants from "../CodegenConstants";
import CodegenType from "../CodegenType";
import SupportingFile from "../SupportingFile";
import {ArrayProperty, MapProperty} from "../models/properties";
import StringUtils from "../java/StringUtils";
import LoggerFactory from "../java/LoggerFactory";
import File from "../java/File";
import {Arrays, newHashSet, newHashMap} from "../java/javaUtil";
import DefaultCodegen from "../DefaultCodegen";
import {parseBoolean} from "../java/BooleanHelper";

export default class AndroidClientCodegen extends DefaultCodegen {
    static USE_ANDROID_MAVEN_GRADLE_PLUGIN = "useAndroidMavenGradlePlugin";
    invokerPackage = "io.swagger.client";
    groupId = "io.swagger";
    artifactId = "swagger-android-client";
    artifactVersion = "1.0.0";
    projectFolder = "src/main";

    useAndroidMavenGradlePlugin = true;
    requestPackage = "io.swagger.client.request";
    authPackage = "io.swagger.client.auth";
    gradleWrapperPackage = "gradle.wrapper";
    apiDocPath = "docs/";
    modelDocPath = "docs/";
    __outputFolder = "generated-code/android";
    __languageSpecificPrimitives = newHashSet("String", "boolean", "Boolean", "Double", "Integer", "Long", "Float", "byte[]", "Object");
    __apiPackage = "io.swagger.client.api";
    __modelPackage = "io.swagger.client.model";
    __embeddedTemplateDir = "android";
    __templateDir = "android";
    __supportedLibraries = newHashMap(
        ["volley", "HTTP client: Volley 1.0.19 (default)"],
        ["httpclient", "HTTP client: Apache HttpClient 4.3.6. JSON processing: Gson 2.3.1. IMPORTANT: Android client using HttpClient is not actively maintained and will be depecreated in the next major release."]
    );

    constructor() {
        super();
        this.sourceFolder = this.projectFolder + "/java";
        this.__modelTemplateFiles.put("model.mustache", ".java");
        this.__apiTemplateFiles.put("api.mustache", ".java");
        this.setReservedWordsLowerCase(["localVarPostBody", "localVarPath", "localVarQueryParams", "localVarHeaderParams", "localVarFormParams", "localVarContentTypes", "localVarContentType", "localVarResponse", "localVarBuilder", "authNames", "basePath", "apiInvoker", "abstract", "continue", "for", "new", "switch", "assert", "default", "if", "package", "synchronized", "boolean", "do", "goto", "private", "this", "break", "double", "implements", "protected", "throw", "byte", "else", "import", "public", "throws", "case", "enum", "instanceof", "return", "transient", "catch", "extends", "int", "short", "try", "char", "final", "interface", "static", "void", "class", "finally", "long", "strictfp", "volatile", "const", "float", "native", "super", "while"]);
        this.__instantiationTypes.put("array", "ArrayList");
        this.__instantiationTypes.put("map", "HashMap");
        this.__typeMapping.put("date", "Date");
        this.__typeMapping.put("file", "File");
    }

    initalizeCliOptions() {
        super.initalizeCliOptions();
        this.__cliOptions.add(new CliOption(CodegenConstants.MODEL_PACKAGE, CodegenConstants.MODEL_PACKAGE_DESC));
        this.__cliOptions.add(new CliOption(CodegenConstants.API_PACKAGE, CodegenConstants.API_PACKAGE_DESC));
        this.__cliOptions.add(new CliOption(CodegenConstants.INVOKER_PACKAGE, CodegenConstants.INVOKER_PACKAGE_DESC));
        this.__cliOptions.add(new CliOption(CodegenConstants.GROUP_ID, "groupId for use in the generated build.gradle and pom.xml"));
        this.__cliOptions.add(new CliOption(CodegenConstants.ARTIFACT_ID, "artifactId for use in the generated build.gradle and pom.xml"));
        this.__cliOptions.add(new CliOption(CodegenConstants.ARTIFACT_VERSION, "artifact version for use in the generated build.gradle and pom.xml"));
        this.__cliOptions.add(new CliOption(CodegenConstants.SOURCE_FOLDER, CodegenConstants.SOURCE_FOLDER_DESC));
        this.__cliOptions.add(CliOption.newBoolean(AndroidClientCodegen.USE_ANDROID_MAVEN_GRADLE_PLUGIN, "A flag to toggle android-maven gradle plugin.").defaultValue("true"));
        const library = new CliOption(CodegenConstants.LIBRARY, "library template (sub-template) to use");
        library.setEnum(this.__supportedLibraries);
        this.__cliOptions.add(library);

    }


    getTag() {
        return CodegenType.CLIENT;
    }

    getName() {
        return "android";
    }

    getHelp() {
        return "Generates an Android client library.";
    }

    escapeReservedWord(name) {
        return "_" + name;
    }

    apiFileFolder() {
        return this.__outputFolder + "/" + this.sourceFolder + "/" + this.apiPackage().split('.').join(File.separator);
    }

    modelFileFolder() {
        return this.__outputFolder + "/" + this.sourceFolder + "/" + this.modelPackage().split('.').join(File.separator);
    }

    apiDocFileFolder() {
        return (this.__outputFolder + "/" + this.apiDocPath).split('/').join(File.separator);
    }

    modelDocFileFolder() {
        return (this.__outputFolder + "/" + this.modelDocPath).split('/').join(File.separator);
    }

    toApiDocFilename(name) {
        return this.toApiName(name);
    }

    toModelDocFilename(name) {
        return this.toModelName(name);
    }

    getTypeDeclaration(p) {

        if (p != null && p instanceof ArrayProperty) {
            let ap = p;
            let inner = ap.getItems();
            return this.getSwaggerType(p) + "<" + this.getTypeDeclaration(inner) + ">";
        }
        else if (p != null && p instanceof MapProperty) {
            let mp = p;
            let inner = mp.getAdditionalProperties();
            return this.getSwaggerType(p) + "<String, " + this.getTypeDeclaration(inner) + ">";
        }
        return super.getTypeDeclaration(p);
    }

    getSwaggerType(p) {
        let swaggerType = super.getSwaggerType(p);
        let type = null;
        if (this.__typeMapping.containsKey(swaggerType)) {
            type = this.__typeMapping.get(swaggerType);
            if (this.__languageSpecificPrimitives.contains(type) || type.indexOf(".") >= 0 || (type === "Map") || (type === "List") || (type === "File") || (type === "Date")) {
                return type;
            }
        }
        else {
            type = swaggerType;
        }
        return this.toModelName(type);
    }

    toVarName(name) {
        name = this.sanitizeName(name);
        name = name.replace(new RegExp("-", 'g'), "_");
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
        if (!StringUtils.isEmpty(this.modelNamePrefix)) {
            name = this.modelNamePrefix + "_" + name;
        }
        if (!StringUtils.isEmpty(this.modelNameSuffix)) {
            name = name + "_" + this.modelNameSuffix;
        }
        if (name.toUpperCase() == name) {
            return name;
        }
        name = DefaultCodegen.camelize(this.sanitizeName(name));
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
        else if (("Integer" === type) || ("Short" === type)) {
            if (example == null) {
                example = "56";
            }
        }
        else if (("Long" === type)) {
            if (example == null) {
                example = "56";
            }
            example = example + "L";
        }
        else if (("Float" === type)) {
            if (example == null) {
                example = "3.4";
            }
            example = example + "F";
        }
        else if (("Double" === type)) {
            example = "3.4";
            example = example + "D";
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
            example = "new File(\"" + this.escapeText(example) + "\")";
        }
        else if (("Date" === type)) {
            example = "new Date()";
        }
        else if (!this.__languageSpecificPrimitives.contains(type)) {
            example = "new " + type + "()";
        }
        if (example == null) {
            example = "null";
        }
        else if (( p.isListContainer)) {
            example = "Arrays.asList(" + example + ")";
        }
        else if (( p.isMapContainer)) {
            example = "new HashMap()";
        }
        p.example = example;
    }

    toOperationId(operationId) {
        if (StringUtils.isEmpty(operationId)) {
            throw new Error("Empty method name (operationId) not allowed");
        }
        operationId = DefaultCodegen.camelize(this.sanitizeName(operationId), true);
        if (this.isReservedWord(operationId)) {
            let newOperationId = DefaultCodegen.camelize("call_" + operationId, true);
            Log.warn(operationId + " (reserved word) cannot be used as method name. Renamed to " + newOperationId);
            return newOperationId;
        }
        return operationId;
    }

    processOpts() {
        super.processOpts();
        if (this.__additionalProperties.containsKey(CodegenConstants.INVOKER_PACKAGE)) {
            this.setInvokerPackage(this.__additionalProperties.get(CodegenConstants.INVOKER_PACKAGE));
        }
        else {
            this.__additionalProperties.put(CodegenConstants.INVOKER_PACKAGE, this.invokerPackage);
        }
        if (this.__additionalProperties.containsKey(CodegenConstants.GROUP_ID)) {
            this.setGroupId(this.__additionalProperties.get(CodegenConstants.GROUP_ID));
        }
        else {
            this.__additionalProperties.put(CodegenConstants.GROUP_ID, this.groupId);
        }
        if (this.__additionalProperties.containsKey(CodegenConstants.ARTIFACT_ID)) {
            this.setArtifactId(this.__additionalProperties.get(CodegenConstants.ARTIFACT_ID));
        }
        else {
            this.__additionalProperties.put(CodegenConstants.ARTIFACT_ID, this.artifactId);
        }
        if (this.__additionalProperties.containsKey(CodegenConstants.ARTIFACT_VERSION)) {
            this.setArtifactVersion(this.__additionalProperties.get(CodegenConstants.ARTIFACT_VERSION));
        }
        else {
            this.__additionalProperties.put(CodegenConstants.ARTIFACT_VERSION, this.artifactVersion);
        }
        if (this.__additionalProperties.containsKey(CodegenConstants.SOURCE_FOLDER)) {
            this.setSourceFolder(this.__additionalProperties.get(CodegenConstants.SOURCE_FOLDER));
        }
        if (this.__additionalProperties.containsKey(AndroidClientCodegen.USE_ANDROID_MAVEN_GRADLE_PLUGIN)) {
            this.setUseAndroidMavenGradlePlugin(parseBoolean(this.__additionalProperties.get(AndroidClientCodegen.USE_ANDROID_MAVEN_GRADLE_PLUGIN)));
        }
        else {
            this.__additionalProperties.put(AndroidClientCodegen.USE_ANDROID_MAVEN_GRADLE_PLUGIN, this.useAndroidMavenGradlePlugin);
        }
        if (this.__additionalProperties.containsKey(CodegenConstants.LIBRARY)) {
            this.setLibrary(this.__additionalProperties.get(CodegenConstants.LIBRARY));
        }
        this.__additionalProperties.put("apiDocPath", this.apiDocPath);
        this.__additionalProperties.put("modelDocPath", this.modelDocPath);
        if (StringUtils.isEmpty(this.getLibrary())) {
            this.setLibrary("volley");
        } else {
            this.setLibrary(this.getLibrary());
        }
        const f = this[`addSupportingFilesFor${DefaultCodegen.camelize(this.getLibrary())}`];
        f && f.call(this);
    }

    addSupportingForFilesHttpclient() {
        this.addSupportingFilesForHttpClient();
    }


    addSupportingFilesForHttpClient() {
        this.__modelDocTemplateFiles.put("model_doc.mustache", ".md");
        this.__apiDocTemplateFiles.put("api_doc.mustache", ".md");
        this.__supportingFiles.add(new SupportingFile("README.mustache", "", "README.md"));
        this.__supportingFiles.add(new SupportingFile("pom.mustache", "", "pom.xml"));
        this.__supportingFiles.add(new SupportingFile("settings.gradle.mustache", "", "settings.gradle"));
        this.__supportingFiles.add(new SupportingFile("build.mustache", "", "build.gradle"));
        this.__supportingFiles.add(new SupportingFile("manifest.mustache", this.projectFolder, "AndroidManifest.xml"));
        this.__supportingFiles.add(new SupportingFile("apiInvoker.mustache", (this.sourceFolder + File.separator + this.invokerPackage).split(".").join(File.separator), "ApiInvoker.java"));
        this.__supportingFiles.add(new SupportingFile("httpPatch.mustache", (this.sourceFolder + File.separator + this.invokerPackage).split(".").join(File.separator), "HttpPatch.java"));
        this.__supportingFiles.add(new SupportingFile("jsonUtil.mustache", (this.sourceFolder + File.separator + this.invokerPackage).split(".").join(File.separator), "JsonUtil.java"));
        this.__supportingFiles.add(new SupportingFile("apiException.mustache", (this.sourceFolder + File.separator + this.invokerPackage).split(".").join(File.separator), "ApiException.java"));
        this.__supportingFiles.add(new SupportingFile("Pair.mustache", (this.sourceFolder + File.separator + this.invokerPackage).split(".").join(File.separator), "Pair.java"));
        this.__supportingFiles.add(new SupportingFile("git_push.sh.mustache", "", "git_push.sh"));
        this.__supportingFiles.add(new SupportingFile("gitignore.mustache", "", ".gitignore"));
        this.__supportingFiles.add(new SupportingFile("gradlew.mustache", "", "gradlew"));
        this.__supportingFiles.add(new SupportingFile("gradlew.bat.mustache", "", "gradlew.bat"));
        this.__supportingFiles.add(new SupportingFile("gradle-wrapper.properties.mustache", this.gradleWrapperPackage.split(".").join(File.separator), "gradle-wrapper.properties"));
        this.__supportingFiles.add(new SupportingFile("gradle-wrapper.jar", this.gradleWrapperPackage.split(".").join(File.separator), "gradle-wrapper.jar"));
    }

    addSupportingFilesForVolley() {
        this.__modelDocTemplateFiles.put("model_doc.mustache", ".md");
        this.__apiDocTemplateFiles.put("api_doc.mustache", ".md");
        this.__supportingFiles.add(new SupportingFile("README.mustache", "", "README.md"));
        this.__supportingFiles.add(new SupportingFile("git_push.sh.mustache", "", "git_push.sh"));
        this.__supportingFiles.add(new SupportingFile("gitignore.mustache", "", ".gitignore"));
        this.__supportingFiles.add(new SupportingFile("pom.mustache", "", "pom.xml"));
        this.__supportingFiles.add(new SupportingFile("build.mustache", "", "build.gradle"));
        this.__supportingFiles.add(new SupportingFile("manifest.mustache", this.projectFolder, "AndroidManifest.xml"));
        this.__supportingFiles.add(new SupportingFile("apiInvoker.mustache", (this.sourceFolder + File.separator + this.invokerPackage).split(".").join(File.separator), "ApiInvoker.java"));
        this.__supportingFiles.add(new SupportingFile("jsonUtil.mustache", (this.sourceFolder + File.separator + this.invokerPackage).split(".").join(File.separator), "JsonUtil.java"));
        this.__supportingFiles.add(new SupportingFile("apiException.mustache", (this.sourceFolder + File.separator + this.invokerPackage).split(".").join(File.separator), "ApiException.java"));
        this.__supportingFiles.add(new SupportingFile("Pair.mustache", (this.sourceFolder + File.separator + this.invokerPackage).split(".").join(File.separator), "Pair.java"));
        this.__supportingFiles.add(new SupportingFile("request/getrequest.mustache", (this.sourceFolder + File.separator + this.requestPackage).split(".").join(File.separator), "GetRequest.java"));
        this.__supportingFiles.add(new SupportingFile("request/postrequest.mustache", (this.sourceFolder + File.separator + this.requestPackage).split(".").join(File.separator), "PostRequest.java"));
        this.__supportingFiles.add(new SupportingFile("request/putrequest.mustache", (this.sourceFolder + File.separator + this.requestPackage).split(".").join(File.separator), "PutRequest.java"));
        this.__supportingFiles.add(new SupportingFile("request/deleterequest.mustache", (this.sourceFolder + File.separator + this.requestPackage).split(".").join(File.separator), "DeleteRequest.java"));
        this.__supportingFiles.add(new SupportingFile("request/patchrequest.mustache", (this.sourceFolder + File.separator + this.requestPackage).split(".").join(File.separator), "PatchRequest.java"));
        this.__supportingFiles.add(new SupportingFile("auth/apikeyauth.mustache", (this.sourceFolder + File.separator + this.authPackage).split(".").join(File.separator), "ApiKeyAuth.java"));
        this.__supportingFiles.add(new SupportingFile("auth/httpbasicauth.mustache", (this.sourceFolder + File.separator + this.authPackage).split(".").join(File.separator), "HttpBasicAuth.java"));
        this.__supportingFiles.add(new SupportingFile("auth/authentication.mustache", (this.sourceFolder + File.separator + this.authPackage).split(".").join(File.separator), "Authentication.java"));
        this.__supportingFiles.add(new SupportingFile("gradlew.mustache", "", "gradlew"));
        this.__supportingFiles.add(new SupportingFile("gradlew.bat.mustache", "", "gradlew.bat"));
        this.__supportingFiles.add(new SupportingFile("gradle-wrapper.properties.mustache", this.gradleWrapperPackage.split(".").join(File.separator), "gradle-wrapper.properties"));
        this.__supportingFiles.add(new SupportingFile("gradle-wrapper.jar", this.gradleWrapperPackage.split(".").join(File.separator), "gradle-wrapper.jar"));
    }

    getUseAndroidMavenGradlePlugin() {
        return this.useAndroidMavenGradlePlugin;
    }

    setUseAndroidMavenGradlePlugin(useAndroidMavenGradlePlugin) {
        this.useAndroidMavenGradlePlugin = useAndroidMavenGradlePlugin;
    }

    setInvokerPackage(invokerPackage) {
        this.invokerPackage = invokerPackage;
    }

    setGroupId(groupId) {
        this.groupId = groupId;
    }

    setArtifactId(artifactId) {
        this.artifactId = artifactId;
    }

    setArtifactVersion(artifactVersion) {
        this.artifactVersion = artifactVersion;
    }

    setSourceFolder(sourceFolder) {
        this.sourceFolder = sourceFolder;
    }

    escapeQuotationMark(input) {
        return input.split("\"").join("");
    }

    escapeUnsafeCharacters(input) {
        return input.split("*/").join("*_/").split("/*").join("/_*");
    }
}
const Log = LoggerFactory.getLogger(AndroidClientCodegen);
