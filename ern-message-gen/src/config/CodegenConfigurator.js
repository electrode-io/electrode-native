import ClientOptInput from "../ClientOptInput";
import ClientOpts from "../ClientOpts";
import CodegenConfigLoader from "../CodegenConfigLoader";
import CodegenConstants from "../CodegenConstants";
import AuthParser from "../auth/AuthParser";
import File from "../java/File";
import LoggerFactory from "../java/LoggerFactory";
import {isNotEmpty, isEmpty} from "../java/StringUtils";
import {apply} from "../java/beanUtils";
import System from "../java/System";
import fs from "fs";
import {newHashMap, newHashSet, asMap} from "../java/javaUtil";
import Swagger from '../java/Swagger';

const Validate = {
    notEmpty(value, message){
        if (isEmpty(value)) throw new Error(message);
    }
};
/**
 * A class that contains all codegen configuration properties a user would want to manipulate.
 * An instance could be created by deserializing a JSON file or being populated from CLI or Maven plugin parameters.
 * It also has a convenience method for creating a ClientOptInput class which is THE object DefaultGenerator.java needs
 * to generate code.
 */
export default class CodegenConfigurator {
    systemProperties = newHashMap();
    instantiationTypes = newHashMap();
    typeMappings = newHashMap();
    additionalProperties = newHashMap();
    importMappings = newHashMap();
    languageSpecificPrimitives = newHashSet();
    dynamicProperties = newHashMap();

    gitUserId = "GIT_USER_ID";
    gitRepoId = "GIT_REPO_ID";
    releaseNote = "Minor update";
    verbose = false;
    skipOverwrite = false;

    constructor(opts = {outputDir: '.'}) {
        apply(this, opts);
    }

    setBridgeVersion(version) {
        this.bridgeVersion = version;
    }

    getBridgeVersion() {
        return this.bridgeVersion;
    }

    setLang(lang) {
        this.lang = lang;
        return this;
    }

    setInputSpec(inputSpec) {
        this.inputSpec = inputSpec;
        return this;
    }

    getInputSpec() {
        return this.inputSpec;
    }

    getOutputDir() {
        return this.outputDir;
    }

    setOutputDir(outputDir) {
        this.outputDir = CodegenConfigurator.toAbsolutePathStr(outputDir);
        return this;
    }

    getModelPackage() {
        return this.modelPackage;
    }

    setModelPackage(modelPackage) {
        this.modelPackage = modelPackage;
        return this;
    }

    getModelNamePrefix() {
        return this.modelNamePrefix;
    }

    setModelNamePrefix(prefix) {
        this.modelNamePrefix = prefix;
        return this;
    }

    getModelNameSuffix() {
        return this.modelNameSuffix;
    }

    setModelNameSuffix(suffix) {
        this.modelNameSuffix = suffix;
        return this;
    }

    isVerbose() {
        return this.verbose;
    }

    setVerbose(verbose) {
        this.verbose = verbose;
        return this;
    }

    isSkipOverwrite() {
        return this.skipOverwrite;
    }

    setSkipOverwrite(skipOverwrite) {
        this.skipOverwrite = skipOverwrite;
        return this;
    }

    getLang() {
        return this.lang;
    }

    getTemplateDir() {
        return this.templateDir;
    }

    setTemplateDir(templateDir) {
        let f = new File(templateDir);
        if (!(f != null && f.exists() && f.isDirectory())) {
            throw new Error("Template directory " + templateDir + " does not exist.");
        }
        this.templateDir = f.getAbsolutePath();
        return this;
    }

    getAuth() {
        return this.auth;
    }

    setAuth(auth) {
        this.auth = auth;
        return this;
    }

    getApiPackage() {
        return this.apiPackage;
    }

    setApiPackage(apiPackage) {
        this.apiPackage = apiPackage;
        return this;
    }

    getInvokerPackage() {
        return this.invokerPackage;
    }

    setInvokerPackage(invokerPackage) {
        this.invokerPackage = invokerPackage;
        return this;
    }

    getGroupId() {
        return this.groupId;
    }

    setGroupId(groupId) {
        this.groupId = groupId;
        return this;
    }

    getArtifactId() {
        return this.artifactId;
    }

    setArtifactId(artifactId) {
        this.artifactId = artifactId;
        return this;
    }

    getArtifactVersion() {
        return this.artifactVersion;
    }

    setArtifactVersion(artifactVersion) {
        this.artifactVersion = artifactVersion;
        return this;
    }

    getSystemProperties() {
        return this.systemProperties;
    }

    setSystemProperties(systemProperties) {
        if (arguments.length) {
            this.systemProperties = systemProperties;
        } else {
            for (const [key, value] of this.systemProperties) {
                System.setProperty(key, value);
            }
        }
    }

    addSystemProperty(key, value) {

        this.systemProperties.put(key, value);
        return this;
    }

    getInstantiationTypes() {
        return this.instantiationTypes;
    }

    setInstantiationTypes(instantiationTypes) {
        this.instantiationTypes = instantiationTypes;
        return this;
    }

    addInstantiationType(key, value) {
        this.instantiationTypes.put(key, value);
        return this;
    }

    getTypeMappings() {
        return this.typeMappings;
    }

    setTypeMappings(typeMappings) {
        this.typeMappings = asMap(typeMappings);
        return this;
    }

    addTypeMapping(key, value) {
        this.typeMappings.put(key, value);
        return this;
    }

    getAdditionalProperties() {
        return this.additionalProperties;
    }

    setAdditionalProperties(additionalProperties) {
        this.additionalProperties = asMap(additionalProperties);
        return this;
    }

    addAdditionalProperty(key, value) {
        this.additionalProperties.put(key, value);
        return this;
    }

    getImportMappings() {
        return this.importMappings;
    }

    setImportMappings(importMappings) {
        this.importMappings = asMap(importMappings);
        return this;
    }

    addImportMapping(key, value) {
        this.importMappings.put(key, value);
        return this;
    }

    setDynamicProperties(properties) {
        properties = asMap(properties);
        this.dynamicProperties.clear();
        this.dynamicProperties.putAll(properties);
    }

    getLanguageSpecificPrimitives() {
        return this.languageSpecificPrimitives;
    }

    setLanguageSpecificPrimitives(languageSpecificPrimitives) {
        this.languageSpecificPrimitives = languageSpecificPrimitives;
        return this;
    }

    addLanguageSpecificPrimitive(value) {
        this.languageSpecificPrimitives.add(value);
        return this;
    }

    getLibrary() {
        return this.library;
    }

    setLibrary(library) {
        this.library = library;
        return this;
    }

    getGitUserId() {
        return this.gitUserId;
    }

    setGitUserId(gitUserId) {
        this.gitUserId = gitUserId;
        return this;
    }

    getGitRepoId() {
        return this.gitRepoId;
    }

    setGitRepoId(gitRepoId) {
        this.gitRepoId = gitRepoId;
        return this;
    }

    getReleaseNote() {
        return this.releaseNote;
    }

    setReleaseNote(releaseNote) {
        this.releaseNote = releaseNote;
        return this;
    }

    getHttpUserAgent() {
        return this.httpUserAgent;
    }

    setHttpUserAgent(httpUserAgent) {
        this.httpUserAgent = httpUserAgent;
        return this;
    }

    async toClientOptInput() {

        Validate.notEmpty(this.lang, "language must be specified");
        Validate.notEmpty(this.inputSpec, "input spec must be specified");
        this.setVerboseFlags();
        this.setSystemProperties();
        let config = CodegenConfigLoader.forName(this.lang);
        config.setOutputDir(this.outputDir);
        config.setSkipOverwrite(this.skipOverwrite);
        config.instantiationTypes().putAll(this.instantiationTypes);
        config.typeMapping().putAll(this.typeMappings);
        config.importMapping().putAll(this.importMappings);
        config.languageSpecificPrimitives().addAll(this.languageSpecificPrimitives);
        this.checkAndSetAdditionalProperty(this.apiPackage, CodegenConstants.API_PACKAGE);
        this.checkAndSetAdditionalProperty(this.modelPackage, CodegenConstants.MODEL_PACKAGE);
        this.checkAndSetAdditionalProperty(this.invokerPackage, CodegenConstants.INVOKER_PACKAGE);
        this.checkAndSetAdditionalProperty(this.bridgeVersion, "bridgeVersion");
        this.checkAndSetAdditionalProperty(this.groupId, CodegenConstants.GROUP_ID);
        this.checkAndSetAdditionalProperty(this.artifactId, CodegenConstants.ARTIFACT_ID);
        this.checkAndSetAdditionalProperty(this.artifactVersion, CodegenConstants.ARTIFACT_VERSION);
        this.checkAndSetAdditionalProperty(this.templateDir, CodegenConfigurator.toAbsolutePathStr(this.templateDir), CodegenConstants.TEMPLATE_DIR);
        this.checkAndSetAdditionalProperty(this.modelNamePrefix, CodegenConstants.MODEL_NAME_PREFIX);
        this.checkAndSetAdditionalProperty(this.modelNameSuffix, CodegenConstants.MODEL_NAME_SUFFIX);
        this.checkAndSetAdditionalProperty(this.gitUserId, CodegenConstants.GIT_USER_ID);
        this.checkAndSetAdditionalProperty(this.gitRepoId, CodegenConstants.GIT_REPO_ID);
        this.checkAndSetAdditionalProperty(this.releaseNote, CodegenConstants.RELEASE_NOTE);
        this.checkAndSetAdditionalProperty(this.httpUserAgent, CodegenConstants.HTTP_USER_AGENT);
        this.handleDynamicProperties(config);
        if (isNotEmpty(this.library)) {
            config.setLibrary(this.library);
        }
        config.additionalProperties().putAll(this.additionalProperties);
        let input = new ClientOptInput().config(config);
        let authorizationValues = AuthParser.parse(this.auth);
        const swagger = await Swagger.create({definition: this.inputSpec});
        return input.opts(new ClientOpts()).swagger(swagger);
    }

    addDynamicProperty(name, value) {
        this.dynamicProperties.put(name, value.toString());
        return this;
    }

    getDynamicProperties() {
        return this.dynamicProperties;
    }

    handleDynamicProperties(codegenConfig) {
        for (const langCliOption of codegenConfig.cliOptions()) {
            let opt = langCliOption.getOpt();
            if (this.dynamicProperties.containsKey(opt)) {
                codegenConfig.additionalProperties().put(opt, this.dynamicProperties.get(opt));
            }
            else if (this.systemProperties.containsKey(opt)) {
                codegenConfig.additionalProperties().put(opt, this.systemProperties.get(opt).toString());
            }
        }
    }

    setVerboseFlags() {
        if (!this.verbose) {
            return;
        }
        Log.info("\nVERBOSE MODE: ON. Additional debug options are injected\n - [debugSwagger] prints the swagger specification as interpreted by the codegen\n - [debugModels] prints models passed to the template engine\n - [debugOperations] prints operations passed to the template engine\n - [debugSupportingFiles] prints additional data passed to the template engine");
        System.setProperty("debugSwagger", "");
        System.setProperty("debugModels", "");
        System.setProperty("debugOperations", "");
        System.setProperty("debugSupportingFiles", "");
    }


    static toAbsolutePathStr(path) {
        if (isNotEmpty(path)) {
            return new File(path).toAbsolutePath();
        }
        return path;
    }

    checkAndSetAdditionalProperty(property, valueToSet, propertyKey) {
        if (arguments.length > 2) {
            if (isNotEmpty(property)) {
                this.additionalProperties.put(propertyKey, valueToSet);
            }
        } else {
            this.checkAndSetAdditionalProperty(property, property, valueToSet);
        }
    }

    static  fromFile(configFile) {
        if (isNotEmpty(configFile)) {
            try {
                const conf = JSON.parse(fs.readFileSync(new File(configFile).getAbsolutePath(), 'utf-8'));
                return apply(new CodegenConfigurator(), conf);
            }
            catch (e) {
                Log.error("Unable to deserialize config file: " + configFile, e);
            }

        }
        return null;
    }
}

const Log = LoggerFactory.getLogger(CodegenConfigurator);
