/* tslint:disable:variable-name */
import CliOption from '../CliOption'
import CodegenConstants from '../CodegenConstants'
import CodegenType from '../CodegenType'
import DefaultCodegen from '../DefaultCodegen'
import { ArrayProperty, MapProperty } from '../models/properties'
import StringUtils, { capitalizeFully } from '../java/StringUtils'
import File from '../java/File'
import { HeaderParameter } from '../models/parameters'
import { parseBoolean } from '../java/BooleanHelper'
import Pattern from '../java/Pattern'
import StringBuilder from '../java/StringBuilder'
import { log } from 'ern-core'
import { newHashMap, newHashSet } from '../java/javaUtil'

const PATH_PARAM_PATTERN = Pattern.compile('\\{[a-zA-Z_\\-]+\\}')

const ArrayUtils = {
  contains(arr, val) {
    return arr && arr.indexOf(val) > -1
  },
}
export default class SwiftCodegen extends DefaultCodegen {
  public static readonly PROJECT_NAME = 'projectName'
  public static readonly RESPONSE_AS = 'responseAs'
  public static readonly UNWRAP_REQUIRED = 'unwrapRequired'
  public static readonly POD_SOURCE = 'podSource'
  public static readonly POD_AUTHORS = 'podAuthors'
  public static readonly POD_SOCIAL_MEDIA_URL = 'podSocialMediaURL'
  public static readonly POD_DOCSET_URL = 'podDocsetURL'
  public static readonly POD_LICENSE = 'podLicense'
  public static readonly POD_HOMEPAGE = 'podHomepage'
  public static readonly POD_SUMMARY = 'podSummary'
  public static readonly POD_DESCRIPTION = 'podDescription'
  public static readonly POD_SCREENSHOTS = 'podScreenshots'
  public static readonly POD_DOCUMENTATION_URL = 'podDocumentationURL'
  public static readonly SWIFT_USE_API_NAMESPACE = 'swiftUseApiNamespace'
  public static readonly DEFAULT_POD_AUTHORS = 'Swagger Codegen'
  public static readonly LIBRARY_PROMISE_KIT = 'PromiseKit'
  public static readonly RESPONSE_LIBRARIES = [SwiftCodegen.LIBRARY_PROMISE_KIT]

  public static normalizePath(path) {
    const builder = StringBuilder()

    let cursor = 0
    // Matcher matcher = PATH_PARAM_PATTERN.matcher(path);
    const matcher = PATH_PARAM_PATTERN.matcher(path)
    let found = matcher.find()
    while (found) {
      const stringBeforeMatch = path.substring(cursor, matcher.start())
      builder.append(stringBeforeMatch)

      let group = matcher.group().substring(1, matcher.group().length - 1)
      group = DefaultCodegen.camelize(group, true)
      builder
        .append('{')
        .append(group)
        .append('}')

      cursor = matcher.end()
      found = matcher.find()
    }

    const stringAfterMatch = path.substring(cursor)
    builder.append(stringAfterMatch)

    return builder.toString()
  }

  public projectName = 'SwaggerClient'
  public responseAs = []
  public sourceFolder = 'Classes' + File.separator + 'Swaggers'
  public unwrapRequired = false
  public swiftUseApiNamespace = false
  public __outputFolder = 'generated-code' + File.separator + 'swift'
  public __embeddedTemplateDir = 'swift'
  public __templateDir = 'swift'
  public __apiPackage = File.separator + 'APIs'
  public __modelPackage = File.separator + 'Models'
  public __typeMapping = newHashMap(
    ['array', 'Array'],
    ['List', 'Array'],
    ['map', 'Dictionary'],
    ['date', 'NSDate'],
    ['Date', 'NSDate'],
    ['DateTime', 'NSDate'],
    ['boolean', 'Bool'],
    ['string', 'String'],
    ['char', 'Character'],
    ['short', 'Int'],
    ['int', 'Int32'],
    ['long', 'Int64'],
    ['integer', 'Int32'],
    ['Integer', 'Int32'],
    ['float', 'Float'],
    ['number', 'Double'],
    ['double', 'Double'],
    ['object', 'AnyObject'],
    ['file', 'NSURL'],
    ['binary', 'NSData'],
    ['ByteArray', 'NSData'],
    ['UUID', 'NSUUID']
  )
  public __defaultIncludes = newHashSet(
    'NSData',
    'NSDate',
    'NSURL',
    'NSUUID',
    'Array',
    'Dictionary',
    'Set',
    'Any',
    'Empty',
    'AnyObject'
  )
  public __reservedWords = newHashSet(
    'Int',
    'Int32',
    'Int64',
    'Int64',
    'Float',
    'Double',
    'Bool',
    'Void',
    'String',
    'Character',
    'AnyObject',
    'class',
    'Class',
    'break',
    'as',
    'associativity',
    'deinit',
    'case',
    'dynamicType',
    'convenience',
    'enum',
    'continue',
    'false',
    'dynamic',
    'extension',
    'default',
    'is',
    'didSet',
    'func',
    'do',
    'nil',
    'final',
    'import',
    'else',
    'self',
    'get',
    'init',
    'fallthrough',
    'Self',
    'infix',
    'internal',
    'for',
    'super',
    'inout',
    'let',
    'if',
    'true',
    'lazy',
    'operator',
    'in',
    'COLUMN',
    'left',
    'private',
    'return',
    'FILE',
    'mutating',
    'protocol',
    'switch',
    'FUNCTION',
    'none',
    'public',
    'where',
    'LINE',
    'nonmutating',
    'static',
    'while',
    'optional',
    'struct',
    'override',
    'subscript',
    'postfix',
    'typealias',
    'precedence',
    'var',
    'prefix',
    'Protocol',
    'required',
    'right',
    'set',
    'Type',
    'unowned',
    'weak'
  )
  public __importMapping = newHashMap()
  public __languageSpecificPrimitives = newHashSet(
    'Int',
    'Int32',
    'Int64',
    'Float',
    'Double',
    'Bool',
    'Void',
    'String',
    'Character',
    'AnyObject'
  )

  constructor() {
    super()
    this.__modelTemplateFiles.put('model.mustache', '.swift')
    this.__apiTemplateFiles.put('api.mustache', '.swift')
  }

  public initalizeCliOptions() {
    super.initalizeCliOptions()
    this.__cliOptions.push(
      new CliOption(SwiftCodegen.PROJECT_NAME, 'Project name in Xcode')
    )
    this.__cliOptions.push(
      new CliOption(
        SwiftCodegen.RESPONSE_AS,
        'Optionally use libraries to manage response.  Currently ' +
          StringUtils.join(SwiftCodegen.RESPONSE_LIBRARIES, ', ') +
          ' are available.'
      )
    )
    this.__cliOptions.push(
      new CliOption(
        SwiftCodegen.UNWRAP_REQUIRED,
        "Treat 'required' properties in response as non-optional (which would crash the app if api returns null as opposed to required option specified in json schema"
      )
    )
    this.__cliOptions.push(
      new CliOption(
        SwiftCodegen.POD_SOURCE,
        'Source information used for Podspec'
      )
    )
    this.__cliOptions.push(
      new CliOption(CodegenConstants.POD_VERSION, 'Version used for Podspec')
    )
    this.__cliOptions.push(
      new CliOption(SwiftCodegen.POD_AUTHORS, 'Authors used for Podspec')
    )
    this.__cliOptions.push(
      new CliOption(
        SwiftCodegen.POD_SOCIAL_MEDIA_URL,
        'Social Media URL used for Podspec'
      )
    )
    this.__cliOptions.push(
      new CliOption(SwiftCodegen.POD_DOCSET_URL, 'Docset URL used for Podspec')
    )
    this.__cliOptions.push(
      new CliOption(SwiftCodegen.POD_LICENSE, 'License used for Podspec')
    )
    this.__cliOptions.push(
      new CliOption(SwiftCodegen.POD_HOMEPAGE, 'Homepage used for Podspec')
    )
    this.__cliOptions.push(
      new CliOption(SwiftCodegen.POD_SUMMARY, 'Summary used for Podspec')
    )
    this.__cliOptions.push(
      new CliOption(
        SwiftCodegen.POD_DESCRIPTION,
        'Description used for Podspec'
      )
    )
    this.__cliOptions.push(
      new CliOption(
        SwiftCodegen.POD_SCREENSHOTS,
        'Screenshots used for Podspec'
      )
    )
    this.__cliOptions.push(
      new CliOption(
        SwiftCodegen.POD_DOCUMENTATION_URL,
        'Documentation URL used for Podspec'
      )
    )
    this.__cliOptions.push(
      new CliOption(
        SwiftCodegen.SWIFT_USE_API_NAMESPACE,
        'Flag to make all the API classes inner-class of {{projectName}}API'
      )
    )
  }

  public getTag() {
    return CodegenType.CLIENT
  }

  public getName() {
    return 'Swift'
  }

  public getHelp() {
    return 'Generates a swift client library.'
  }

  public processOpts() {
    super.processOpts()
    if (this.__additionalProperties.containsKey(SwiftCodegen.PROJECT_NAME)) {
      this.setProjectName(
        this.__additionalProperties.get(SwiftCodegen.PROJECT_NAME)
      )
    } else {
      this.__additionalProperties.put(
        SwiftCodegen.PROJECT_NAME,
        this.projectName
      )
    }
    this.sourceFolder = this.projectName + File.separator + this.sourceFolder
    if (this.__additionalProperties.containsKey(SwiftCodegen.UNWRAP_REQUIRED)) {
      this.setUnwrapRequired(
        parseBoolean(
          this.__additionalProperties.get(SwiftCodegen.UNWRAP_REQUIRED)
        )
      )
    }
    this.__additionalProperties.put(
      SwiftCodegen.UNWRAP_REQUIRED,
      this.unwrapRequired
    )
    if (this.__additionalProperties.containsKey(SwiftCodegen.RESPONSE_AS)) {
      const responseAsObject = this.__additionalProperties.get(
        SwiftCodegen.RESPONSE_AS
      )
      if (typeof responseAsObject === 'string') {
        this.setResponseAs(responseAsObject.split(','))
      } else {
        this.setResponseAs(responseAsObject)
      }
    }
    this.__additionalProperties.put(SwiftCodegen.RESPONSE_AS, this.responseAs)
    if (
      ArrayUtils.contains(this.responseAs, SwiftCodegen.LIBRARY_PROMISE_KIT)
    ) {
      this.__additionalProperties.put('usePromiseKit', true)
    }
    if (
      this.__additionalProperties.containsKey(
        SwiftCodegen.SWIFT_USE_API_NAMESPACE
      )
    ) {
      this.swiftUseApiNamespace = parseBoolean(
        this.__additionalProperties.get(SwiftCodegen.SWIFT_USE_API_NAMESPACE)
      )
    }
    this.__additionalProperties.put(
      SwiftCodegen.SWIFT_USE_API_NAMESPACE,
      this.swiftUseApiNamespace
    )
    if (!this.__additionalProperties.containsKey(SwiftCodegen.POD_AUTHORS)) {
      this.__additionalProperties.put(
        SwiftCodegen.POD_AUTHORS,
        SwiftCodegen.DEFAULT_POD_AUTHORS
      )
    }
  }

  public isReservedWord(word) {
    return word != null && this.__reservedWords.contains(word)
  }

  public escapeReservedWord(name) {
    return '_' + name
  }

  public modelFileFolder() {
    return (
      this.__outputFolder +
      File.separator +
      this.sourceFolder +
      this.modelPackage()
        .split('.')
        .join(File.separatorChar)
    )
  }

  public apiFileFolder() {
    return (
      this.__outputFolder +
      File.separator +
      this.sourceFolder +
      this.apiPackage()
        .split('.')
        .join(File.separatorChar)
    )
  }

  public getTypeDeclaration(p) {
    if (p != null) {
      if (p instanceof ArrayProperty) {
        const inner = p.getItems()
        return '[' + this.getTypeDeclaration(inner) + ']'
      } else if (p instanceof MapProperty) {
        const inner = p.getAdditionalProperties()
        return '[String:' + this.getTypeDeclaration(inner) + ']'
      }
    }
    return super.getTypeDeclaration(p)
  }

  public getSwaggerType(p) {
    const swaggerType = super.getSwaggerType(p)
    let type = null
    if (this.__typeMapping.containsKey(swaggerType)) {
      type = this.__typeMapping.get(swaggerType)
      if (
        this.__languageSpecificPrimitives.contains(type) ||
        this.__defaultIncludes.contains(type)
      ) {
        return type
      }
    } else {
      type = swaggerType
    }
    return this.toModelName(type)
  }

  public isDataTypeBinary(dataType) {
    return dataType != null && dataType === 'NSData'
  }

  /**
   * Output the proper model name (capitalized)
   *
   * @param name the name of the model
   * @return capitalized model name
   */
  public toModelName(name) {
    name = this.sanitizeName(name)
    if (!StringUtils.isEmpty(this.modelNameSuffix)) {
      name = name + '_' + this.modelNameSuffix
    }
    if (!StringUtils.isEmpty(this.modelNamePrefix)) {
      name = this.modelNamePrefix + '_' + name
    }
    name = DefaultCodegen.camelize(name)
    if (this.isReservedWord(name)) {
      const modelName = 'Model' + name
      log.warn(
        `${name} (reserved word) cannot be used as model name. Renamed to ${modelName}`
      )
      return modelName
    }
    if (name.match('^\\d.*')) {
      const modelName = 'Model' + name
      log.warn(
        `${name} (model name starts with number) cannot be used as model name. Renamed to ${modelName}`
      )
      return modelName
    }
    return name
  }

  /**
   * Return the capitalized file name of the model
   *
   * @param name the model name
   * @return the file name of the model
   */
  public toModelFilename(name) {
    return this.toModelName(name)
  }

  public toDefaultValue(p) {
    return null
  }

  public toInstantiationType(p) {
    if (p instanceof MapProperty) {
      const inner = this.getSwaggerType(p.getAdditionalProperties())
      return '[String:' + inner + ']'
    } else if (p instanceof ArrayProperty) {
      const inner = this.getSwaggerType(p.getItems())
      return '[' + inner + ']'
    }

    return null
  }

  public fromProperty(name, p) {
    const codegenProperty = super.fromProperty(name, p)
    if (codegenProperty.isContainer) {
      return codegenProperty
    }
    if (codegenProperty.isEnum) {
      const swiftEnums: any[] = []
      const values = codegenProperty.allowableValues.get('values')
      for (const value of values) {
        swiftEnums.push(
          newHashMap(
            ['enum', this.toSwiftyEnumName('' + value)],
            ['raw', '' + value]
          )
        )
      }
      codegenProperty.allowableValues.put('values', swiftEnums)
      codegenProperty.datatypeWithEnum = this.toEnumName(codegenProperty)
      if (
        this.isReservedWord(codegenProperty.datatypeWithEnum) ||
        this.toVarName(name) === codegenProperty.datatypeWithEnum
      ) {
        codegenProperty.datatypeWithEnum =
          codegenProperty.datatypeWithEnum + 'Enum'
      }
    }
    return codegenProperty
  }

  public toSwiftyEnumName(value) {
    if (value.match('[A-Z][a-z0-9]+[a-zA-Z0-9]*')) {
      return value
    }

    return capitalizeFully(value.toLowerCase()).replace(
      new RegExp('[-_  :]', 'g'),
      ''
    )
  }

  public toApiName(name) {
    if (name.length === 0) {
      return 'DefaultAPI'
    }
    return this.initialCaps(name) + 'API'
  }

  public toOperationId(operationId) {
    operationId = DefaultCodegen.camelize(this.sanitizeName(operationId), true)
    if (StringUtils.isEmpty(operationId)) {
      throw new Error('Empty method name (operationId) not allowed')
    }
    if (this.isReservedWord(operationId)) {
      const newOperationId = DefaultCodegen.camelize(
        'call_' + operationId,
        true
      )
      log.warn(
        `${operationId} (reserved word) cannot be used as method name. Renamed to ${newOperationId}`
      )
      return newOperationId
    }
    return operationId
  }

  public toVarName(name) {
    name = this.sanitizeName(name)
    if (name.match('^[A-Z_]*$')) {
      return name
    }
    name = DefaultCodegen.camelize(name, true)
    if (this.isReservedWord(name) || name.match('^\\d.*')) {
      name = this.escapeReservedWord(name)
    }
    return name
  }

  public toParamName(name) {
    name = this.sanitizeName(name)
    name = name.replace(new RegExp('-', 'g'), '_')
    if (name.match('^[A-Z_]*$')) {
      return name
    }
    name = DefaultCodegen.camelize(name, true)
    if (this.isReservedWord(name) || name.match('^\\d.*')) {
      name = this.escapeReservedWord(name)
    }
    return name
  }

  public fromOperation(path, httpMethod, operation, definitions, swagger) {
    if (arguments.length > 4) {
      path = SwiftCodegen.normalizePath(path)
      let parameters = operation.getParameters()
      parameters = parameters.filter(isHeader)
      operation.setParameters(parameters)
      return super.fromOperation(
        path,
        httpMethod,
        operation,
        definitions,
        swagger
      )
    }
    return super.fromOperation(path, httpMethod, operation, definitions)
  }

  public setProjectName(projectName) {
    this.projectName = projectName
  }

  public setUnwrapRequired(unwrapRequired) {
    this.unwrapRequired = unwrapRequired
  }

  public setResponseAs(responseAs) {
    this.responseAs = responseAs
  }

  public toEnumValue(value, datatype) {
    if ('int' === datatype || 'double' === datatype || 'float' === datatype) {
      return value
    } else {
      return "'" + this.escapeText(value) + "'"
    }
  }

  public toEnumDefaultValue(value, datatype) {
    return datatype + '_' + value
  }

  public toEnumVarName(name, datatype) {
    if ('int' === datatype || 'double' === datatype || 'float' === datatype) {
      let varName = String(name)
      varName = varName.replace(new RegExp('-', 'g'), 'MINUS_')
      varName = varName.replace(new RegExp('\\+', 'g'), 'PLUS_')
      varName = varName.replace(new RegExp('\\.', 'g'), '_DOT_')
      return varName
    }
    let enumName = this.sanitizeName(
      DefaultCodegen.underscore(name).toUpperCase()
    )
    enumName = enumName.replace(/^_/, '')
    enumName = enumName.replace(/_$/, '')
    if (enumName.match('\\d.*')) {
      return '_' + enumName
    } else {
      return enumName
    }
  }

  public toEnumName(property) {
    const enumName = this.toModelName(property.name)
    if (enumName.match('\\d.*')) {
      return '_' + enumName
    } else {
      return enumName
    }
  }

  public postProcessModels(objs) {
    return this.postProcessModelsEnum(objs)
  }

  public escapeQuotationMark(input) {
    return input.split('"').join('')
  }

  public escapeUnsafeCharacters(input) {
    return input
      .split('*/')
      .join('*_/')
      .split('/*')
      .join('/_*')
  }
}

const isHeader = parameter => !(parameter instanceof HeaderParameter)
