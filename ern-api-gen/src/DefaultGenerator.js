import Mustache from './java/Mustache'
import System from './java/System'
import OAuth2Definition from './models/auth/OAuth2Definition'
import Json from './java/Json'
import ObjectUtils from './java/ObjectUtils'
import StringUtils from './java/StringUtils'
import StringBuilder from './java/StringBuilder'
import LoggerFactory from './java/LoggerFactory'
import File from './java/File'
import {
  Collections,
  newHashMap,
  newHashSet,
  TreeMap,
  isNotEmptySet,
} from './java/javaUtil'
import IOUtils from './java/IOUtils'
import AbstractGenerator from './AbstractGenerator'
import CodegenConstants from './CodegenConstants'
import InlineModelResolver from './InlineModelResolver'
import ComposedModel from './models/ComposedModel'
import GlobalSupportingFile from './GlobalSupportingFile'
import CodegenIgnoreProcessor from './ignore/CodegenIgnoreProcessor'

const sortOperationId = (a, b) => a.operationId.localeCompare(b.operationId)
const sortClassName = (a, b) => {
  const a1 = (a && a.get('classname')) || '',
    b1 = b && b.get('classname')
  return a1.localeCompare(b1)
}

const sortImports = (a, b) => a.get('import').localeCompare(b.get('import'))

const sortModelName = (a, b) => {
  const a1 = (a && a.get('model')) || '',
    b1 = b && b.get('model')
  const aclassname = a1 && a1.classname,
    bclassname = b1 && b1.classname
  if (aclassname) {
    return aclassname.localeCompare(bclassname)
  }
  if (!bclassname) {
    return 0
  }
  return -1
}

const rethrow = (e, ...args) => {
  Log.trace(e)
  throw new Error(...args)
}

export default class DefaultGenerator extends AbstractGenerator {
  opts(opts) {
    this.__opts = opts
    this.swagger = opts.getSwagger()
    this.config = opts.getConfig()
    this.ignoreProcessor = new CodegenIgnoreProcessor(
      this.config.getOutputDir()
    )
    this.config.additionalProperties().putAll(opts.getOpts().getProperties())
    return this
  }

  generate() {
    let generateApis = null
    let generateModels = null
    let generateSupportingFiles = null
    let generateApiTests = null
    let generateApiDocumentation = null
    let generateModelTests = null
    let generateModelDocumentation = null
    let modelsToGenerate = null
    let apisToGenerate = null
    let supportingFilesToGenerate = null
    if (System.getProperty('models') != null) {
      let modelNames = System.getProperty('models')
      generateModels = true
      if (!(modelNames.length === 0)) {
        modelsToGenerate = newHashSet(...modelNames.split(','))
      }
    }
    if (System.getProperty('apis') != null) {
      let apiNames = System.getProperty('apis')
      generateApis = true
      if (!(apiNames.length === 0)) {
        apisToGenerate = newHashSet(...apiNames.split(','))
      }
    }
    if (System.getProperty('supportingFiles') != null) {
      let supportingFiles = System.getProperty('supportingFiles')
      generateSupportingFiles = true
      if (!(supportingFiles.length === 0)) {
        supportingFilesToGenerate = newHashSet(...supportingFiles.split(','))
      }
    }
    if (System.getProperty('modelTests') != null) {
      generateModelTests = Boolean(System.getProperty('modelTests'))
    }
    if (System.getProperty('modelDocs') != null) {
      generateModelDocumentation = Boolean(System.getProperty('modelDocs'))
    }
    if (System.getProperty('apiTests') != null) {
      generateApiTests = Boolean(System.getProperty('apiTests'))
    }
    if (System.getProperty('apiDocs') != null) {
      generateApiDocumentation = Boolean(System.getProperty('apiDocs'))
    }
    if (
      generateApis == null &&
      generateModels == null &&
      generateSupportingFiles == null
    ) {
      generateApis = true
      generateModels = true
      generateSupportingFiles = true
    } else {
      if (generateApis == null) {
        generateApis = false
      }
      if (generateModels == null) {
        generateModels = false
      }
      if (generateSupportingFiles == null) {
        generateSupportingFiles = false
      }
    }
    if (generateModelTests == null) {
      generateModelTests = true
    }
    if (generateModelDocumentation == null) {
      generateModelDocumentation = true
    }
    if (generateApiTests == null) {
      generateApiTests = true
    }
    if (generateApiDocumentation == null) {
      generateApiDocumentation = true
    }
    this.config
      .additionalProperties()
      .put(CodegenConstants.GENERATE_API_TESTS, generateApiTests)
    this.config
      .additionalProperties()
      .put(CodegenConstants.GENERATE_MODEL_TESTS, generateModelTests)
    if (!generateApiTests && !generateModelTests) {
      this.config
        .additionalProperties()
        .put(CodegenConstants.EXCLUDE_TESTS, true)
    }
    if (this.swagger == null || this.config == null) {
      throw new Error('missing swagger input or config!')
    }
    if (System.getProperty('debugSwagger') != null) {
      Json.prettyPrint(this.swagger)
    }
    let files = []
    this.config.processOpts()
    this.config.preprocessSwagger(this.swagger)
    this.config
      .additionalProperties()
      .put('generatedDate', new Date().toString())
    this.config
      .additionalProperties()
      .put('generatorClass', this.config.constructor.name)
    if (this.swagger.getInfo() != null) {
      let info = this.swagger.getInfo()
      if (info.getTitle() != null) {
        this.config
          .additionalProperties()
          .put('appName', this.config.escapeText(info.getTitle()))
      }
      if (info.getVersion() != null) {
        this.config
          .additionalProperties()
          .put('appVersion', this.config.escapeText(info.getVersion()))
      }
      if (StringUtils.isEmpty(info.getDescription())) {
        this.config
          .additionalProperties()
          .put(
            'appDescription',
            'No descripton provided (generated by Swagger Codegen https://github.com/swagger-api/swagger-codegen)'
          )
      } else {
        this.config
          .additionalProperties()
          .put('appDescription', this.config.escapeText(info.getDescription()))
      }
      if (info.getContact() != null) {
        let contact = info.getContact()
        this.config
          .additionalProperties()
          .put('infoUrl', this.config.escapeText(contact.getUrl()))
        if (contact.getEmail() != null) {
          this.config
            .additionalProperties()
            .put('infoEmail', this.config.escapeText(contact.getEmail()))
        }
      }
      if (info.getLicense() != null) {
        let license = info.getLicense()
        if (license.getName() != null) {
          this.config
            .additionalProperties()
            .put('licenseInfo', this.config.escapeText(license.getName()))
        }
        if (license.getUrl() != null) {
          this.config
            .additionalProperties()
            .put('licenseUrl', this.config.escapeText(license.getUrl()))
        }
      }
      if (info.getVersion() != null) {
        this.config
          .additionalProperties()
          .put('version', this.config.escapeText(info.getVersion()))
      }
      if (info.getTermsOfService() != null) {
        this.config
          .additionalProperties()
          .put(
            'termsOfService',
            this.config.escapeText(info.getTermsOfService())
          )
      }
    }
    if (this.swagger.getVendorExtensions() != null) {
      this.config.vendorExtensions().putAll(this.swagger.getVendorExtensions())
    }
    let hostBuilder = new StringBuilder()
    let scheme
    if (
      this.swagger.getSchemes() != null &&
      this.swagger.getSchemes().length > 0
    ) {
      scheme = this.config.escapeText(this.swagger.getSchemes()[0])
    } else {
      scheme = 'https'
    }
    scheme = this.config.escapeText(scheme)
    hostBuilder.append(scheme)
    hostBuilder.append('://')
    if (this.swagger.getHost() != null) {
      hostBuilder.append(this.swagger.getHost())
    } else {
      hostBuilder.append('localhost')
    }
    if (this.swagger.getBasePath() != null) {
      hostBuilder.append(this.swagger.getBasePath())
    }
    let contextPath = this.config.escapeText(
      this.swagger.getBasePath() == null ? '' : this.swagger.getBasePath()
    )
    let basePath = this.config.escapeText(hostBuilder.toString())
    let basePathWithoutHost = this.config.escapeText(this.swagger.getBasePath())
    let inlineModelResolver = new InlineModelResolver()
    inlineModelResolver.flatten(this.swagger)
    let allOperations = []
    let allModels = []
    let definitions = this.swagger.getDefinitions()
    if (definitions != null) {
      let modelKeys = definitions.keySet()
      if (generateModels) {
        if (isNotEmptySet(modelsToGenerate)) {
          let updatedKeys = newHashSet()
          for (const m of modelKeys) {
            if (modelsToGenerate.contains(m)) {
              updatedKeys.add(m)
            }
          }
          modelKeys = updatedKeys
        }
        let allProcessedModels = new TreeMap(
          null,
          new InheritanceTreeSorter(this, definitions)
        )
        for (const name of modelKeys) {
          try {
            if (this.config.importMapping().containsKey(name)) {
              Log.info('Model ' + name + ' not imported due to import mapping')
              continue
            }
            let model = definitions.get(name)
            let models = this.processModels(
              this.config,
              newHashMap([name, model]),
              definitions
            )

            models.put('classname', this.config.toModelName(name))
            models.putAll(this.config.additionalProperties())
            allProcessedModels.put(name, models)
          } catch (e) {
            rethrow(
              e,
              "Could not process model '" +
                name +
                "'.Please make sure that your schema is correct!",
              e
            )
          }
        }
        allProcessedModels = this.config.postProcessAllModels(
          allProcessedModels
        )
        for (const [name, models] of allProcessedModels) {
          try {
            if (this.config.importMapping().containsKey(name)) {
              continue
            }
            allModels.push(models.get('models').get(0))
            for (const [
              templateName,
              suffix,
            ] of this.config.modelTemplateFiles()) {
              let filename =
                this.config.modelFileFolder() +
                File.separator +
                this.config.toModelFilename(name) +
                suffix
              if (!this.config.shouldOverwrite(filename)) {
                Log.info('Skipped overwriting ' + filename)
                continue
              }
              let written = this.processTemplateToFile(
                models,
                templateName,
                filename
              )
              if (written != null) {
                files.push(written)
              }
            }
            if (generateModelTests) {
              for (const [
                templateName,
                suffix,
              ] of this.config.modelTestTemplateFiles()) {
                let filename =
                  this.config.modelTestFileFolder() +
                  File.separator +
                  this.config.toModelTestFilename(name) +
                  suffix
                if (new File(filename).exists()) {
                  Log.info('File exists. Skipped overwriting ' + filename)
                  continue
                }
                let written = this.processTemplateToFile(
                  models,
                  templateName,
                  filename
                )
                if (written != null) {
                  files.push(written)
                }
              }
            }
            if (generateModelDocumentation) {
              for (const [
                templateName,
                suffix,
              ] of this.config.modelDocTemplateFiles()) {
                let filename =
                  this.config.modelDocFileFolder() +
                  File.separator +
                  this.config.toModelDocFilename(name) +
                  suffix
                if (!this.config.shouldOverwrite(filename)) {
                  Log.info('Skipped overwriting ' + filename)
                  continue
                }
                let written = this.processTemplateToFile(
                  models,
                  templateName,
                  filename
                )
                if (written != null) {
                  files.push(written)
                }
              }
            }
          } catch (e) {
            rethrow(e, "Could not generate model '" + name + "'", e)
          }
        }
      }
    }
    if (System.getProperty('debugModels') != null) {
      Log.info('############ Model info ############')
      Json.prettyPrint(allModels)
    }
    let paths = this.processPaths(this.swagger.getPaths())
    if (generateApis) {
      if (isNotEmptySet(apisToGenerate)) {
        let updatedPaths = new TreeMap()
        for (const [m, p] of paths) {
          if (apisToGenerate.contains(m)) {
            updatedPaths.put(m, p)
          }
        }
        paths = updatedPaths
      }
      for (const [tag, ops] of paths) {
        try {
          ops.sort((one, another) =>
            ObjectUtils.compare(one.operationId, another.operationId)
          )
          const operation = this.processOperations(this.config, tag, ops)
          operation.put('basePath', basePath)
          operation.put('basePathWithoutHost', basePathWithoutHost)
          operation.put('contextPath', contextPath)
          operation.put('baseName', tag)
          operation.put('modelPackage', this.config.modelPackage())
          operation.putAll(this.config.additionalProperties())
          operation.put('classname', this.config.toApiName(tag))
          operation.put('classVarName', this.config.toApiVarName(tag))
          operation.put('importPath', this.config.toApiImport(tag))
          if (isNotEmptySet(this.config.vendorExtensions())) {
            operation.put('vendorExtensions', this.config.vendorExtensions())
          }
          let sortParamsByRequiredFlag = true
          if (
            this.config
              .additionalProperties()
              .containsKey(CodegenConstants.SORT_PARAMS_BY_REQUIRED_FLAG)
          ) {
            sortParamsByRequiredFlag = Boolean(
              this.config
                .additionalProperties()
                .get(CodegenConstants.SORT_PARAMS_BY_REQUIRED_FLAG)
            )
          }
          operation.put('sortParamsByRequiredFlag', sortParamsByRequiredFlag)
          DefaultGenerator.processMimeTypes(
            this.swagger.getConsumes(),
            operation,
            'consumes'
          )
          DefaultGenerator.processMimeTypes(
            this.swagger.getProduces(),
            operation,
            'produces'
          )
          allOperations.add(operation)
          for (let i = 0; i < allOperations.length; i++) {
            let oo = allOperations[i]
            if (i < allOperations.length - 1) {
              oo.put('hasMore', 'true')
            }
          }
          for (const [templateName] of this.config.apiTemplateFiles()) {
            let filename = this.config.apiFilename(templateName, tag)
            if (
              !this.config.shouldOverwrite(filename) &&
              new File(filename).exists()
            ) {
              Log.info('Skipped overwriting ' + filename)
              continue
            }

            if (this.config.shouldGenerateApiFor(templateName, operation)) {
              let written = this.processTemplateToFile(
                operation,
                templateName,
                filename
              )
              if (written != null) {
                files.push(written)
              }
            }
          }

          let requestDataObjects = operation.get('requestDataObjects')
          if (requestDataObjects) {
            for (const requestDataObject of requestDataObjects) {
              for (const [templateName] of this.config.apiDataTemplateFile()) {
                let filename = this.config.apiDataFilename(
                  templateName,
                  requestDataObject.requestDataType
                )
                if (
                  !this.config.shouldOverwrite(filename) &&
                  new File(filename).exists()
                ) {
                  Log.info('Skipped overwriting ' + filename)
                  continue
                }
                let written = this.processTemplateToFile(
                  requestDataObject,
                  templateName,
                  filename
                )
                if (written != null) {
                  files.push(written)
                }
              }
            }
          }

          if (generateApiTests) {
            for (const [templateName] of this.config.apiTestTemplateFiles()) {
              let filename = this.config.apiTestFilename(templateName, tag)
              if (new File(filename).exists()) {
                Log.info('File exists. Skipped overwriting ' + filename)
                continue
              }
              let written = this.processTemplateToFile(
                operation,
                templateName,
                filename
              )
              if (written != null) {
                files.push(written)
              }
            }
          }
          if (generateApiDocumentation) {
            for (const [templateName] of this.config.apiDocTemplateFiles()) {
              let filename = this.config.apiDocFilename(templateName, tag)
              if (
                !this.config.shouldOverwrite(filename) &&
                new File(filename).exists()
              ) {
                Log.info('Skipped overwriting ' + filename)
                continue
              }
              let written = this.processTemplateToFile(
                operation,
                templateName,
                filename
              )
              if (written != null) {
                files.push(written)
              }
            }
          }
        } catch (e) {
          rethrow(e, "Could not generate api file for '" + tag + "'", e)
        }
      }
    }
    if (System.getProperty('debugOperations') != null) {
      Log.info('############ Operation info ############')
      Json.prettyPrint(allOperations)
    }
    let bundle = newHashMap()
    bundle.putAll(this.config.additionalProperties())
    bundle.put('apiPackage', this.config.apiPackage())

    if (this.swagger.getHost() != null) {
      bundle.put('host', this.swagger.getHost())
    }

    bundle.put('swagger', this.swagger)
    bundle.put('basePath', basePath)
    bundle.put('basePathWithoutHost', basePathWithoutHost)
    bundle.put('scheme', scheme)
    bundle.put('contextPath', contextPath)
    // Sort to make stable.
    bundle.put('apiInfo', {
      apis: Collections.sort(allOperations, sortClassName),
    })
    bundle.put('models', Collections.sort(allModels, sortModelName))
    bundle.put(
      'apiFolder',
      /* replace */ this.config
        .apiPackage()
        .split('.')
        .join(File.separatorChar)
    )
    bundle.put('modelPackage', this.config.modelPackage())
    let authMethods = this.config.fromSecurity(
      this.swagger.getSecurityDefinitions()
    )
    if (isNotEmptySet(authMethods)) {
      bundle.put('authMethods', authMethods)
      bundle.put('hasAuthMethods', true)
      let authMethod
      for (authMethod of authMethods) {
        authMethod.hasMore = true
      }
      authMethod.hasMore = false
    }
    if (this.swagger.getExternalDocs() != null) {
      bundle.put('externalDocs', this.swagger.getExternalDocs())
    }
    for (let i = 0; i < allModels.length - 1; i++) {
      let cm = allModels.get(i)
      let m = cm.get('model')
      m.hasMoreModels = true
    }
    this.config.postProcessSupportingFileData(bundle)
    if (System.getProperty('debugSupportingFiles') != null) {
      Log.info('############ Supporting file info ############')
      Json.prettyPrint(bundle)
    }
    if (generateSupportingFiles) {
      for (const support of this.config.supportingFiles()) {
        try {
          let outputFolder = this.config.outputFolder()
          if (StringUtils.isNotEmpty(support.folder)) {
            outputFolder += File.separator + support.folder
          }
          let of = new File(outputFolder)
          if (!of.isDirectory()) {
            of.mkdirs()
          }
          let outputFilename =
            outputFolder + File.separator + (support.destinationFilename || '')
          if (!this.config.shouldOverwrite(outputFilename)) {
            Log.info('Skipped overwriting ' + outputFilename)
            continue
          }
          let templateFile
          if (support != null && support instanceof GlobalSupportingFile) {
            templateFile = this._resolveFile(
              this.config.getCommonTemplateDir(),
              support.templateFile || ''
            )
          } else {
            templateFile = this.getFullTemplateFile(
              this.config,
              support.templateFile
            )
          }
          if (templateFile == null) {
            Log.warn(`Could not resolve ${support.templateFile}`)
            continue
          }
          let shouldGenerate = true
          if (isNotEmptySet(supportingFilesToGenerate)) {
            if (
              supportingFilesToGenerate.contains(support.destinationFilename)
            ) {
              shouldGenerate = true
            } else {
              shouldGenerate = false
            }
          }

          if (shouldGenerate) {
            if (this.ignoreProcessor.allowsFile(new File(outputFilename))) {
              if (templateFile == null) {
                Log.warn(
                  `Could not resolve template file ${support.templateFile}`
                )
              } else if (templateFile.endsWith('.mustache')) {
                let template = this.readTemplate(templateFile)
                let tmpl = Mustache.compiler()
                  .withLoader(new TemplateLocator(this))
                  .defaultValue('')
                  .compile(template, templateFile)
                this.writeToFile(outputFilename, tmpl.execute(bundle))
                files.push(new File(outputFilename))
              } else {
                let input = new File(templateFile)
                let outputFile = new File(outputFilename)
                let out = new File(outputFile)
                Log.info('writing file ' + outputFile)
                IOUtils.copy(input, out)
                files.push(outputFile)
              }
            } else {
              Log.info(
                'Skipped generation of ' +
                  outputFilename +
                  ' due to rule in .swagger-codegen-ignore'
              )
            }
          }
        } catch (e) {
          rethrow(e, "Could not generate supporting file '" + support + "'", e)
        }
      }

      if (this.config.addSwaggerIgnoreFile()) {
        let swaggerCodegenIgnore = '.swagger-codegen-ignore'

        let ignoreFileNameTarget =
          this.config.outputFolder() + File.separator + swaggerCodegenIgnore
        let ignoreFile = new File(ignoreFileNameTarget)
        if (!ignoreFile.exists()) {
          let ignoreFileNameSource = this._resolveFilePath(
            this.config.getCommonTemplateDir(),
            swaggerCodegenIgnore
          )
          let ignoreFileContents = this.readResourceContents(
            ignoreFileNameSource
          )
          try {
            this.writeToFile(ignoreFileNameTarget, ignoreFileContents)
          } catch (e) {
            rethrow(
              e,
              "Could not generate supporting file '" +
                swaggerCodegenIgnore +
                "'",
              e
            )
          }

          files.push(ignoreFile)
        }
      }

      if (this.config.addLicenseFile()) {
        let apache2License = 'LICENSE'
        let licenseFileNameTarget =
          this.config.outputFolder() + File.separator + apache2License
        let licenseFile = new File(licenseFileNameTarget)
        let licenseFileNameSource =
          File.separator +
          this.config.getCommonTemplateDir() +
          File.separator +
          apache2License
        let licenseFileContents = this.readResourceContents(
          licenseFileNameSource
        )
        try {
          this.writeToFile(licenseFileNameTarget, licenseFileContents)
        } catch (e) {
          rethrow(
            e,
            "Could not generate LICENSE file '" + apache2License + "'",
            e
          )
        }

        files.push(licenseFile)
      }
    }
    this.config.processSwagger(this.swagger)
    return files
  }

  processTemplateToFile(templateData, templateName, outputFilename) {
    if (this.ignoreProcessor.allowsFile(new File(outputFilename))) {
      let templateFile = this.getFullTemplateFile(this.config, templateName)
      let template = this.readTemplate(templateFile)
      let tmpl = Mustache.compiler()
        .withLoader(new TemplateLocator(this))
        .defaultValue('')
        .compile(template, templateFile)
      this.writeToFile(outputFilename, tmpl.execute(templateData))
      return new File(outputFilename)
    }
    Log.info(
      'Skipped generation of ' +
        outputFilename +
        ' due to rule in .swagger-codegen-ignore'
    )
    return null
  }

  static processMimeTypes(mimeTypeList, operation, source) {
    if (mimeTypeList != null && mimeTypeList.length) {
      const last = mimeTypeList.length - 1
      const c = mimeTypeList.map((key, i) =>
        newHashMap(['mediaType', key], ['hasMore', i != last])
      )
      operation.put(source, c)
      operation.put(`has${StringUtils.upperFirst(source)}`, true)
    }
  }

  processPaths(paths) {
    let ops = newHashMap()
    for (const path of paths) {
      const resourcePath = path.path
      this.processOperation(resourcePath, 'get', path.getGet(), ops, path)
      this.processOperation(resourcePath, 'head', path.getHead(), ops, path)
      this.processOperation(resourcePath, 'put', path.getPut(), ops, path)
      this.processOperation(resourcePath, 'post', path.getPost(), ops, path)
      this.processOperation(resourcePath, 'delete', path.getDelete(), ops, path)
      this.processOperation(resourcePath, 'patch', path.getPatch(), ops, path)
      this.processOperation(
        resourcePath,
        'options',
        path.getOptions(),
        ops,
        path
      )
      this.processOperation(resourcePath, 'event', path.getEvent(), ops, path)
    }
    return ops
  }

  fromSecurity(name) {
    let map = this.swagger.getSecurityDefinitions()
    if (map == null) {
      return null
    }
    return map.get(name)
  }

  processOperation(resourcePath, httpMethod, operation, operations, path) {
    if (operation == null) return

    if (System.getProperty('debugOperations') != null) {
      Log.info(
        'processOperation: resourcePath= ' +
          resourcePath +
          '\t;' +
          httpMethod +
          ' ' +
          operation +
          '\n'
      )
    }
    let tags = operation.getTags()
    if (tags == null) {
      tags = []
      tags.add('default')
    }
    let operationParameters = newHashSet()
    if (operation.getParameters() != null) {
      for (const parameter of operation.getParameters()) {
        operationParameters.add(DefaultGenerator.generateParameterId(parameter))
      }
      for (const parameter of operation.getParameters()) {
        if (
          !operationParameters.contains(
            DefaultGenerator.generateParameterId(parameter)
          )
        ) {
          operation.addParameter(parameter)
        }
      }
    }
    for (const tag of tags) {
      let co = null
      try {
        co = this.config.fromOperation(
          resourcePath,
          httpMethod,
          operation,
          this.swagger.getDefinitions(),
          this.swagger
        )
        co.tags = [this.config.sanitizeTag(tag)]
        this.config.addOperationToGroup(
          this.config.sanitizeTag(tag),
          resourcePath,
          operation,
          co,
          operations
        )
        let securities = operation.getSecurity()
        if (securities == null && this.swagger.getSecurity() != null) {
          securities = []
          for (const sr of this.swagger.getSecurity()) {
            securities.push(sr.getRequirements())
          }
        }
        if (!isNotEmptySet(securities)) {
          continue
        }
        let authMethods = newHashMap()
        for (const security of securities) {
          for (const securityName of Object.keys(security)) {
            let securityDefinition = this.fromSecurity(securityName)
            if (securityDefinition != null) {
              if (
                securityDefinition != null &&
                securityDefinition instanceof OAuth2Definition
              ) {
                let oauth2Definition = securityDefinition
                let oauth2Operation = new OAuth2Definition()
                oauth2Operation.setType(oauth2Definition.getType())
                oauth2Operation.setAuthorizationUrl(
                  oauth2Definition.getAuthorizationUrl()
                )
                oauth2Operation.setFlow(oauth2Definition.getFlow())
                oauth2Operation.setTokenUrl(oauth2Definition.getTokenUrl())
                oauth2Operation.setScopes(newHashMap())
                for (const scope of security[securityName]) {
                  if (scope in oauth2Definition.getScopes()) {
                    oauth2Operation.addScope(
                      scope,
                      oauth2Definition.getScopes().get(scope)
                    )
                  }
                }
                authMethods.put(securityName, securityDefinition)
              } else {
                authMethods.put(securityName, securityDefinition)
              }
            }
          }
        }
        if (isNotEmptySet(authMethods)) {
          co.authMethods = this.config.fromSecurity(authMethods)
          co.hasAuthMethods = true
        }
      } catch (ex) {
        let msg =
          'Could not process operation:\n  Tag: ' +
          tag +
          '\n  Operation: ' +
          operation.getOperationId() +
          '\n  Resource: ' +
          httpMethod +
          ' ' +
          resourcePath +
          '\n  Definitions: ' +
          this.swagger.getDefinitions() +
          '\n  Exception: ' +
          ex.message
        rethrow(ex, msg, ex)
      }
    }
  }

  static generateParameterId(parameter) {
    return parameter.getName() + ':' + parameter.getIn()
  }

  processOperations(config, tag, ops) {
    let counter = 0
    Collections.sort(ops, sortOperationId)
    const opIds = newHashSet()
    for (const op of ops) {
      let opId = op.nickname
      if (opIds.contains(opId)) {
        counter++
        op.nickname += '_' + counter
      }
      opIds.add(opId)
    }

    const allImports = newHashSet()

    for (const op of ops) {
      allImports.addAll(op.imports)
    }

    const imports = []

    for (const nextImport of allImports) {
      let mapping = config.importMapping().get(nextImport)
      if (mapping == null) {
        mapping = config.toModelImport(nextImport)
      }
      if (mapping != null) {
        imports.push(newHashMap(['import', mapping]))
      }
    }
    Collections.sort(imports, sortImports)

    const operations = newHashMap(
      ['imports', imports],
      ['hasImport', imports.length > 0],
      [
        'operations',
        newHashMap(
          ['classname', config.toApiName(tag)],
          ['pathPrefix', config.toApiVarName(tag)],
          ['operation', ops]
        ),
      ],
      ['package', config.apiPackage()]
    )

    config.postProcessOperations(operations)
    // perhaps more where added?
    let lastOp
    for (const lastOp of operations.get('operations').get('operation')) {
      lastOp.hasMore = true
    }
    if (lastOp) {
      lastOp.hasMore = false
    }

    return operations
  }

  processModels(config, definitions, allDefinitions) {
    const models = []
    const imports = []

    const objs = newHashMap(
      ['package', config.modelPackage()],
      ['models', models],
      ['imports', imports]
    )

    const allImports = newHashSet()
    const importSet = newHashSet()

    for (const [key, mm] of definitions) {
      const cm = config.fromModel(key, mm, allDefinitions)
      models.push(
        newHashMap(
          ['model', cm],
          ['importPath', config.toModelImport(cm.classname)]
        )
      )
      allImports.addAll(cm.imports)
    }
    for (const nextImport of allImports) {
      let mapping = config.importMapping().get(nextImport)
      if (mapping == null) {
        mapping = config.toModelImport(nextImport)
      }
      if (mapping != null && !config.defaultIncludes().contains(mapping)) {
        importSet.add(mapping)
      }
      mapping = config.instantiationTypes().get(nextImport)
      if (mapping != null && !config.defaultIncludes().contains(mapping)) {
        importSet.add(mapping)
      }
    }
    for (const s of importSet) {
      imports.add(newHashMap(['import', s]))
    }
    config.postProcessModels(objs)

    return objs
  }
}

class InheritanceTreeSorter {
  constructor(__parent, definitions) {
    this.definitions = definitions
    this.__parent = __parent
  }

  compare(o1, o2) {
    let model1 = this.definitions.get(o1)
    let model2 = this.definitions.get(o2)
    let model1InheritanceDepth = this.getInheritanceDepth(model1)
    let model2InheritanceDepth = this.getInheritanceDepth(model2)
    if (model1InheritanceDepth === model2InheritanceDepth) {
      return ObjectUtils.compare(
        this.__parent.config.toModelName(o1),
        this.__parent.config.toModelName(o2)
      )
    } else if (model1InheritanceDepth > model2InheritanceDepth) {
      return 1
    } else {
      return -1
    }
  }

  getInheritanceDepth(model) {
    let inheritanceDepth = 0
    let parent = this.getParent(model)
    while (parent != null) {
      inheritanceDepth++
      parent = this.getParent(parent)
    }
    return inheritanceDepth
  }

  getParent(model) {
    if (model != null && model instanceof ComposedModel) {
      let parent = model.getParent()
      if (parent != null) {
        return this.definitions.get(parent.getReference())
      }
    }
    return null
  }
}

class TemplateLocator {
  constructor(__parent) {
    this.__parent = __parent
  }

  getTemplate(name) {
    return this.__parent.getTemplateReader(
      this.__parent.getFullTemplateFile(
        this.__parent.config,
        name + '.mustache'
      )
    )
  }
}

const Log = LoggerFactory.getLogger(DefaultGenerator)
