import DefaultGenerator from '../DefaultGenerator'
import CodegenConfigurator from '../config/CodegenConfigurator'
import { isNotEmpty } from '../java/StringUtils'
import {
  applyAdditionalPropertiesKvp,
  applyImportMappingsKvp,
  applyInstantiationTypesKvp,
  applyLanguageSpecificPrimitivesCsv,
  applySystemPropertiesKvp,
  applyTypeMappingsKvp,
} from '../config/CodegenConfiguratorUtils'

import { Command } from '../java/cli'
import CodegenConstants from '../CodegenConstants'
import { apply } from '../java/beanUtils'

const hasArg = true

export default class Generate {
  public static Usage = new Command(
    { name: 'generate', description: 'Generate code with chosen lang' },
    [
      { name: ['-v', '--verbose'], description: 'verbose mode' },
      {
        description:
          'client language to generate ({maybe class name in classpath, required},',
        hasArg,
        name: ['-l', '--lang'],
        property: 'lang',
        required: true,
        title: 'language',
      },
      {
        description:
          'where to write the generated files ({current dir by default},',
        hasArg,
        name: ['-o', '--output'],
        property: 'output',
        title: 'output directory',
      },
      {
        description:
          'location of the swagger spec, as URL or file ({required},',
        hasArg,
        name: ['-i', '--input-spec'],
        property: 'spec',
        required: true,
        title: 'spec file',
      },
      {
        description: 'folder containing the template files',
        hasArg,
        name: ['-t', '--template-dir'],
        title: 'template directory',
      },
      {
        description:
          'adds authorization headers when fetching the swagger definitions remotely. ' +
          'Pass in a URL-encoded string of name:header with a comma separating multiple values',
        hasArg,
        name: ['-a', '--auth'],
        property: 'auth',
        title: 'authorization',
      },
      {
        description:
          'sets specified system properties in ' +
          'the format of name:value,name:value',
        hasArg,
        name: ['-D'],
        title: 'system properties',
      },
      {
        description:
          'Path to json configuration file. ' +
          'File content should be in a json format ["optionKey":"optionValue", "optionKey1":"optionValue1"...] ' +
          'Supported options can be different for each language. Run config-help -l [lang] command for language specific config options.',
        hasArg,
        name: ['-c', '--config'],
        property: 'configFile',
        title: 'configuration file',
      },
      {
        description:
          'specifies if the existing files should be overwritten during the generation.',
        name: ['-s', '--skip-overwrite'],
        title: 'skip overwrite',
      },
      {
        description: CodegenConstants.API_PACKAGE_DESC,
        hasArg,
        name: ['--api-package'],
        title: 'api package',
      },
      {
        description: CodegenConstants.MODEL_PACKAGE_DESC,
        hasArg,
        name: ['--model-package'],
        title: 'model package',
      },
      {
        description: CodegenConstants.MODEL_NAME_PREFIX_DESC,
        hasArg,
        name: ['--model-name-prefix'],
        title: 'model name prefix',
      },
      {
        description: CodegenConstants.MODEL_NAME_SUFFIX_DESC,
        hasArg,
        name: ['--model-name-suffix'],
        title: 'model name suffix',
      },
      {
        description:
          'sets instantiation type mappings in the format of type:instantiatedType,type:instantiatedType.' +
          'For example ({in Java},: array:ArrayList,map:HashMap. In other words array types will get instantiated as ArrayList in generated code.',
        hasArg,
        name: ['--instantiation-types'],
        title: 'instantiation types',
      },
      {
        description:
          'sets mappings between swagger spec types and generated code types ' +
          'in the format of swaggerType:generatedType,swaggerType:generatedType. For example: array:List,map:Map,string:String',
        hasArg,
        name: ['--type-mappings'],
        title: 'type mappings',
      },
      {
        description:
          'sets additional properties that can be referenced by the mustache templates in the format of name:value,name:value',
        hasArg,
        name: ['--additional-properties'],
        title: 'additional properties',
      },
      {
        description:
          'specifies additional language specific primitive types in the format of type1,type2,type3,type3. For example: String,boolean,Boolean,Double',
        hasArg,
        name: ['--language-specific-primitives'],
        title: 'language specific primitives',
      },
      {
        description:
          'specifies mappings between a given class and the import that should be used for that class in the format of type:import,type:import',
        hasArg,
        name: ['--import-mappings'],
        title: 'import mappings',
      },
      {
        description: CodegenConstants.INVOKER_PACKAGE_DESC,
        hasArg,
        name: ['--invoker-package'],
        title: 'invoker package',
      },
      {
        description: CodegenConstants.GROUP_ID_DESC,
        hasArg,
        name: ['--group-id'],
        title: 'group id',
      },
      {
        description: CodegenConstants.ARTIFACT_ID_DESC,
        hasArg,
        name: ['--artifact-id'],
        title: 'artifact id',
      },
      {
        description: CodegenConstants.ARTIFACT_VERSION_DESC,
        hasArg,
        name: ['--artifact-version'],
        title: 'artifact version',
      },
      {
        description: CodegenConstants.LIBRARY_DESC,
        hasArg,
        name: ['--library'],
        title: 'library',
      },
      {
        description: CodegenConstants.GIT_USER_ID_DESC,
        hasArg,
        name: ['--git-user-id'],
        title: 'git user id',
      },
      {
        description: CodegenConstants.GIT_REPO_ID_DESC,
        hasArg,
        name: ['--git-repo-id'],
        title: 'git repo id',
      },
      {
        description: CodegenConstants.RELEASE_NOTE_DESC,
        hasArg,
        name: ['--release-note'],
        title: 'release note',
      },
      {
        description: CodegenConstants.HTTP_USER_AGENT_DESC,
        hasArg,
        name: ['--http-user-agent'],
        title: 'http user agent',
      },
    ]
  )

  public output = ''

  // [TSCONV NOT SET]
  public modelNamePrefix
  public configFile
  public verbose
  public skipOverwrite
  public spec
  public lang
  public auth
  public templateDir
  public apiPackage
  public modelPackage
  public modelNameSuffix
  public invokerPackage
  public groupId
  public artifactId
  public artifactVersion
  public library
  public gitUserId
  public gitRepoId
  public releaseNote
  public httpUserAgent
  public systemProperties
  public instantiationTypes
  public importMappings
  public typeMappings
  public additionalProperties
  public languageSpecificPrimitives

  constructor(values) {
    apply(this, values)
  }

  public async run() {
    let configurator = CodegenConfigurator.fromFile(this.configFile)
    if (configurator == null) {
      configurator = new CodegenConfigurator()
    }
    if (this.verbose != null) {
      configurator.setVerbose(this.verbose)
    }
    if (this.skipOverwrite != null) {
      configurator.setSkipOverwrite(this.skipOverwrite)
    }
    if (isNotEmpty(this.spec)) {
      configurator.setInputSpec(this.spec)
    }
    if (isNotEmpty(this.lang)) {
      configurator.setLang(this.lang)
    }
    if (isNotEmpty(this.output)) {
      configurator.setOutputDir(this.output)
    }
    if (isNotEmpty(this.auth)) {
      configurator.setAuth(this.auth)
    }
    if (isNotEmpty(this.templateDir)) {
      configurator.setTemplateDir(this.templateDir)
    }
    if (isNotEmpty(this.apiPackage)) {
      configurator.setApiPackage(this.apiPackage)
    }
    if (isNotEmpty(this.modelPackage)) {
      configurator.setModelPackage(this.modelPackage)
    }
    if (isNotEmpty(this.modelNamePrefix)) {
      configurator.setModelNamePrefix(this.modelNamePrefix)
    }
    if (isNotEmpty(this.modelNameSuffix)) {
      configurator.setModelNameSuffix(this.modelNameSuffix)
    }
    if (isNotEmpty(this.invokerPackage)) {
      configurator.setInvokerPackage(this.invokerPackage)
    }
    if (isNotEmpty(this.groupId)) {
      configurator.setGroupId(this.groupId)
    }
    if (isNotEmpty(this.artifactId)) {
      configurator.setArtifactId(this.artifactId)
    }
    if (isNotEmpty(this.artifactVersion)) {
      configurator.setArtifactVersion(this.artifactVersion)
    }
    if (isNotEmpty(this.library)) {
      configurator.setLibrary(this.library)
    }
    if (isNotEmpty(this.gitUserId)) {
      configurator.setGitUserId(this.gitUserId)
    }
    if (isNotEmpty(this.gitRepoId)) {
      configurator.setGitRepoId(this.gitRepoId)
    }
    if (isNotEmpty(this.releaseNote)) {
      configurator.setReleaseNote(this.releaseNote)
    }
    if (isNotEmpty(this.httpUserAgent)) {
      configurator.setHttpUserAgent(this.httpUserAgent)
    }
    applySystemPropertiesKvp(this.systemProperties, configurator)
    applyInstantiationTypesKvp(this.instantiationTypes, configurator)
    applyImportMappingsKvp(this.importMappings, configurator)
    applyTypeMappingsKvp(this.typeMappings, configurator)
    applyAdditionalPropertiesKvp(this.additionalProperties, configurator)
    applyLanguageSpecificPrimitivesCsv(
      this.languageSpecificPrimitives,
      configurator
    )
    const clientOptInput = await configurator.toClientOptInput()
    const dg = new DefaultGenerator().opts(clientOptInput)
    dg.generate()
  }
}
