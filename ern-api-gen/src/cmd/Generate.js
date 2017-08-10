import DefaultGenerator from "../DefaultGenerator";
import CodegenConfigurator from "../config/CodegenConfigurator";
import LoggerFactory from "../java/LoggerFactory";
import {isNotEmpty} from "../java/StringUtils";
import {
    applyAdditionalPropertiesKvp,
    applyImportMappingsKvp,
    applyInstantiationTypesKvp,
    applyLanguageSpecificPrimitivesCsv,
    applySystemPropertiesKvp,
    applyTypeMappingsKvp
} from "../config/CodegenConfiguratorUtils";

import {Command} from '../java/cli';
import CodegenConstants from '../CodegenConstants';
import {apply} from '../java/beanUtils';

const hasArg = true;

export default class Generate {

    static Usage = new Command({name: "generate", description: "Generate code with chosen lang"}, [
        {name: ["-v", "--verbose"], description: "verbose mode"},
        {
            name: ["-l", "--lang"], title: "language", required: true, hasArg,
            property: 'lang',
            description: "client language to generate ({maybe class name in classpath, required},"
        },
        {
            name: ["-o", "--output"], title: "output directory", hasArg,
            description: "where to write the generated files ({current dir by default},",
            property: 'output'
        },
        {
            name: ["-i", "--input-spec"], title: "spec file", required: true, hasArg,
            property: 'spec',
            description: "location of the swagger spec, as URL or file ({required},"
        },
        {
            name: ["-t", "--template-dir"], title: "template directory", hasArg,
            description: "folder containing the template files"
        },
        {
            name: ["-a", "--auth"], title: "authorization", hasArg,
            property: 'auth',
            description: "adds authorization headers when fetching the swagger definitions remotely. " +
            "Pass in a URL-encoded string of name:header with a comma separating multiple values"
        },
        {
            name: ["-D"], title: "system properties", hasArg, description: "sets specified system properties in " +
        "the format of name:value,name:value"
        },

        {
            name: ["-c", "--config"], hasArg,
            title: "configuration file",
            property: "configFile",
            description: "Path to json configuration file. " +
            "File content should be in a json format [\"optionKey\":\"optionValue\", \"optionKey1\":\"optionValue1\"...] " +
            "Supported options can be different for each language. Run config-help -l [lang] command for language specific config options."
        },

        {
            name: ["-s", "--skip-overwrite"],
            title: "skip overwrite",
            description: "specifies if the existing files should be overwritten during the generation."
        },

        {name: ["--api-package"], title: "api package", hasArg, description: CodegenConstants.API_PACKAGE_DESC},

        {
            name: ["--model-package"],
            title: "model package", hasArg,
            description: CodegenConstants.MODEL_PACKAGE_DESC
        },

        {
            name: ["--model-name-prefix"],
            title: "model name prefix", hasArg,
            description: CodegenConstants.MODEL_NAME_PREFIX_DESC
        },

        {
            name: ["--model-name-suffix"],
            title: "model name suffix", hasArg,
            description: CodegenConstants.MODEL_NAME_SUFFIX_DESC
        },


        {
            name: ["--instantiation-types"],
            title: "instantiation types", hasArg,
            description: "sets instantiation type mappings in the format of type:instantiatedType,type:instantiatedType." +
            "For example ({in Java},: array:ArrayList,map:HashMap. In other words array types will get instantiated as ArrayList in generated code."
        },

        {
            name: ["--type-mappings"],
            title: "type mappings", hasArg,
            description: "sets mappings between swagger spec types and generated code types " +
            "in the format of swaggerType:generatedType,swaggerType:generatedType. For example: array:List,map:Map,string:String"
        },

        {
            name: ["--additional-properties"],
            title: "additional properties", hasArg,
            description: "sets additional properties that can be referenced by the mustache templates in the format of name:value,name:value"
        },

        {
            name: ["--language-specific-primitives"], title: "language specific primitives", hasArg,
            description: "specifies additional language specific primitive types in the format of type1,type2,type3,type3. For example: String,boolean,Boolean,Double"
        },

        {
            name: ["--import-mappings"], title: "import mappings", hasArg,
            description: "specifies mappings between a given class and the import that should be used for that class in the format of type:import,type:import"
        },

        {
            name: ["--invoker-package"],
            title: "invoker package", hasArg,
            description: CodegenConstants.INVOKER_PACKAGE_DESC
        },

        {name: ["--group-id"], hasArg, title: "group id", description: CodegenConstants.GROUP_ID_DESC},

        {name: ["--artifact-id"], hasArg, title: "artifact id", description: CodegenConstants.ARTIFACT_ID_DESC},

        {
            name: ["--artifact-version"],
            title: "artifact version", hasArg,
            description: CodegenConstants.ARTIFACT_VERSION_DESC
        },

        {name: ["--library"], hasArg, title: "library", description: CodegenConstants.LIBRARY_DESC},

        {name: ["--git-user-id"], hasArg, title: "git user id", description: CodegenConstants.GIT_USER_ID_DESC},

        {name: ["--git-repo-id"], hasArg, title: "git repo id", description: CodegenConstants.GIT_REPO_ID_DESC},

        {name: ["--release-note"], hasArg, title: "release note", description: CodegenConstants.RELEASE_NOTE_DESC},

        {
            name: ["--http-user-agent"], hasArg, title: "http user agent",
            description: CodegenConstants.HTTP_USER_AGENT_DESC
        }]);

    output = '';

    constructor(values) {
        apply(this, values);
    }

    async run() {
        let configurator = CodegenConfigurator.fromFile(this.configFile);
        if (configurator == null) {
            configurator = new CodegenConfigurator();
        }
        if (this.verbose != null) {
            configurator.setVerbose(this.verbose);
        }
        if (this.skipOverwrite != null) {
            configurator.setSkipOverwrite(this.skipOverwrite);
        }
        if (isNotEmpty(this.spec)) {
            configurator.setInputSpec(this.spec);
        }
        if (isNotEmpty(this.lang)) {
            configurator.setLang(this.lang);
        }
        if (isNotEmpty(this.output)) {
            configurator.setOutputDir(this.output);
        }
        if (isNotEmpty(this.auth)) {
            configurator.setAuth(this.auth);
        }
        if (isNotEmpty(this.templateDir)) {
            configurator.setTemplateDir(this.templateDir);
        }
        if (isNotEmpty(this.apiPackage)) {
            configurator.setApiPackage(this.apiPackage);
        }
        if (isNotEmpty(this.modelPackage)) {
            configurator.setModelPackage(this.modelPackage);
        }
        if (isNotEmpty(this.modelNamePrefix)) {
            configurator.setModelNamePrefix(this.modelNamePrefix);
        }
        if (isNotEmpty(this.modelNameSuffix)) {
            configurator.setModelNameSuffix(this.modelNameSuffix);
        }
        if (isNotEmpty(this.invokerPackage)) {
            configurator.setInvokerPackage(this.invokerPackage);
        }
        if (isNotEmpty(this.groupId)) {
            configurator.setGroupId(this.groupId);
        }
        if (isNotEmpty(this.artifactId)) {
            configurator.setArtifactId(this.artifactId);
        }
        if (isNotEmpty(this.artifactVersion)) {
            configurator.setArtifactVersion(this.artifactVersion);
        }
        if (isNotEmpty(this.library)) {
            configurator.setLibrary(this.library);
        }
        if (isNotEmpty(this.gitUserId)) {
            configurator.setGitUserId(this.gitUserId);
        }
        if (isNotEmpty(this.gitRepoId)) {
            configurator.setGitRepoId(this.gitRepoId);
        }
        if (isNotEmpty(this.releaseNote)) {
            configurator.setReleaseNote(this.releaseNote);
        }
        if (isNotEmpty(this.httpUserAgent)) {
            configurator.setHttpUserAgent(this.httpUserAgent);
        }
        applySystemPropertiesKvp(this.systemProperties, configurator);
        applyInstantiationTypesKvp(this.instantiationTypes, configurator);
        applyImportMappingsKvp(this.importMappings, configurator);
        applyTypeMappingsKvp(this.typeMappings, configurator);
        applyAdditionalPropertiesKvp(this.additionalProperties, configurator);
        applyLanguageSpecificPrimitivesCsv(this.languageSpecificPrimitives, configurator);
        const clientOptInput = await  configurator.toClientOptInput();
        const dg = new DefaultGenerator().opts(clientOptInput);
        dg.generate();
    }
}
const Log = LoggerFactory.getLogger(Generate);
