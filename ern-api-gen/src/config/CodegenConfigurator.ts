import ClientOptInput from '../ClientOptInput'
import ClientOpts from '../ClientOpts'
import CodegenConfigLoader from '../CodegenConfigLoader'
import CodegenConstants from '../CodegenConstants'
import AuthParser from '../auth/AuthParser'
import File from '../java/File'
import { log } from 'ern-core'
import { isNotEmpty, isEmpty } from '../java/StringUtils'
import { apply, applyStrict } from '../java/beanUtils'
import System from '../java/System'
import fs from 'fs'
import { newHashMap, newHashSet, asMap } from '../java/javaUtil'
import Swagger from '../java/Swagger'
import { FakeHashMap } from '../java/fakeMap'

const Validate = {
  notEmpty(value, message) {
    if (isEmpty(value)) {
      throw new Error(message)
    }
  },
}
/**
 * A class that contains all codegen configuration properties a user would want to manipulate.
 * An instance could be created by deserializing a JSON file or being populated from CLI or Maven plugin parameters.
 * It also has a convenience method for creating a ClientOptInput class which is THE object DefaultGenerator.java needs
 * to generate code.
 */
export default class CodegenConfigurator {
  public static toAbsolutePathStr(path) {
    if (isNotEmpty(path)) {
      return new File(path).toAbsolutePath()
    }
    return path
  }

  public static fromFile(configFile) {
    if (isNotEmpty(configFile)) {
      try {
        const conf = JSON.parse(
          fs.readFileSync(new File(configFile).getAbsolutePath(), 'utf-8')
        )
        return apply(new CodegenConfigurator(), conf)
      } catch (e) {
        log.error(
          `Unable to deserialize config file ${configFile}. error: ${e}`
        )
      }
    }
    return null
  }

  public systemProperties = newHashMap()
  public instantiationTypes = newHashMap()
  public typeMappings = newHashMap()
  public additionalProperties = newHashMap()
  public importMappings = newHashMap()
  public languageSpecificPrimitives = newHashSet()
  public dynamicProperties = newHashMap()

  public gitUserId = 'GIT_USER_ID'
  public gitRepoId = 'GIT_REPO_ID'
  public releaseNote = 'Minor update'
  public verbose = false
  public skipOverwrite = false

  // [TSCONV NOT SET]
  public bridgeVersion
  public lang
  public inputSpec
  public outputDir
  public modelPackage
  public modelNamePrefix
  public modelNameSuffix
  public templateDir
  public auth
  public apiPackage
  public invokerPackage
  public groupId
  public artifactId
  public artifactVersion
  public library
  public httpUserAgent

  constructor(opts: any = { outputDir: '.' }) {
    apply(this, opts)
  }

  public setBridgeVersion(version) {
    this.bridgeVersion = version
  }

  public getBridgeVersion() {
    return this.bridgeVersion
  }

  public setLang(lang) {
    this.lang = lang
    return this
  }

  public setInputSpec(inputSpec) {
    this.inputSpec = inputSpec
    return this
  }

  public getInputSpec() {
    return this.inputSpec
  }

  public getOutputDir() {
    return this.outputDir
  }

  public setOutputDir(outputDir) {
    this.outputDir = CodegenConfigurator.toAbsolutePathStr(outputDir)
    return this
  }

  public getModelPackage() {
    return this.modelPackage
  }

  public setModelPackage(modelPackage) {
    this.modelPackage = modelPackage
    return this
  }

  public getModelNamePrefix() {
    return this.modelNamePrefix
  }

  public setModelNamePrefix(prefix) {
    this.modelNamePrefix = prefix
    return this
  }

  public getModelNameSuffix() {
    return this.modelNameSuffix
  }

  public setModelNameSuffix(suffix) {
    this.modelNameSuffix = suffix
    return this
  }

  public isVerbose() {
    return this.verbose
  }

  public setVerbose(verbose) {
    this.verbose = verbose
    return this
  }

  public isSkipOverwrite() {
    return this.skipOverwrite
  }

  public setSkipOverwrite(skipOverwrite) {
    this.skipOverwrite = skipOverwrite
    return this
  }

  public getLang() {
    return this.lang
  }

  public getTemplateDir() {
    return this.templateDir
  }

  public setTemplateDir(templateDir) {
    const f = new File(templateDir)
    if (!(f != null && f.exists() && f.isDirectory())) {
      throw new Error('Template directory ' + templateDir + ' does not exist.')
    }
    this.templateDir = f.getAbsolutePath()
    return this
  }

  public getAuth() {
    return this.auth
  }

  public setAuth(auth) {
    this.auth = auth
    return this
  }

  public getApiPackage() {
    return this.apiPackage
  }

  public setApiPackage(apiPackage) {
    this.apiPackage = apiPackage
    return this
  }

  public getInvokerPackage() {
    return this.invokerPackage
  }

  public setInvokerPackage(invokerPackage) {
    this.invokerPackage = invokerPackage
    return this
  }

  public getGroupId() {
    return this.groupId
  }

  public setGroupId(groupId) {
    this.groupId = groupId
    return this
  }

  public getArtifactId() {
    return this.artifactId
  }

  public setArtifactId(artifactId) {
    this.artifactId = artifactId
    return this
  }

  public getArtifactVersion() {
    return this.artifactVersion
  }

  public setArtifactVersion(artifactVersion) {
    this.artifactVersion = artifactVersion
    return this
  }

  public getSystemProperties() {
    return this.systemProperties
  }

  public setSystemProperties(systemProperties?: any) {
    if (arguments.length) {
      this.systemProperties = systemProperties
    } else {
      for (const [key, value] of this.systemProperties) {
        System.setProperty(key, value)
      }
    }
  }

  public addSystemProperty(key, value) {
    this.systemProperties.put(key, value)
    return this
  }

  public getInstantiationTypes() {
    return this.instantiationTypes
  }

  public setInstantiationTypes(instantiationTypes) {
    this.instantiationTypes = instantiationTypes
    return this
  }

  public addInstantiationType(key, value) {
    this.instantiationTypes.put(key, value)
    return this
  }

  public getTypeMappings() {
    return this.typeMappings
  }

  public setTypeMappings(typeMappings) {
    this.typeMappings = asMap(typeMappings) as FakeHashMap
    return this
  }

  public addTypeMapping(key, value) {
    this.typeMappings.put(key, value)
    return this
  }

  public getAdditionalProperties() {
    return this.additionalProperties
  }

  public setAdditionalProperties(additionalProperties) {
    this.additionalProperties = asMap(additionalProperties) as FakeHashMap
    return this
  }

  public addAdditionalProperty(key, value) {
    this.additionalProperties.put(key, value)
    return this
  }

  public getImportMappings() {
    return this.importMappings
  }

  public setImportMappings(importMappings) {
    this.importMappings = asMap(importMappings) as FakeHashMap
    return this
  }

  public addImportMapping(key, value) {
    this.importMappings.put(key, value)
    return this
  }

  public setDynamicProperties(properties) {
    properties = asMap(properties)
    this.dynamicProperties.clear()
    this.dynamicProperties.putAll(properties)
  }

  public getLanguageSpecificPrimitives() {
    return this.languageSpecificPrimitives
  }

  public setLanguageSpecificPrimitives(languageSpecificPrimitives) {
    this.languageSpecificPrimitives = languageSpecificPrimitives
    return this
  }

  public addLanguageSpecificPrimitive(value) {
    this.languageSpecificPrimitives.add(value)
    return this
  }

  public getLibrary() {
    return this.library
  }

  public setLibrary(library) {
    this.library = library
    return this
  }

  public getGitUserId() {
    return this.gitUserId
  }

  public setGitUserId(gitUserId) {
    this.gitUserId = gitUserId
    return this
  }

  public getGitRepoId() {
    return this.gitRepoId
  }

  public setGitRepoId(gitRepoId) {
    this.gitRepoId = gitRepoId
    return this
  }

  public getReleaseNote() {
    return this.releaseNote
  }

  public setReleaseNote(releaseNote) {
    this.releaseNote = releaseNote
    return this
  }

  public getHttpUserAgent() {
    return this.httpUserAgent
  }

  public setHttpUserAgent(httpUserAgent) {
    this.httpUserAgent = httpUserAgent
    return this
  }

  public async toClientOptInput() {
    Validate.notEmpty(this.lang, 'language must be specified')
    Validate.notEmpty(this.inputSpec, 'input spec must be specified')
    this.setVerboseFlags()
    this.setSystemProperties()
    const config = CodegenConfigLoader.forName(this.lang)
    applyStrict(config, this)
    config.setOutputDir(this.outputDir)
    config.setSkipOverwrite(this.skipOverwrite)
    config.instantiationTypes().putAll(this.instantiationTypes)
    config.typeMapping().putAll(this.typeMappings)
    config.importMapping().putAll(this.importMappings)
    config.languageSpecificPrimitives().addAll(this.languageSpecificPrimitives)
    this.checkAndSetAdditionalProperty(
      this.apiPackage,
      CodegenConstants.API_PACKAGE
    )
    this.checkAndSetAdditionalProperty(
      this.modelPackage,
      CodegenConstants.MODEL_PACKAGE
    )
    this.checkAndSetAdditionalProperty(
      this.invokerPackage,
      CodegenConstants.INVOKER_PACKAGE
    )
    this.checkAndSetAdditionalProperty(this.bridgeVersion, 'bridgeVersion')
    this.checkAndSetAdditionalProperty(this.groupId, CodegenConstants.GROUP_ID)
    this.checkAndSetAdditionalProperty(
      this.artifactId,
      CodegenConstants.ARTIFACT_ID
    )
    this.checkAndSetAdditionalProperty(
      this.artifactVersion,
      CodegenConstants.ARTIFACT_VERSION
    )
    this.checkAndSetAdditionalProperty(
      this.templateDir,
      CodegenConfigurator.toAbsolutePathStr(this.templateDir),
      CodegenConstants.TEMPLATE_DIR
    )
    this.checkAndSetAdditionalProperty(
      this.modelNamePrefix,
      CodegenConstants.MODEL_NAME_PREFIX
    )
    this.checkAndSetAdditionalProperty(
      this.modelNameSuffix,
      CodegenConstants.MODEL_NAME_SUFFIX
    )
    this.checkAndSetAdditionalProperty(
      this.gitUserId,
      CodegenConstants.GIT_USER_ID
    )
    this.checkAndSetAdditionalProperty(
      this.gitRepoId,
      CodegenConstants.GIT_REPO_ID
    )
    this.checkAndSetAdditionalProperty(
      this.releaseNote,
      CodegenConstants.RELEASE_NOTE
    )
    this.checkAndSetAdditionalProperty(
      this.httpUserAgent,
      CodegenConstants.HTTP_USER_AGENT
    )
    this.handleDynamicProperties(config)
    if (isNotEmpty(this.library)) {
      config.setLibrary(this.library)
    }
    config.additionalProperties().putAll(this.additionalProperties)
    const input = new ClientOptInput().config(config)
    const authorizationValues = AuthParser.parse(this.auth)
    const swagger = await Swagger.create({ definition: this.inputSpec })
    return input.opts(new ClientOpts()).swagger(swagger)
  }

  public addDynamicProperty(name, value) {
    this.dynamicProperties.put(name, value.toString())
    return this
  }

  public getDynamicProperties() {
    return this.dynamicProperties
  }

  public handleDynamicProperties(codegenConfig) {
    for (const langCliOption of codegenConfig.cliOptions()) {
      const opt = langCliOption.getOpt()
      if (this.dynamicProperties.containsKey(opt)) {
        codegenConfig
          .additionalProperties()
          .put(opt, this.dynamicProperties.get(opt))
      } else if (this.systemProperties.containsKey(opt)) {
        codegenConfig
          .additionalProperties()
          .put(opt, this.systemProperties.get(opt).toString())
      }
    }
  }

  public setVerboseFlags() {
    if (!this.verbose) {
      return
    }
    log.info(`
VERBOSE MODE: ON. Additional debug options are injected
 - [debugSwagger] prints the swagger specification as interpreted by the codegen
 - [debugModels] prints models passed to the template engine
 - [debugOperations] prints operations passed to the template engine
 - [debugSupportingFiles] prints additional data passed to the template engine`)
    System.setProperty('debugSwagger', '')
    System.setProperty('debugModels', '')
    System.setProperty('debugOperations', '')
    System.setProperty('debugSupportingFiles', '')
  }

  public checkAndSetAdditionalProperty(
    property,
    valueToSet,
    propertyKey?: any
  ) {
    if (arguments.length > 2) {
      if (isNotEmpty(property)) {
        this.additionalProperties.put(propertyKey, valueToSet)
      }
    } else {
      this.checkAndSetAdditionalProperty(property, property, valueToSet)
    }
  }
}
