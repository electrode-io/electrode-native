/* tslint:disable:variable-name */
import ExampleGenerator from './examples/ExampleGenerator'
import CliOption from './CliOption'
import CodegenConstants from './CodegenConstants'
import CodegenModelFactory from './CodegenModelFactory'
import CodegenModelType from './CodegenModelType'
import camelCase from 'lodash/camelCase'
import factory from './models/factory'
import {
  AbstractNumericProperty,
  ArrayProperty,
  BaseIntegerProperty,
  BinaryProperty,
  BooleanProperty,
  ByteArrayProperty,
  DateProperty,
  DateTimeProperty,
  DecimalProperty,
  DoubleProperty,
  FloatProperty,
  IntegerProperty,
  LongProperty,
  MapProperty,
  RefProperty,
  StringProperty,
  UUIDProperty,
} from './models/properties'
import {
  SerializableParameter,
  Parameter,
  BodyParameter,
  CookieParameter,
  FormParameter,
  HeaderParameter,
  PathParameter,
  QueryParameter,
} from './models/parameters'
import System from './java/System'
import LoggerFactory from './java/LoggerFactory'
import File from './java/File'
import StringBuilder from './java/StringBuilder'
import {
  Lists,
  Collections,
  newHashSet,
  newHashMap,
  asMap,
  isNotEmptySet,
} from './java/javaUtil'
import StringUtils from './java/StringUtils'
import Json from './java/Json'
import StringEscapeUtils from './java/StringEscapeUtils'
import ArrayModel from './models/ArrayModel'
import ComposedModel from './models/ComposedModel'
import ModelImpl from './models/ModelImpl'
import RefModel from './models/RefModel'
import ApiKeyAuthDefinition from './models/auth/ApiKeyAuthDefinition'
import BasicAuthDefinition from './models/auth/BasicAuthDefinition'
import { In } from './models/auth/In'
import PropertyBuilder from './models/PropertyBuilder'
import path from 'path'

const _count2 = (_, i) => ++i
const COMMON_PREFIX_RE = new RegExp('[a-zA-Z0-9]+\\z', 'g')
const sortByFlag = (one, another) => {
  const oneRequired = one.required == null ? false : one.required
  const anotherRequired = another.required == null ? false : another.required
  if (oneRequired === anotherRequired) {
    return 0
  } else if (oneRequired) {
    return -1
  } else {
    return 1
  }
}
export default class DefaultCodegen {
  public static addHasMore(objs) {
    if (objs == null) {
      return
    }

    if (Array.isArray(objs)) {
      for (let i = 0, l = objs.length, lm = l - 1; i < l; i++) {
        if (i > 0) {
          objs[i].secondaryParam = true
        }
        objs[i].hasMore = i < lm
      }
      return objs
    }
    // what? insanity
    for (let i = 0; i < objs.size - 1; i++) {
      if (i > 0) {
        objs.put('secondaryParam', true)
      }
      objs.put('hasMore', i < objs.size - 1)
    }
    return objs
  }

  /**
   * Underscore the given word.
   * Copied from Twitter elephant bird
   * https://github.com/twitter/elephant-bird/blob/master/core/src/main/java/com/twitter/elephantbird/util/Strings.java
   *
   * @param word The word
   * @return The underscored version of the word
   */
  public static underscore(word) {
    const firstPattern = '([A-Z]+)([A-Z][a-z])'
    const secondPattern = '([a-z\\d])([A-Z])'
    const replacementPattern = '$1_$2'
    word = word.replace(new RegExp('\\.', 'g'), '/')
    word = word.replace(new RegExp('\\$', 'g'), '__')
    word = word.replace(new RegExp(firstPattern, 'g'), replacementPattern)
    word = word.replace(new RegExp(secondPattern, 'g'), replacementPattern)
    word = word.split('-').join('_')
    word = word.toLowerCase()
    return word
  }

  /**
   * Camelize name (parameter, property, method, etc)
   *
   * @param word string to be camelize
   * @param lowercaseFirstLetter lower case for first letter if set to true
   * @return camelized string
   */
  public static camelize(word, lowercaseFirstLetter = false) {
    word = camelCase(word)
    return (
      word &&
      word[0][lowercaseFirstLetter ? 'toLowerCase' : 'toUpperCase']() +
        word.substring(1)
    )
  }

  /**
   * Generate the next name for the given name, i.e. append "2" to the base name if not ending with a number,
   * otherwise increase the number by 1. For example:
   * status    => status2
   * status2   => status3
   * myName100 => myName101
   *
   * @param name The base name
   * @return The next name for the base name
   */
  public static generateNextName(name) {
    const re = /(\d{1,})/
    if (re.test(name)) {
      return name.replace(re, _count2)
    }
    return name + '2'
  }

  public __fileSuffix
  public __templateDir
  public __embeddedTemplateDir
  public __outputFolder = ''
  public __languageSpecificPrimitives = newHashSet()
  public __modelPackage = ''
  public __apiPackage = ''
  public modelNamePrefix = ''
  public modelNameSuffix = ''
  public __testPackage = ''
  public __apiTemplateFiles = newHashMap()
  public __apiDataTemplateFile = newHashMap()
  public __modelTemplateFiles = newHashMap()
  public __apiTestTemplateFiles = newHashMap()
  public __modelTestTemplateFiles = newHashMap()
  public __apiDocTemplateFiles = newHashMap()
  public __modelDocTemplateFiles = newHashMap()
  public commonTemplateDir = '_common'
  public __additionalProperties = newHashMap()
  public __vendorExtensions = newHashMap()
  public __supportingFiles: any[] = []
  public __cliOptions: any[] = []
  public __supportedLibraries = newHashMap()
  public sortParamsByRequiredFlag = true
  public ensureUniqueParams = true
  public specialCharReplacements = newHashMap()
  public skipOverwrite = false
  public supportsInheritance = false
  public __defaultIncludes = newHashSet(
    'double',
    'int',
    'long',
    'short',
    'char',
    'float',
    'String',
    'boolean',
    'Boolean',
    'Double',
    'Void',
    'Integer',
    'Long',
    'Float'
  )
  public __typeMapping = newHashMap(
    ['array', 'List'],
    ['map', 'Map'],
    ['List', 'List'],
    ['boolean', 'Boolean'],
    ['string', 'String'],
    ['int', 'Integer'],
    ['float', 'Float'],
    ['number', 'BigDecimal'],
    ['DateTime', 'Date'],
    ['long', 'Long'],
    ['short', 'Short'],
    ['char', 'String'],
    ['double', 'Double'],
    ['object', 'Object'],
    ['integer', 'Integer'],
    ['ByteArray', 'byte[]'],
    ['binary', 'byte[]']
  )
  public __instantiationTypes = newHashMap()
  public __reservedWords = newHashSet()
  public __importMapping = newHashMap(
    ['BigDecimal', 'java.math.BigDecimal'],
    ['UUID', 'java.util.UUID'],
    ['File', 'java.io.File'],
    ['Date', 'java.util.Date'],
    ['Timestamp', 'java.sql.Timestamp'],
    ['Map', 'java.util.Map'],
    ['HashMap', 'java.util.HashMap'],
    ['Array', 'java.util.List'],
    ['ArrayList', 'java.util.ArrayList'],
    ['List', 'java.util.*'],
    ['Set', 'java.util.*'],
    ['DateTime', 'org.joda.time.*'],
    ['LocalDateTime', 'org.joda.time.*'],
    ['LocalDate', 'org.joda.time.*'],
    ['LocalTime', 'org.joda.time.*']
  )
  public containerType
  public library
  public gitUserId
  public gitRepoId
  public releaseNote
  public httpUserAgent

  /**
   * Default constructor.
   * This method will map between Swagger type and language-specified type, as well as mapping
   * between Swagger type and the corresponding import statement for the language. This will
   * also add some language specified CLI options, if any.
   *
   *
   * returns string presentation of the example path (it's a constructor)
   */
  constructor() {
    this.initalizeCliOptions()
    this.initalizeSpecialCharacterMapping()
  }

  public initalizeCliOptions() {
    this.__cliOptions.push(
      CliOption.newBoolean(
        CodegenConstants.SORT_PARAMS_BY_REQUIRED_FLAG,
        CodegenConstants.SORT_PARAMS_BY_REQUIRED_FLAG_DESC
      ).defaultValue('true')
    )
    this.__cliOptions.push(
      CliOption.newBoolean(
        CodegenConstants.ENSURE_UNIQUE_PARAMS,
        CodegenConstants.ENSURE_UNIQUE_PARAMS_DESC
      ).defaultValue('true')
    )
  }

  public cliOptions() {
    return this.__cliOptions
  }

  public processOpts() {
    if (
      this.__additionalProperties.containsKey(CodegenConstants.TEMPLATE_DIR)
    ) {
      this.setTemplateDir(
        this.__additionalProperties.get(CodegenConstants.TEMPLATE_DIR)
      )
    }
    if (
      this.__additionalProperties.containsKey(CodegenConstants.MODEL_PACKAGE)
    ) {
      this.setModelPackage(
        this.__additionalProperties.get(CodegenConstants.MODEL_PACKAGE)
      )
    }
    if (this.__additionalProperties.containsKey(CodegenConstants.API_PACKAGE)) {
      this.setApiPackage(
        this.__additionalProperties.get(CodegenConstants.API_PACKAGE)
      )
    }
    if (
      this.__additionalProperties.containsKey(
        CodegenConstants.SORT_PARAMS_BY_REQUIRED_FLAG
      )
    ) {
      this.setSortParamsByRequiredFlag(
        Boolean(
          this.__additionalProperties.get(
            CodegenConstants.SORT_PARAMS_BY_REQUIRED_FLAG
          )
        )
      )
    }
    if (
      this.__additionalProperties.containsKey(
        CodegenConstants.ENSURE_UNIQUE_PARAMS
      )
    ) {
      this.setEnsureUniqueParams(
        Boolean(
          this.__additionalProperties.get(CodegenConstants.ENSURE_UNIQUE_PARAMS)
        )
      )
    }
    if (
      this.__additionalProperties.containsKey(
        CodegenConstants.MODEL_NAME_PREFIX
      )
    ) {
      this.setModelNamePrefix(
        this.__additionalProperties.get(CodegenConstants.MODEL_NAME_PREFIX)
      )
    }
    if (
      this.__additionalProperties.containsKey(
        CodegenConstants.MODEL_NAME_SUFFIX
      )
    ) {
      this.setModelNameSuffix(
        this.__additionalProperties.get(CodegenConstants.MODEL_NAME_SUFFIX)
      )
    }
  }

  public addLicenseFile() {
    return true
  }

  public addSwaggerIgnoreFile() {
    return true
  }

  public postProcessAllModels(objs) {
    if (this.supportsInheritance) {
      const allModels = newHashMap()
      for (const [key, inner] of objs) {
        const modelName = this.toModelName(key)
        for (const mo of inner.get('models')) {
          allModels.put(modelName, mo.get('model'))
        }
      }

      for (const [key, cm] of allModels) {
        if (cm.parent != null) {
          cm.parentModel = allModels.get(cm.parent)
        }
        if (isNotEmptySet(cm.interfaces)) {
          cm.interfaceModels = []
          for (const intf of cm.interfaces) {
            const intfModel = allModels.get(intf)
            if (intfModel != null) {
              cm.interfaceModels.push(intfModel)
            }
          }
        }
      }
    }
    return objs
  }

  public postProcessModels(objs) {
    return objs
  }

  /**
   * post process enum defined in model's properties
   *
   * @param objs Map of models
   * @return maps of models with better enum support
   */
  public postProcessModelsEnum(objs) {
    const models = objs.get('models')
    for (const mo of models) {
      const cm = mo.get('model')
      if (cm.isEnum && cm.allowableValues != null) {
        const allowableValues = cm.allowableValues
        const values = allowableValues.get('values')
        const enumVars: any[] = []
        const commonPrefix = this.findCommonPrefixOfVars(values)
        const truncateIdx = commonPrefix.length
        cm.allowableValues.put('enumVars', enumVars)

        for (const value of values) {
          let enumName
          if (truncateIdx === 0) {
            enumName = value.toString()
          } else {
            enumName = value.toString().substring(truncateIdx)
            if ('' === enumName) {
              enumName = value.toString()
            }
          }
          enumVars.push(
            newHashMap(
              ['name', this.toEnumVarName(enumName, cm.dataType)],
              ['value', this.toEnumValue(value.toString(), cm.dataType)]
            )
          )
        }
      }
      for (const _var of cm.vars) {
        this.updateCodegenPropertyEnum(_var)
      }
    }
    return objs
  }

  /**
   * Returns the common prefix of variables for enum naming
   *
   * @param vars List of variable names
   * @return the common prefix for naming
   */
  public findCommonPrefixOfVars(listStr) {
    try {
      const prefix = StringUtils.getCommonPrefix(listStr)
      return prefix.replace(COMMON_PREFIX_RE, '')
    } catch (e) {
      Log.trace(e)
      return ''
    }
  }

  /**
   * Return the enum default value in the language specifed format
   *
   * @param value enum variable name
   * @param datatype data type
   * @return the default value for the enum
   */
  public toEnumDefaultValue(value, datatype) {
    return datatype + '.' + value
  }

  /**
   * Return the enum value in the language specifed format
   * e.g. status becomes "status"
   *
   * @param value enum variable name
   * @param datatype data type
   * @return the sanitized value for enum
   */
  public toEnumValue(value, datatype) {
    if ('number' === '' + datatype.toLowerCase()) {
      return value
    }
    return '"' + this.escapeText(value) + '"'
  }

  /**
   * Return the sanitized variable name for enum
   *
   * @param value enum variable name
   * @param datatype data type
   * @return the sanitized variable name for enum
   */
  public toEnumVarName(value, datatype) {
    const __var = value.replace(new RegExp('\\W+', 'g'), '_').toUpperCase()
    if (__var.match('\\d.*')) {
      return '_' + __var
    } else {
      return __var
    }
  }

  public postProcessOperations(objs) {
    return objs
  }

  public postProcessSupportingFileData(objs) {
    return objs
  }

  public postProcessModelProperty(model, property) {
    // Empty
  }

  public postProcessParameter(parameter) {
    // Empty
  }

  public preprocessSwagger(swagger) {
    // Empty
  }

  public processSwagger(swagger) {
    // Empty
  }

  public escapeText(input) {
    if (input == null) {
      return input
    }
    return this.escapeUnsafeCharacters(
      StringEscapeUtils.unescapeJava(
        StringEscapeUtils.escapeJava(input)
          .split('\\/')
          .join('/')
      )

        .replace(new RegExp('[\\t\\n\\r]', 'g'), ' ')
        .split('\\')
        .join('\\\\')
        .split('"')
        .join('\\"')
    )
  }

  /**
   * override with any special text escaping logic to handle unsafe
   * characters so as to avoid code injection
   * @param input String to be cleaned up
   * @return string with unsafe characters removed or escaped
   */
  public escapeUnsafeCharacters(input) {
    Log.warn(
      'escapeUnsafeCharacters should be overriden in the code generator with proper logic to escape unsafe characters'
    )
    return input
  }

  /**
   * Escape single and/or double quote to avoid code injection
   * @param input String to be cleaned up
   * @return string with quotation mark removed or escaped
   */
  public escapeQuotationMark(input) {
    Log.warn(
      'escapeQuotationMark should be overriden in the code generator with proper logic to escape single/double quote'
    )
    return input.split('"').join('\\"')
  }

  public defaultIncludes() {
    return this.__defaultIncludes
  }

  public typeMapping() {
    return this.__typeMapping
  }

  public instantiationTypes() {
    return this.__instantiationTypes
  }

  public reservedWords() {
    return this.__reservedWords
  }

  public languageSpecificPrimitives() {
    return this.__languageSpecificPrimitives
  }

  public importMapping() {
    return this.__importMapping
  }

  public testPackage() {
    return this.__testPackage
  }

  public modelPackage() {
    return this.__modelPackage
  }

  public apiPackage() {
    return this.__apiPackage
  }

  public fileSuffix() {
    return this.__fileSuffix
  }

  public templateDir() {
    return this.__templateDir
  }

  public embeddedTemplateDir() {
    if (this.__embeddedTemplateDir != null) {
      return this.__embeddedTemplateDir
    } else {
      return this.__templateDir
    }
  }

  public getCommonTemplateDir() {
    return this.commonTemplateDir
  }

  public etCommonTemplateDir(commonTemplateDir) {
    this.commonTemplateDir = commonTemplateDir
  }

  public apiDocTemplateFiles() {
    return this.__apiDocTemplateFiles
  }

  public modelDocTemplateFiles() {
    return this.__modelDocTemplateFiles
  }

  public apiTestTemplateFiles() {
    return this.__apiTestTemplateFiles
  }

  public modelTestTemplateFiles() {
    return this.__modelTestTemplateFiles
  }

  public apiTemplateFiles() {
    return this.__apiTemplateFiles
  }

  public apiDataTemplateFile() {
    return this.__apiDataTemplateFile
  }

  public modelTemplateFiles() {
    return this.__modelTemplateFiles
  }

  public apiFileFolder() {
    return (
      this.__outputFolder +
      path.sep +
      this.apiPackage()
        .split('.')
        .join(path.sep)
    )
  }

  /**
   * Checks to see if an API file needs to be generated for this template, helps to apply some logic when you have more than one api file which is condition based.
   * @param templateName
   * @param operation
   * @returns {boolean}
   */
  public shouldGenerateApiFor(templateName, operation) {
    return true
  }

  public modelFileFolder() {
    return (
      this.__outputFolder +
      path.sep +
      this.modelPackage()
        .split('.')
        .join(path.sep)
    )
  }

  public apiTestFileFolder() {
    return (
      this.__outputFolder +
      path.sep +
      this.testPackage()
        .split('.')
        .join(path.sep)
    )
  }

  public modelTestFileFolder() {
    return (
      this.__outputFolder +
      path.sep +
      this.testPackage()
        .split('.')
        .join(path.sep)
    )
  }

  public apiDocFileFolder() {
    return this.__outputFolder
  }

  public modelDocFileFolder() {
    return this.__outputFolder
  }

  public additionalProperties() {
    return this.__additionalProperties
  }

  public vendorExtensions() {
    return this.__vendorExtensions
  }

  public supportingFiles() {
    return this.__supportingFiles
  }

  public outputFolder() {
    return this.__outputFolder
  }

  public setOutputDir(dir) {
    this.__outputFolder = dir
  }

  public getOutputDir() {
    return this.outputFolder()
  }

  public setTemplateDir(templateDir) {
    this.__templateDir = templateDir
  }

  public setModelPackage(modelPackage) {
    this.__modelPackage = modelPackage
  }

  public setModelNamePrefix(modelNamePrefix) {
    this.modelNamePrefix = modelNamePrefix
  }

  public setModelNameSuffix(modelNameSuffix) {
    this.modelNameSuffix = modelNameSuffix
  }

  public setApiPackage(apiPackage) {
    this.__apiPackage = apiPackage
  }

  public setSortParamsByRequiredFlag(sortParamsByRequiredFlag) {
    this.sortParamsByRequiredFlag = sortParamsByRequiredFlag
  }

  public setEnsureUniqueParams(ensureUniqueParams) {
    this.ensureUniqueParams = ensureUniqueParams
  }

  /**
   * Return the regular expression/JSON schema pattern (http://json-schema.org/latest/json-schema-validation.html#anchor33)
   *
   * @param pattern the pattern (regular expression)
   * @return properly-escaped pattern
   */
  public toRegularExpression(pattern) {
    return this.escapeText(pattern)
  }

  /**
   * Return the file name of the Api Test
   *
   * @param name the file name of the Api
   * @return the file name of the Api
   */
  public toApiFilename(name) {
    return this.toApiName(name)
  }

  /**
   * Return the file name of the Api Documentation
   *
   * @param name the file name of the Api
   * @return the file name of the Api
   */
  public toApiDocFilename(name) {
    return this.toApiName(name)
  }

  /**
   * Return the file name of the Api Test
   *
   * @param name the file name of the Api
   * @return the file name of the Api
   */
  public toApiTestFilename(name) {
    return this.toApiName(name) + 'Test'
  }

  /**
   * Return the variable name in the Api
   *
   * @param name the varible name of the Api
   * @return the snake-cased variable name
   */
  public toApiVarName(name) {
    return this.snakeCase(name)
  }

  /**
   * Return the capitalized file name of the model
   *
   * @param name the model name
   * @return the file name of the model
   */
  public toModelFilename(name) {
    return this.initialCaps(name)
  }

  /**
   * Return the capitalized file name of the model test
   *
   * @param name the model name
   * @return the file name of the model
   */
  public toModelTestFilename(name) {
    return this.initialCaps(name) + 'Test'
  }

  /**
   * Return the capitalized file name of the model documentation
   *
   * @param name the model name
   * @return the file name of the model
   */
  public toModelDocFilename(name) {
    return this.initialCaps(name)
  }

  /**
   * Return the operation ID (method name)
   *
   * @param operationId operation ID
   * @return the sanitized method name
   */
  public toOperationId(operationId) {
    if (StringUtils.isEmpty(operationId)) {
      throw new Error('Empty method name (operationId) not allowed')
    }
    return operationId
  }

  /**
   * Return the variable name by removing invalid characters and proper escaping if
   * it's a reserved word.
   *
   * @param name the variable name
   * @return the sanitized variable name
   */
  public toVarName(name) {
    if (this.__reservedWords.contains(name)) {
      return this.escapeReservedWord(name)
    } else {
      return name
    }
  }

  /**
   * Return the parameter name by removing invalid characters and proper escaping if
   * it's a reserved word.
   *
   * @param name Codegen property object
   * @return the sanitized parameter name
   */
  public toParamName(name) {
    name = this.removeNonNameElementToCamelCase(name)
    if (this.__reservedWords.contains(name)) {
      return this.escapeReservedWord(name)
    }
    return name
  }

  /**
   * Return the Enum name (e.g. StatusEnum given 'status')
   *
   * @param property Codegen property
   * @return the Enum name
   */
  public toEnumName(property) {
    return StringUtils.capitalize(property.name) + 'Enum'
  }

  /**
   * Return the escaped name of the reserved word
   *
   * @param name the name to be escaped
   * @return the escaped reserved word
   *
   * throws Runtime exception as reserved word is not allowed (default behavior)
   */
  public escapeReservedWord(name) {
    throw new Error('reserved word ' + name + ' not allowed')
  }

  /**
   * Return the fully-qualified "Model" name for import
   *
   * @param name the name of the "Model"
   * @return the fully-qualified "Model" name for import
   */
  public toModelImport(name) {
    if ('' === this.modelPackage()) {
      return name
    } else {
      return this.modelPackage() + '.' + name
    }
  }

  /**
   * Return the fully-qualified "Api" name for import
   *
   * @param name the name of the "Api"
   * @return the fully-qualified "Api" name for import
   */
  public toApiImport(name) {
    return this.apiPackage() + '.' + name
  }

  /**
   * Initalize special character mapping
   */
  public initalizeSpecialCharacterMapping() {
    this.specialCharReplacements.put('$', 'Dollar')
    this.specialCharReplacements.put('^', 'Caret')
    this.specialCharReplacements.put('|', 'Pipe')
    this.specialCharReplacements.put('=', 'Equal')
    this.specialCharReplacements.put('*', 'Star')
    this.specialCharReplacements.put('-', 'Minus')
    this.specialCharReplacements.put('&', 'Ampersand')
    this.specialCharReplacements.put('%', 'Percent')
    this.specialCharReplacements.put('#', 'Hash')
    this.specialCharReplacements.put('@', 'At')
    this.specialCharReplacements.put('!', 'Exclamation')
    this.specialCharReplacements.put('+', 'Plus')
    this.specialCharReplacements.put(':', 'Colon')
    this.specialCharReplacements.put('>', 'Greater_Than')
    this.specialCharReplacements.put('<', 'Less_Than')
    this.specialCharReplacements.put('.', 'Period')
    this.specialCharReplacements.put('_', 'Underscore')
    this.specialCharReplacements.put('<=', 'Less_Than_Or_Equal_To')
    this.specialCharReplacements.put('>=', 'Greater_Than_Or_Equal_To')
    this.specialCharReplacements.put('!=', 'Not_Equal')
  }

  /**
   * Return the symbol name of a symbol
   *
   * @param input Symbol (e.g. $)
   * @return Symbol name (e.g. Dollar)
   */
  public getSymbolName(input) {
    return this.specialCharReplacements.get(input)
  }

  /**
   * Return the instantiation type of the property, especially for map and array
   *
   * @param p Swagger property object
   * @return string presentation of the instantiation type of the property
   */
  public toInstantiationType(p) {
    if (p != null && p instanceof MapProperty) {
      const ap = p
      const additionalProperties2 = ap.getAdditionalProperties()
      const type = additionalProperties2.getType()
      if (null == type) {
        Log.error(
          'No Type defined for Additional Property ' +
            additionalProperties2 +
            '\n\tIn Property: ' +
            p
        )
      }
      const inner = this.getSwaggerType(additionalProperties2)
      return this.__instantiationTypes.get('map') + '<String, ' + inner + '>'
    } else if (p != null && p instanceof ArrayProperty) {
      const ap = p
      const inner = this.getSwaggerType(ap.getItems())
      return this.__instantiationTypes.get('array') + '<' + inner + '>'
    } else {
      return null
    }
  }

  /**
   * Return the example value of the parameter.
   *
   * @param p Swagger property object
   */
  public setParameterExampleValue(p) {
    // Empty
  }

  /**
   * Return the example value of the property
   *
   * @param p Swagger property object
   * @return string presentation of the example value of the property
   */
  public toExampleValue(p) {
    if (p.getExample() != null) {
      return p.getExample().toString()
    }
    if (p instanceof StringProperty) {
      return 'null'
    } else if (p instanceof BooleanProperty) {
      return 'null'
    } else if (p instanceof DateProperty) {
      return 'null'
    } else if (p instanceof DateTimeProperty) {
      return 'null'
    } else if (p instanceof DoubleProperty) {
      const dp = p
      if ((dp as any).getExample() != null) {
        return (dp as any).getExample().toString()
      }
      return 'null'
    } else if (p instanceof FloatProperty) {
      const dp = p
      if ((dp as any).getExample() != null) {
        return (dp as any).getExample().toString()
      }
      return 'null'
    } else if (p instanceof IntegerProperty) {
      const dp = p
      if ((dp as any).getExample() != null) {
        return (dp as any).getExample().toString()
      }
      return 'null'
    } else if (p instanceof LongProperty) {
      const dp = p
      if ((dp as any).getExample() != null) {
        return (dp as any).getExample().toString()
      }
      return 'null'
    } else {
      return 'null'
    }
  }

  /**
   * Return the default value of the property
   *
   * @param p Swagger property object
   * @return string presentation of the default value of the property
   */
  public toDefaultValue(p) {
    if (p != null && p instanceof StringProperty) {
      return 'null'
    } else if (p != null && p instanceof BooleanProperty) {
      return 'null'
    } else if (p != null && p instanceof DateProperty) {
      return 'null'
    } else if (p != null && p instanceof DateTimeProperty) {
      return 'null'
    } else if (p != null && p instanceof DoubleProperty) {
      const dp = p
      if ((dp as any).getDefault() != null) {
        return (dp as any).getDefault().toString()
      }
      return 'null'
    } else if (p != null && p instanceof FloatProperty) {
      const dp = p
      if ((dp as any).getDefault() != null) {
        return (dp as any).getDefault().toString()
      }
      return 'null'
    } else if (p != null && p instanceof IntegerProperty) {
      const dp = p
      if ((dp as any).getDefault() != null) {
        return (dp as any).getDefault().toString()
      }
      return 'null'
    } else if (p != null && p instanceof LongProperty) {
      const dp = p
      if ((dp as any).getDefault() != null) {
        return (dp as any).getDefault().toString()
      }
      return 'null'
    } else {
      return 'null'
    }
  }

  /**
   * Return the property initialized from a data object
   * Useful for initialization with a plain object in Javascript
   *
   * @param name Name of the property object
   * @param p Swagger property object
   * @return string presentation of the default value of the property
   */
  public toDefaultValueWithParam(name, p) {
    return ' = data.' + name + ';'
  }

  /**
   * returns the swagger type for the property
   * @param p Swagger property object
   * @return string presentation of the type
   */
  public getSwaggerType(p) {
    let datatype: any = null
    if (
      p != null &&
      p instanceof StringProperty &&
      'number' === p.getFormat()
    ) {
      datatype = 'BigDecimal'
    } else if (p != null && p instanceof StringProperty) {
      datatype = 'string'
    } else if (p != null && p instanceof ByteArrayProperty) {
      datatype = 'ByteArray'
    } else if (p != null && p instanceof BinaryProperty) {
      datatype = 'binary'
    } else if (p != null && p instanceof BooleanProperty) {
      datatype = 'boolean'
    } else if (p != null && p instanceof DateProperty) {
      datatype = 'date'
    } else if (p != null && p instanceof DateTimeProperty) {
      datatype = 'DateTime'
    } else if (p != null && p instanceof DoubleProperty) {
      datatype = 'double'
    } else if (p != null && p instanceof FloatProperty) {
      datatype = 'float'
    } else if (p != null && p instanceof IntegerProperty) {
      datatype = 'integer'
    } else if (p != null && p instanceof LongProperty) {
      datatype = 'long'
    } else if (p != null && p instanceof MapProperty) {
      datatype = 'map'
    } else if (p != null && p instanceof DecimalProperty) {
      datatype = 'number'
    } else if (p != null && p instanceof UUIDProperty) {
      datatype = 'UUID'
    } else if (p != null && p instanceof RefProperty) {
      try {
        const r = p
        datatype = r.get$ref()
        if (datatype.indexOf('#/definitions/') === 0) {
          datatype = datatype.substring('#/definitions/'.length)
        }
      } catch (e) {
        Log.warn(
          'Error obtaining the datatype from RefProperty:' +
            p +
            '. Datatype default to Object'
        )
        Log.trace(e)
        datatype = 'Object'
      }
    } else {
      if (p != null) {
        datatype = p.getType()
      }
    }
    return datatype
  }

  /**
   * Return the snake-case of the string
   *
   * @param name string to be snake-cased
   * @return snake-cased string
   */
  public snakeCase(name) {
    return StringUtils.snakeCase(name)
  }

  /**
   * Capitalize the string
   *
   * @param name string to be capitalized
   * @return capitalized string
   */
  public initialCaps(name) {
    return StringUtils.capitalize(name)
  }

  /**
   * Output the type declaration of a given name
   *
   * @param name name
   * @return a string presentation of the type
   */
  public getTypeDeclaration(name) {
    if (name == null || typeof name === 'string') {
      return name
    }
    let swaggerType = this.getSwaggerType(name)
    if (this.__typeMapping.containsKey(swaggerType)) {
      swaggerType = this.__typeMapping.get(swaggerType)
    }
    return swaggerType
  }

  /**
   * Output the API (class) name (capitalized) ending with "Api"
   * Return DefaultApi if name is empty
   *
   * @param name the name of the Api
   * @return capitalized Api name ending with "Api"
   */
  public toApiName(name) {
    if (name.length === 0) {
      return 'DefaultApi'
    }
    return this.initialCaps(name) + 'Api'
  }

  /**
   * Output the proper model name (capitalized)
   *
   * @param name the name of the model
   * @return capitalized model name
   */
  public toModelName(name) {
    return this.initialCaps(this.modelNamePrefix + name + this.modelNameSuffix)
  }

  /**
   * Convert Swagger Model object to Codegen Model object
   *
   * @param name the name of the model
   * @param model Swagger Model object
   * @param allDefinitions a map of all Swagger models from the spec
   * @return Codegen Model object
   */
  public fromModel(name, model, allDefinitions = null) {
    const m = CodegenModelFactory.newInstance(CodegenModelType.MODEL)
    if (this.__reservedWords.contains(name)) {
      m.name = this.escapeReservedWord(name)
    } else {
      m.name = name
    }
    m.description = this.escapeText(model.getDescription())
    m.unescapedDescription = model.getDescription()
    m.classname = this.toModelName(name)
    m.classVarName = this.toVarName(name)
    m.classFilename = this.toModelFilename(name)
    m.modelJson = Json.pretty(model)
    m.externalDocs = model.getExternalDocs()
    m.vendorExtensions = model.getVendorExtensions()
    if (model != null && model instanceof ModelImpl) {
      m.discriminator = model.getDiscriminator()
    }
    if (model != null && model instanceof ArrayModel) {
      const am = model
      const arrayProperty = new ArrayProperty().items(am.getItems())
      m.hasEnums = false
      m.isArrayModel = true
      m.arrayModelType = this.fromProperty(name, arrayProperty).complexType
      this.addParentContainer(m, name, arrayProperty)
    } else if (model != null && model instanceof RefModel) {
      // Empty
    } else if (model != null && model instanceof ComposedModel) {
      const composed = model
      const properties = newHashMap()
      const required = []
      let allProperties
      let allRequired
      if (this.supportsInheritance) {
        allProperties = newHashMap()
        allRequired = []
        m.allVars = []
      } else {
        allProperties = null
        allRequired = null
      }
      let parent = composed.getParent()
      if (composed.getInterfaces() != null) {
        if (m.interfaces == null) {
          m.interfaces = []
        }
        for (const _interface of composed.getInterfaces()) {
          let interfaceModel: any = null
          if (allDefinitions != null) {
            interfaceModel = (allDefinitions as any).get(
              _interface.getSimpleRef()
            )
          }
          if (
            parent == null &&
            (interfaceModel != null && interfaceModel instanceof ModelImpl) &&
            interfaceModel.getDiscriminator() != null
          ) {
            parent = _interface
          } else {
            const interfaceRef = this.toModelName(_interface.getSimpleRef())
            m.interfaces.push(interfaceRef)
            this.addImport(m, interfaceRef)
            if (allDefinitions != null) {
              if (this.supportsInheritance) {
                this.addProperties(
                  allProperties,
                  allRequired,
                  interfaceModel,
                  allDefinitions
                )
              } else {
                this.addProperties(
                  properties,
                  required,
                  interfaceModel,
                  allDefinitions
                )
              }
            }
          }
        }
      }
      if (parent != null) {
        const parentRef = parent.getSimpleRef()
        m.parentSchema = parentRef
        m.parent = this.toModelName(parent.getSimpleRef())
        this.addImport(m, m.parent)
        if (allDefinitions != null) {
          const parentModel = (allDefinitions as any).get(m.parentSchema)
          if (this.supportsInheritance) {
            this.addProperties(
              allProperties,
              allRequired,
              parentModel,
              allDefinitions
            )
          } else {
            this.addProperties(
              properties,
              required,
              parentModel,
              allDefinitions
            )
          }
        }
      }
      let child = composed.getChild()
      if (
        child != null &&
        (child != null && child instanceof RefModel) &&
        allDefinitions != null
      ) {
        const childRef = child.getSimpleRef()
        child = (allDefinitions as any).get(childRef)
      }
      if (child != null && (child != null && child instanceof ModelImpl)) {
        this.addProperties(properties, required, child, allDefinitions)
        if (this.supportsInheritance) {
          this.addProperties(allProperties, allRequired, child, allDefinitions)
        }
      }
      this.addVars(m, properties, required, allProperties, allRequired)
    } else {
      const impl = model
      if (impl.getEnum() != null && impl.getEnum().length > 0) {
        m.isEnum = true
        m.allowableValues = newHashMap()
        m.allowableValues.put('values', impl.getEnum())
        const p = PropertyBuilder.build(impl.getType(), impl.getFormat(), null)
        m.dataType = this.getSwaggerType(p)
      }
      if (
        impl.getAdditionalProperties &&
        impl.getAdditionalProperties() != null
      ) {
        this.addAdditionPropertiesToCodeGenModel(m, impl)
      }
      this.addVars(m, impl.getProperties(), impl.getRequired())
    }
    if (m.vars != null) {
      for (const prop of m.vars) {
        this.postProcessModelProperty(m, prop)
      }
    }
    return m
  }

  public addAdditionPropertiesToCodeGenModel(codegenModel, swaggerModel) {
    const mapProperty = new MapProperty(swaggerModel.getAdditionalProperties())
    this.addParentContainer(codegenModel, codegenModel.name, mapProperty)
  }

  public addProperties(properties, required, model, allDefinitions) {
    if (model != null && model instanceof ModelImpl) {
      const mi: any = model
      if (mi.getProperties() != null) {
        properties.putAll(mi.getProperties())
      }
      if (mi.getRequired() != null) {
        required.push(...mi.getRequired())
      }
    } else if (model != null && model instanceof RefModel) {
      const interfaceRef = model.getSimpleRef()
      const interfaceModel = allDefinitions.get(interfaceRef)
      this.addProperties(properties, required, interfaceModel, allDefinitions)
    } else if (model != null && model instanceof ComposedModel) {
      for (const component of model.getAllOf()) {
        this.addProperties(properties, required, component, allDefinitions)
      }
    }
  }

  /**
   * Camelize the method name of the getter and setter
   *
   * @param name string to be camelized
   * @return Camelized string
   */
  public getterAndSetterCapitalize(name) {
    if (name == null || name.length === 0) {
      return name
    }
    return DefaultCodegen.camelize(this.toVarName(name))
  }

  /**
   * Convert Swagger Property object to Codegen Property object
   *
   * @param name name of the property
   * @param p Swagger property object
   * @return Codegen Property object
   */
  public fromProperty(name, p) {
    if (p == null) {
      Log.error('unexpected missing property for name ' + name)
      return null
    }
    const property = CodegenModelFactory.newInstance(CodegenModelType.PROPERTY)
    property.name = this.toVarName(name)
    property.baseName = name
    property.nameInCamelCase = DefaultCodegen.camelize(property.name, false)
    property.description = this.escapeText(p.getDescription())
    property.unescapedDescription = p.getDescription()
    property.getter = 'get' + this.getterAndSetterCapitalize(name)
    property.setter = 'set' + this.getterAndSetterCapitalize(name)
    property.example = this.toExampleValue(p)
    property.defaultValue = this.toDefaultValue(p)
    property.defaultValueWithParam = this.toDefaultValueWithParam(name, p)
    property.jsonSchema = Json.pretty(p)
    property.isReadOnly = p.getReadOnly()
    property.vendorExtensions = p.getVendorExtensions()
    const type = this.getSwaggerType(p)

    const allowableValues = newHashMap()

    if (p instanceof AbstractNumericProperty) {
      const np: any = p
      property.minimum = np.getMinimum()
      property.maximum = np.getMaximum()
      property.exclusiveMinimum = np.getExclusiveMinimum()
      property.exclusiveMaximum = np.getExclusiveMaximum()
      if (
        property.minimum != null ||
        property.maximum != null ||
        property.exclusiveMinimum != null ||
        property.exclusiveMaximum != null
      ) {
        property.hasValidation = true
      }

      if (np.getMinimum() != null) {
        allowableValues.put('min', np.getMinimum())
      }
      if (np.getMaximum() != null) {
        allowableValues.put('max', np.getMaximum())
      }
    }
    if (p instanceof StringProperty) {
      const sp: any = p
      property.maxLength = sp.getMaxLength()
      property.minLength = sp.getMinLength()
      property.datatype = type
      property.isString = true
      property.isPrimitive = true
      property.pattern = this.toRegularExpression(sp.getPattern())
      if (
        property.pattern != null ||
        property.minLength != null ||
        property.maxLength != null
      ) {
        property.hasValidation = true
      }
      property.isString = true
    } else if (
      p instanceof BaseIntegerProperty &&
      !(p instanceof IntegerProperty) &&
      !(p instanceof LongProperty)
    ) {
      property.isInteger = true
    } else if (p instanceof IntegerProperty) {
      property.isInteger = true
    } else if (p instanceof LongProperty) {
      property.isLong = true
    } else if (p instanceof BooleanProperty) {
      property.isBoolean = true
    } else if (p instanceof BinaryProperty) {
      property.isBinary = true
    } else if (p instanceof UUIDProperty) {
      property.isString = true
    } else if (p instanceof ByteArrayProperty) {
      property.isByteArray = true
    } else if (
      p instanceof DecimalProperty &&
      !(p instanceof DoubleProperty) &&
      !(p instanceof FloatProperty)
    ) {
      property.isFloat = true
    } else if (p instanceof DoubleProperty) {
      property.isDouble = true
    } else if (p instanceof FloatProperty) {
      property.isFloat = true
    } else if (p instanceof DateProperty) {
      property.isDate = true
    } else if (p instanceof DateTimeProperty) {
      property.isDateTime = true
    }
    if (p.getEnum() != null) {
      const _enum = p.getEnum()
      property._enum = _enum
      property.isEnum = true
      allowableValues.put('values', _enum)
    }
    if (!allowableValues.isEmpty()) {
      property.allowableValues = allowableValues
    }

    property.datatype = this.getTypeDeclaration(p)
    property.dataFormat = p.getFormat()
    if (property.isEnum) {
      property.datatypeWithEnum = this.toEnumName(property)
      property.enumName = this.toEnumName(property)
    } else {
      property.datatypeWithEnum = property.datatype
    }
    property.baseType = this.getSwaggerType(p)
    if (p != null && p instanceof ArrayProperty) {
      property.isContainer = true
      property.isListContainer = true
      property.containerType = 'array'
      property.baseType = this.getSwaggerType(p)
      const cp = this.fromProperty(property.name, p.getItems())

      this.updatePropertyForArray(property, cp)
    } else if (p != null && p instanceof MapProperty) {
      property.isContainer = true
      property.isMapContainer = true
      property.containerType = 'map'
      property.baseType = this.getSwaggerType(p)
      const cp = this.fromProperty('inner', p.getAdditionalProperties())
      this.updatePropertyForMap(property, cp)
    } else {
      this.setNonArrayMapProperty(property, type)
    }
    return property
  }

  /**
   * Update property for array(list) container
   * @param property Codegen property
   * @param innerProperty Codegen inner property of map or list
   */
  public updatePropertyForArray(property, innerProperty) {
    if (innerProperty == null) {
      Log.warn('skipping invalid array property ' + Json.pretty(property))
    } else {
      if (!this.__languageSpecificPrimitives.contains(innerProperty.baseType)) {
        property.complexType = innerProperty.baseType
      } else {
        property.isPrimitiveType = true
        property.baseType = innerProperty.baseType
      }
      property.items = innerProperty
      if (this.isPropertyInnerMostEnum(property)) {
        property.isEnum = true
        this.updateDataTypeWithEnumForArray(property)
        property.allowableValues = this.getInnerEnumAllowableValues(property)
      }
    }
  }

  /**
   * Update property for map container
   * @param property Codegen property
   * @param innerProperty Codegen inner property of map or list
   */
  public updatePropertyForMap(property, innerProperty) {
    if (innerProperty == null) {
      Log.warn('skipping invalid map property ' + Json.pretty(property))
      return
    } else {
      if (!this.__languageSpecificPrimitives.contains(innerProperty.baseType)) {
        property.complexType = innerProperty.baseType
      } else {
        property.isPrimitiveType = true
      }
      property.items = innerProperty
      if (this.isPropertyInnerMostEnum(property)) {
        property.isEnum = true
        this.updateDataTypeWithEnumForMap(property)
        property.allowableValues = this.getInnerEnumAllowableValues(property)
      }
    }
  }

  /**
   * Update property for map container
   * @param property Codegen property
   * @return True if the inner most type is enum
   */
  public isPropertyInnerMostEnum(property) {
    let currentProperty = property
    while (
      currentProperty != null &&
      (currentProperty.isMapContainer || currentProperty.isListContainer)
    ) {
      currentProperty = currentProperty.items
    }

    return currentProperty.isEnum
  }

  public getInnerEnumAllowableValues(property) {
    let currentProperty = property
    while (
      currentProperty != null &&
      (currentProperty.isMapContainer || currentProperty.isListContainer)
    ) {
      currentProperty = currentProperty.items
    }
    return currentProperty.allowableValues
  }

  /**
   * Update datatypeWithEnum for array container
   * @param property Codegen property
   */
  public updateDataTypeWithEnumForArray(property) {
    let baseItem = property.items
    while (
      baseItem != null &&
      (baseItem.isMapContainer || baseItem.isListContainer)
    ) {
      baseItem = baseItem.items
    }
    property.datatypeWithEnum = property.datatypeWithEnum
      .split(baseItem.baseType)
      .join(this.toEnumName(baseItem))
    property.enumName = this.toEnumName(property)
    if (property.defaultValue != null) {
      property.defaultValue = property.defaultValue
        .split(baseItem.baseType)
        .join(this.toEnumName(baseItem))
    }
  }

  /**
   * Update datatypeWithEnum for map container
   * @param property Codegen property
   */
  public updateDataTypeWithEnumForMap(property) {
    let baseItem = property.items
    while (
      baseItem != null &&
      (baseItem.isMapContainer || baseItem.isListContainer)
    ) {
      baseItem = baseItem.items
    }
    property.datatypeWithEnum = property.datatypeWithEnum
      .split(', ' + baseItem.baseType)
      .join(', ' + this.toEnumName(baseItem))
    property.enumName = this.toEnumName(property)
    if (property.defaultValue != null) {
      property.defaultValue = property.defaultValue
        .split(', ' + property.items.baseType)
        .join(', ' + this.toEnumName(property.items))
    }
  }

  public setNonArrayMapProperty(property, type) {
    property.isNotContainer = true
    if (this.languageSpecificPrimitives().contains(type)) {
      property.isPrimitiveType = true
    } else {
      property.complexType = property.baseType
    }
  }

  /**
   * Override with any special handling of response codes
   * @param responses Swagger Operation's responses
   * @return default method response or <tt>null</tt> if not found
   */
  public findMethodResponse(responses) {
    let code = null
    let resp
    for (const [responseCode, response] of responses) {
      if (('' + responseCode).startsWith('2') || responseCode === 'default') {
        if (code == null || StringUtils.compareTo(responseCode, code) > 0) {
          code = responseCode
          resp = response
        }
      }
    }

    return resp
  }

  /**
   * Convert Swagger Operation object to Codegen Operation object
   *
   * @param p the path of the operation
   * @param httpMethod HTTP method
   * @param operation Swagger operation object
   * @param definitions a map of Swagger models
   * @param swagger a Swagger object representing the spec
   * @return Codegen Operation object
   */
  public fromOperation(
    p,
    httpMethod,
    operation,
    definitions,
    swagger: any = null
  ) {
    const op = CodegenModelFactory.newInstance(CodegenModelType.OPERATION)
    const imports = newHashSet()
    op.vendorExtensions = operation.getVendorExtensions()
    const operationId = this.removeNonNameElementToCamelCase(
      this.getOrGenerateOperationId(operation, p, httpMethod)
    )
    op.operationId = this.toOperationId(operationId)
    op.path = p
    op.summary = this.escapeText(operation.getSummary())
    op.unescapedNotes = operation.getDescription()
    op.notes = this.escapeText(operation.getDescription())
    op.tags = operation.getTags()
    op.hasConsumes = false
    op.hasProduces = false
    let consumes = []
    if (isNotEmptySet(operation.getConsumes())) {
      consumes = operation.getConsumes()
    } else if (swagger != null && isNotEmptySet(swagger.getConsumes())) {
      consumes = swagger.getConsumes()
      Log.debug(
        'No consumes defined in operation. Using global consumes (' +
          swagger.getConsumes() +
          ') for ' +
          op.operationId
      )
    }
    if (consumes != null && consumes.length) {
      const c: any[] = []
      let count = 0
      for (const key of consumes) {
        const mediaType = newHashMap([
          'mediaType',
          this.escapeText(this.escapeQuotationMark(key)),
        ])
        count += 1
        if (count < consumes.length) {
          mediaType.put('hasMore', 'true')
        } else {
          mediaType.put('hasMore', null)
        }
        c.push(mediaType)
      }
      op.consumes = c
      op.hasConsumes = true
    }
    let produces = []
    if (operation.getProduces() != null) {
      if (operation.getProduces().length > 0) {
        produces = operation.getProduces()
      }
    } else if (
      swagger != null &&
      swagger.getProduces() != null &&
      swagger.getProduces().length > 0
    ) {
      produces = swagger.getProduces()
      Log.debug(
        'No produces defined in operation. Using global produces (' +
          swagger.getProduces() +
          ') for ' +
          op.operationId
      )
    }
    if (produces != null && produces.length > 0) {
      const c: any[] = []
      let count = 0
      for (const key of produces) {
        const mediaType = newHashMap([
          'mediaType',
          this.escapeText(this.escapeQuotationMark(key)),
        ])
        count += 1
        if (count < produces.length) {
          mediaType.put('hasMore', 'true')
        } else {
          mediaType.put('hasMore', null)
        }
        c.push(mediaType)
      }
      op.produces = c
      op.hasProduces = true
    }

    const responses = operation.getResponses()
    if (responses != null && !responses.isEmpty()) {
      const methodResponse = this.findMethodResponse(responses)
      for (const [key, response] of operation.getResponses()) {
        const r = this.fromResponse(key, response)
        r.hasMore = true
        if (
          r.baseType != null &&
          !this.__defaultIncludes.contains(r.baseType) &&
          !this.__languageSpecificPrimitives.contains(r.baseType)
        ) {
          imports.add(r.baseType)
        }
        r.isDefault = response === methodResponse
        op.responses.push(r)
        if (r.isBinary && r.isDefault) {
          op.isResponseBinary = true
        }
      }
      op.responses[op.responses.length - 1].hasMore = false
      if (methodResponse != null) {
        if (methodResponse.getSchema() != null) {
          const cm = this.fromProperty('response', methodResponse.getSchema())
          const responseProperty = methodResponse.getSchema()
          if (
            responseProperty != null &&
            responseProperty instanceof ArrayProperty
          ) {
            const ap = responseProperty
            const innerProperty = this.fromProperty('response', ap.getItems())
            op.returnBaseType = innerProperty.baseType
          } else {
            if (cm.complexType != null) {
              op.returnBaseType = cm.complexType
            } else {
              op.returnBaseType = cm.baseType
            }
          }
          op.examples = new ExampleGenerator(definitions).generate(
            methodResponse.getExamples(),
            operation.getProduces(),
            responseProperty
          )
          op.defaultResponse = this.toDefaultValue(responseProperty)
          op.returnType = cm.datatype
          op.hasReference =
            definitions != null && definitions.containsKey(op.returnBaseType)
          if (definitions != null) {
            const m = definitions.get(op.returnBaseType)
            if (m != null) {
              const cmod = this.fromModel(op.returnBaseType, m, definitions)
              op.discriminator = cmod.discriminator
            }
          }
          if (cm.isContainer != null) {
            op.returnContainer = cm.containerType
            if ('map' === cm.containerType) {
              op.isMapContainer = true
            } else if (
              ((o1, o2) =>
                o1.toUpperCase() === (o2 === null ? o2 : o2.toUpperCase()))(
                'list',
                cm.containerType
              )
            ) {
              op.isListContainer = true
            } else if (
              ((o1, o2) =>
                o1.toUpperCase() === (o2 === null ? o2 : o2.toUpperCase()))(
                'array',
                cm.containerType
              )
            ) {
              op.isListContainer = true
            }
          } else {
            op.returnSimpleType = true
          }
          if (
            this.languageSpecificPrimitives().contains(op.returnBaseType) ||
            op.returnBaseType == null
          ) {
            op.returnTypeIsPrimitive = true
          }
        }
        this.addHeaders(methodResponse, op.responseHeaders)
      }
    }
    const parameters = operation.getParameters()
    let bodyParam = null
    const allParams: any[] = []
    const bodyParams: any[] = []
    const pathParams: any[] = []
    const queryParams: any[] = []
    const headerParams: any[] = []
    const cookieParams: any[] = []
    const formParams: any[] = []
    if (parameters != null) {
      for (const param of parameters) {
        const po = this.fromParameter(param, imports)
        if (this.ensureUniqueParams) {
          while (true) {
            let exists = false
            for (const cp of allParams) {
              if (po.paramName === (cp as any).paramName) {
                exists = true
                break
              }
            }
            if (exists) {
              po.paramName = DefaultCodegen.generateNextName(po.paramName)
            } else {
              break
            }
          }
        }
        allParams.push(po)
        if (param != null && param instanceof QueryParameter) {
          queryParams.push(po.copy())
        } else if (param != null && param instanceof PathParameter) {
          pathParams.push(po.copy())
        } else if (param != null && param instanceof HeaderParameter) {
          headerParams.push(po.copy())
        } else if (param != null && param instanceof CookieParameter) {
          cookieParams.push(po.copy())
        } else if (param != null && param instanceof BodyParameter) {
          bodyParam = po.copy()
          bodyParams.push(po)
        } else if (param != null && param instanceof FormParameter) {
          formParams.push(po)
        }
        if (po.required == null || !po.required) {
          op.hasOptionalParams = true
        }
      }
    }
    for (const i of imports) {
      if (this.needToImport(i)) {
        op.imports.add(i)
      }
    }
    op.bodyParam = bodyParam
    op.httpMethod = httpMethod.toUpperCase()
    if (this.sortParamsByRequiredFlag) {
      allParams.sort(sortByFlag)
    }
    op.allParams = DefaultCodegen.addHasMore(allParams)
    op.bodyParams = DefaultCodegen.addHasMore(bodyParams)
    op.pathParams = DefaultCodegen.addHasMore(pathParams)
    op.queryParams = DefaultCodegen.addHasMore(queryParams)
    op.headerParams = DefaultCodegen.addHasMore(headerParams)
    op.formParams = DefaultCodegen.addHasMore(formParams)
    op.nickname = op.operationId
    if (op.allParams.length > 0) {
      //            op.allParams
      op.hasParams = true
    }
    op.externalDocs = operation.getExternalDocs()
    op.__isRestfulShow = op.isRestfulShow()
    op.__isRestfulIndex = op.isRestfulIndex()
    op.__isRestfulCreate = op.isRestfulCreate()
    op.__isRestfulUpdate = op.isRestfulUpdate()
    op.__isRestfulDestroy = op.isRestfulDestroy()
    op.__isRestful = op.isRestful()
    return op
  }

  /**
   * Convert Swagger Response object to Codegen Response object
   *
   * @param responseCode HTTP response code
   * @param response Swagger Response object
   * @return Codegen Response object
   */
  public fromResponse(responseCode, response) {
    const r = CodegenModelFactory.newInstance(CodegenModelType.RESPONSE)
    if ('default' === responseCode) {
      r.code = '0'
    } else {
      r.code = responseCode
    }
    r.message = this.escapeText(response.getDescription())
    r.schema = response.getSchema()
    r.examples = this.toExamples(response.getExamples())
    r.jsonSchema = Json.pretty(response)
    this.addHeaders(response, r.headers)
    if (r.schema != null) {
      const responseProperty = response.getSchema()
      responseProperty.setRequired(true)
      const cm = this.fromProperty('response', responseProperty)
      if (
        responseProperty != null &&
        responseProperty instanceof ArrayProperty
      ) {
        const innerProperty = this.fromProperty(
          'response',
          responseProperty.getItems()
        )
        r.baseType = innerProperty.baseType
        //     r.isListContainer = true;
      } else {
        if (cm.complexType != null) {
          r.baseType = cm.complexType
        } else {
          r.baseType = cm.baseType
        }
      }
      r.dataType = cm.datatype
      r.isBinary = this.isDataTypeBinary(cm.datatype)
      if (cm.isContainer != null) {
        r.simpleType = false
        r.containerType = cm.containerType
        r.isMapContainer = 'map' === cm.containerType
        r.isListContainer =
          'list' === cm.containerType || 'array' === this.containerType
      } else {
        r.simpleType = true
      }
      r.primitiveType =
        r.baseType == null ||
        this.languageSpecificPrimitives().contains(r.baseType)
    }
    if (r.baseType == null) {
      r.isMapContainer = false
      r.isListContainer = false
      r.primitiveType = true
      r.simpleType = true
    }
    return r
  }

  /**
   * Convert Swagger Parameter object to Codegen Parameter object
   *
   * @param param Swagger parameter object
   * @param imports set of imports for library/package/module
   * @return Codegen Parameter object
   */
  public fromParameter(param, imports) {
    const p = CodegenModelFactory.newInstance(CodegenModelType.PARAMETER)
    p.baseName = param.getName()
    p.description = this.escapeText(param.getDescription())
    p.unescapedDescription = param.getDescription()
    if (param.getRequired()) {
      p.required = param.getRequired()
    }
    p.jsonSchema = Json.pretty(param)
    if (System.getProperty('debugParser') != null) {
      Log.info('working on Parameter ' + param)
    }
    if (param != null && param instanceof QueryParameter) {
      p.defaultValue = param.getDefaultValue()
    } else if (param != null && param instanceof HeaderParameter) {
      p.defaultValue = param.getDefaultValue()
    } else if (param != null && param instanceof FormParameter) {
      p.defaultValue = param.getDefaultValue()
    }
    p.vendorExtensions = param.getVendorExtensions()
    //        if (param != null && (param["__interfaces"] != null && param["__interfaces"].indexOf("io.swagger.models.parameters.SerializableParameter") >= 0 || param.constructor != null && param.constructor["__interfaces"] != null && param.constructor["__interfaces"].indexOf("io.swagger.models.parameters.SerializableParameter") >= 0)) {

    if (param && param instanceof SerializableParameter) {
      const qp: any = param
      let property: any = null
      let collectionFormat: any = null
      const type = qp.getType()
      if (null == type) {
        Log.warn('Type is NULL for Serializable Parameter: ' + param)
      }
      if ('array' === type) {
        let inner = qp.getItems()
        if (inner == null) {
          Log.warn(
            'warning!  No inner type supplied for array parameter "' +
              qp.getName() +
              '", using String'
          )
          inner = (new StringProperty() as any).description(
            '//TODO automatically added by swagger-codegen'
          )
        }
        property = new ArrayProperty().items(inner)
        collectionFormat = qp.getCollectionFormat()
        if (collectionFormat == null) {
          collectionFormat = 'csv'
        }
        const pr = this.fromProperty('inner', property)
        p.baseType = pr.baseType
        p.isContainer = true
        p.isListContainer = true
        imports.add(pr.baseType)
      } else if ('object' === type) {
        let inner = qp.getItems()
        if (inner == null) {
          Log.warn(
            'warning!  No inner type supplied for map parameter "' +
              qp.getName() +
              '", using String'
          )
          inner = (new StringProperty() as any).description(
            '//TODO automatically added by swagger-codegen'
          )
        }
        property = new MapProperty(inner)
        collectionFormat = qp.getCollectionFormat()
        const pr = this.fromProperty('inner', inner)
        p.baseType = pr.datatype
        p.isContainer = true
        p.isMapContainer = true
        imports.add(pr.baseType)
      } else {
        property = PropertyBuilder.build(
          type,
          qp.getFormat(),
          newHashMap(['enum', qp.getEnum()])
        )
      }
      if (property == null) {
        Log.warn(
          'warning!  Property type "' +
            type +
            '" not found for parameter "' +
            (param as any).getName() +
            '", using String'
        )
        property = (new StringProperty() as any).description(
          '//TODO automatically added by swagger-codegen.  Type was ' +
            type +
            ' but not supported'
        )
      }
      property.setRequired((param as any).getRequired())
      const cp = this.fromProperty(qp.getName(), property)
      this.setParameterBooleanFlagWithCodegenProperty(p, cp)
      p.dataType = cp.datatype
      p.dataFormat = cp.dataFormat
      if (cp.isEnum) {
        p.datatypeWithEnum = cp.datatypeWithEnum
      }
      this.updateCodegenPropertyEnum(cp)
      p.isEnum = cp.isEnum
      p._enum = cp._enum
      p.allowableValues = cp.allowableValues
      if (cp.items != null && cp.items.isEnum) {
        p.datatypeWithEnum = cp.datatypeWithEnum
        p.items = cp.items
      }
      p.collectionFormat = collectionFormat
      if (collectionFormat != null && collectionFormat === 'multi') {
        p.isCollectionFormatMulti = true
      }
      p.paramName = this.toParamName(qp.getName())
      if (cp.complexType != null) {
        imports.add(cp.complexType)
      }
      p.maximum = qp.getMaximum()
      p.exclusiveMaximum = qp.isExclusiveMaximum()
      p.minimum = qp.getMinimum()
      p.exclusiveMinimum = qp.isExclusiveMinimum()
      p.maxLength = qp.getMaxLength()
      p.minLength = qp.getMinLength()
      p.pattern = this.toRegularExpression(qp.getPattern())
      p.maxItems = qp.getMaxItems()
      p.minItems = qp.getMinItems()
      p.uniqueItems = qp.isUniqueItems()
      p.multipleOf = qp.getMultipleOf()
      if (
        p.maximum != null ||
        p.exclusiveMaximum != null ||
        p.minimum != null ||
        p.exclusiveMinimum != null ||
        p.maxLength != null ||
        p.minLength != null ||
        p.maxItems != null ||
        p.minItems != null ||
        p.pattern != null
      ) {
        p.hasValidation = true
      }
    } else {
      if (!(param instanceof BodyParameter)) {
        Log.error('Cannot use Parameter ' + param + ' as Body Parameter')
      }
      const bp = param
      const model = bp.getSchema()
      if (model != null && model instanceof ModelImpl) {
        const impl = model
        const cm = this.fromModel(bp.getName(), impl)
        if (cm.emptyVars != null && cm.emptyVars === false) {
          p.dataType = this.getTypeDeclaration(cm.classname)
          imports.add(p.dataType)
        } else {
          const prop = PropertyBuilder.build(
            impl.getType(),
            impl.getFormat(),
            null
          )
          prop.setRequired(bp.getRequired())
          const cp = this.fromProperty('property', prop)
          if (cp != null) {
            p.baseType = cp.baseType
            p.dataType = cp.datatype
            p.isPrimitiveType = cp.isPrimitiveType
            p.isBinary = this.isDataTypeBinary(cp.datatype)
          }
          this.setParameterBooleanFlagWithCodegenProperty(p, cp)
        }
      } else if (model != null && model instanceof ArrayModel) {
        const impl = model
        const ap: any = new ArrayProperty().items(impl.getItems())
        ap.setRequired(param.getRequired())
        const cp = this.fromProperty('inner', ap)
        if (cp.complexType != null) {
          imports.add(cp.complexType)
        }
        imports.add(cp.baseType)
        p.dataType = cp.datatype
        p.baseType = cp.complexType || cp.baseType
        p.isPrimitiveType = cp.isPrimitiveType
        p.isContainer = true
        p.isListContainer = true
        this.setParameterBooleanFlagWithCodegenProperty(p, cp)
      } else {
        const sub = bp.getSchema()
        if (sub != null && sub instanceof RefModel) {
          let name = sub.getSimpleRef()
          if (this.__typeMapping.containsKey(name)) {
            name = this.__typeMapping.get(name)
          } else {
            name = this.toModelName(name)
            if (this.__defaultIncludes.contains(name)) {
              imports.add(name)
            }
            imports.add(name)
            name = this.getTypeDeclaration(name)
          }
          p.dataType = name
          p.baseType = name
        }
      }
      p.paramName = this.toParamName(bp.getName())
    }
    if (p.vendorExtensions && p.vendorExtensions.containsKey('x-example')) {
      p.example = p.vendorExtensions.get('x-example') + ''
    } else if (p.isString) {
      p.example = p.paramName + '_example'
    } else if (p.isBoolean) {
      p.example = 'true'
    } else if (p.isLong) {
      p.example = '789'
    } else if (p.isInteger) {
      p.example = '56'
    } else if (p.isFloat) {
      p.example = '3.4'
    } else if (p.isDouble) {
      p.example = '1.2'
    } else if (p.isBinary) {
      p.example = 'BINARY_DATA_HERE'
    } else if (p.isByteArray) {
      p.example = 'B'
    } else if (p.isDate) {
      p.example = '2013-10-20'
    } else if (p.isDateTime) {
      p.example = '2013-10-20T19:20:30+01:00'
    } else if (
      param != null &&
      param instanceof FormParameter &&
      (((o1, o2) => o1.toUpperCase() === (o2 === null ? o2 : o2.toUpperCase()))(
        'file',
        (param as any).getType()
      ) ||
        'file' === p.baseType)
    ) {
      p.isFile = true
      p.example = '/path/to/file.txt'
    }
    this.setParameterExampleValue(p)
    if (param != null && param instanceof QueryParameter) {
      p.isQueryParam = true
    } else if (param != null && param instanceof PathParameter) {
      p.required = true
      p.isPathParam = true
    } else if (param != null && param instanceof HeaderParameter) {
      p.isHeaderParam = true
    } else if (param != null && param instanceof CookieParameter) {
      p.isCookieParam = true
    } else if (param != null && param instanceof BodyParameter) {
      p.isBodyParam = true
      p.isBinary = this.isDataTypeBinary(p.dataType)
    } else if (param != null && param instanceof FormParameter) {
      if (
        ((o1, o2) =>
          o1.toUpperCase() === (o2 === null ? o2 : o2.toUpperCase()))(
          'file',
          (param as any).getType()
        )
      ) {
        p.isFile = true
      } else if ('file' === p.baseType) {
        p.isFile = true
      } else {
        p.notFile = true
      }
      p.isFormParam = true
    }
    this.postProcessParameter(p)
    return p
  }

  public isDataTypeBinary(dataType) {
    return dataType && dataType.toLowerCase().startsWith('byte')
  }

  /**
   * Convert map of Swagger SecuritySchemeDefinition objects to a list of Codegen Security objects
   *
   * @param schemes a map of Swagger SecuritySchemeDefinition object
   * @return a list of Codegen Security objects
   */
  public fromSecurity(schemes) {
    if (schemes == null) {
      return Collections.emptyList()
    }
    const secs: any[] = []
    let sec
    for (const [name, schemeDefinition] of schemes) {
      sec = CodegenModelFactory.newInstance(CodegenModelType.SECURITY)
      sec.name = name
      sec.type = schemeDefinition.getType()
      sec.isCode = sec.isPassword = sec.isApplication = sec.isImplicit = false
      if (
        schemeDefinition != null &&
        schemeDefinition instanceof ApiKeyAuthDefinition
      ) {
        const apiKeyDefinition = schemeDefinition
        sec.isBasic = sec.isOAuth = false
        sec.isApiKey = true
        sec.keyParamName = apiKeyDefinition.getName()
        sec.isKeyInHeader = apiKeyDefinition.getIn() === In.HEADER
        sec.isKeyInQuery = !sec.isKeyInHeader
      } else if (
        schemeDefinition != null &&
        schemeDefinition instanceof BasicAuthDefinition
      ) {
        sec.isKeyInHeader = sec.isKeyInQuery = sec.isApiKey = sec.isOAuth = false
        sec.isBasic = true
      } else {
        const oauth2Definition = schemeDefinition
        sec.isKeyInHeader = sec.isKeyInQuery = sec.isApiKey = sec.isBasic = false
        sec.isOAuth = true
        sec.flow = oauth2Definition.getFlow()
        switch (sec.flow) {
          case 'accessCode':
            sec.isCode = true
            break
          case 'password':
            sec.isPassword = true
            break
          case 'application':
            sec.isApplication = true
            break
          case 'implicit':
            sec.isImplicit = true
            break
          default:
            throw new Error('unknown oauth flow: ' + sec.flow)
        }
        sec.authorizationUrl = oauth2Definition.getAuthorizationUrl()
        sec.tokenUrl = oauth2Definition.getTokenUrl()
        if (oauth2Definition.getScopes() != null) {
          const scopes: any[] = []
          let count = 0
          const numScopes = oauth2Definition.getScopes().size
          for (const [n, description] of asMap(oauth2Definition.getScopes())) {
            const scope = newHashMap(['scope', n], ['description', description])
            count += 1
            if (count < numScopes) {
              scope.put('hasMore', 'true')
            } else {
              scope.put('hasMore', null)
            }
            scopes.push(scope)
          }
          sec.scopes = scopes
        }
      }
      secs.push(sec)
    }
    if (sec) {
      sec.hasMore = false
    }
    return secs
  }

  public setReservedWordsLowerCase(words) {
    this.__reservedWords = newHashSet()
    for (const word of words) {
      this.__reservedWords.add(word.toLowerCase())
    }
  }

  public isReservedWord(word) {
    return word != null && this.__reservedWords.contains(word.toLowerCase())
  }

  /**
   * Get operationId from the operation object, and if it's blank, generate a new one from the given parameters.
   *
   * @param operation the operation object
   * @param p the path of the operation
   * @param httpMethod the HTTP method of the operation
   * @return the (generated) operationId
   */
  public getOrGenerateOperationId(operation, p, httpMethod) {
    let operationId = operation.getOperationId()
    if (StringUtils.isBlank(operationId)) {
      let tmpPath = p
      tmpPath = tmpPath.replace(new RegExp('\\{', 'g'), '')
      tmpPath = tmpPath.replace(new RegExp('\\}', 'g'), '')
      const parts = (tmpPath + '/' + httpMethod).split('/')
      const builder = StringBuilder()
      if ('/' === tmpPath) {
        builder.append('root')
      }
      for (let part of parts) {
        if (part.length > 0) {
          if (builder.length() === 0) {
            part = StringUtils.lowerFirst(part)
          } else {
            part = this.initialCaps(part)
          }
          builder.append(part)
        }
      }
      operationId = this.sanitizeName(builder.toString())
      Log.warn(
        'Empty operationId found for path: ' +
          httpMethod +
          ' ' +
          p +
          '. Renamed to auto-generated operationId: ' +
          operationId
      )
    }
    return operationId
  }

  /**
   * Check the type to see if it needs import the library/module/package
   *
   * @param type name of the type
   * @return true if the library/module/package of the corresponding type needs to be imported
   */
  public needToImport(type) {
    return (
      !this.__defaultIncludes.contains(type) &&
      !this.__languageSpecificPrimitives.contains(type)
    )
  }

  public toExamples(examples) {
    if (examples == null) {
      return null
    }
    const output: any[] = []
    for (const [contentType, example] of asMap(examples)) {
      output.push(
        newHashMap(['contentType', contentType], ['example', example])
      )
    }
    return output
  }

  public addHeaders(response, target) {
    if (response.getHeaders() != null) {
      for (const [key, value] of response.getHeaders()) {
        target.push(this.fromProperty(key, factory(value)))
      }
    }
  }

  /**
   * Add operation to group
   *
   * @param tag name of the tag
   * @param resourcePath path of the resource
   * @param operation Swagger Operation object
   * @param co Codegen Operation object
   * @param operations map of Codegen operations
   */
  public addOperationToGroup(tag, resourcePath, operation, co, operations) {
    let opList = operations.get(tag)
    if (opList == null) {
      opList = []
      operations.put(tag, opList)
    }
    let uniqueName = co.operationId
    let counter = 0
    for (const op of opList) {
      if (uniqueName === op.operationId) {
        uniqueName = co.operationId + '_' + counter
        counter++
      }
    }
    if (!(co.operationId === uniqueName)) {
      Log.warn('generated unique operationId `' + uniqueName + '`')
    }
    co.operationId = uniqueName
    co.operationIdLowerCase = uniqueName.toLowerCase()
    opList.push(co)
    co.baseName = tag
  }

  public addParentContainer(m, name, property) {
    const tmp = this.fromProperty(name, property)
    this.addImport(m, tmp.complexType)
    m.parent = this.toInstantiationType(property)
    const containerType = tmp.containerType
    const instantiationType = this.__instantiationTypes.get(containerType)
    if (instantiationType != null) {
      this.addImport(m, instantiationType)
    }
    const mappedType = this.__typeMapping.get(containerType)
    if (mappedType != null) {
      this.addImport(m, mappedType)
    }
  }

  /**
   * Dashize the given word.
   *
   * @param word The word
   * @return The dashized version of the word, e.g. "my-name"
   */
  public dashize(word) {
    return DefaultCodegen.underscore(word).replace(new RegExp('[_ ]', 'g'), '-')
  }

  public addImport(m, type) {
    if (type != null && this.needToImport(type)) {
      m.imports.add(type)
    }
  }

  public addVars(
    m,
    properties,
    required,
    allProperties?: any,
    allRequired?: any
  ) {
    if (arguments.length > 4) {
      m.hasRequired = false
      if (properties != null && !properties.isEmpty()) {
        m.hasVars = true
        m.hasEnums = false
        const mandatory =
          required == null
            ? Collections.emptySet()
            : new Set(required.concat().sort())
        this._addVars(m, m.vars, properties, mandatory)
        m.allMandatory = m.mandatory = mandatory
      } else {
        m.emptyVars = true
        m.hasVars = false
        m.hasEnums = false
      }
      if (allProperties != null) {
        const allMandatory =
          allRequired == null
            ? Collections.emptySet()
            : new Set(allRequired.concat().sort())
        this._addVars(m, m.allVars, allProperties, allMandatory)
        m.allMandatory = allMandatory
      }
    } else if (arguments.length > 3) {
      return this._addVars(m, properties, required, allProperties)
    } else {
      return this.addVars(m, properties, required, null, null)
    }
  }

  public _addVars(m, vars, properties, mandatory) {
    const propertyList = properties.entrySet().toArray()
    const totalCount = propertyList.length
    for (let i = 0; i < totalCount; i++) {
      const entry = propertyList[i]
      const key = entry.getKey()
      const prop = entry.getValue()
      if (prop == null) {
        Log.warn('null property for ' + key)
        continue
      }

      const cp = this.fromProperty(key, prop)
      if (mandatory.has) {
        cp.required = mandatory.has(key) ? true : null
      } else {
        cp.required = mandatory.hasOwnProperty(key) ? true : null
      }

      m.hasRequired = m.hasRequired || cp.required
      if (cp.isEnum) {
        m.hasEnums = true
      }
      if (!cp.isReadOnly) {
        m.hasOnlyReadOnly = false
      }
      if (i + 1 !== totalCount) {
        cp.hasMore = true
        if (!propertyList[i + 1].getValue().getReadOnly()) {
          cp.hasMoreNonReadOnly = true
        }
      }
      if (cp.isContainer != null) {
        this.addImport(m, this.__typeMapping.get('array'))
      }
      this.addImport(m, cp.baseType)
      let innerCp = cp
      while (innerCp != null) {
        this.addImport(m, innerCp.complexType)
        innerCp = innerCp.items
      }

      vars.push(cp)
      if (cp.required) {
        m.requiredVars.push(cp)
      } else {
        m.optionalVars.push(cp)
      }
      if (cp.isReadOnly) {
        m.readOnlyVars.push(cp)
      } else {
        m.readWriteVars.push(cp)
      }
    }
  }

  /**
   * Remove characters that is not good to be included in method name from the input and camelize it
   *
   * @param name string to be camelize
   * @param nonNameElementPattern a regex pattern of the characters that is not good to be included in name
   * @return camelized string
   */
  public removeNonNameElementToCamelCase(
    name,
    nonNameElementPattern = '[-_:;#]'
  ) {
    let result = StringUtils.join(
      Lists.transform(
        Lists.newArrayList(name.split(nonNameElementPattern)),
        input => StringUtils.capitalize(input)
      ),
      ''
    )
    if (result.length > 0) {
      result = StringUtils.lowerFirst(result)
    }
    return result
  }

  public apiFilename(templateName, tag) {
    const suffix = this.apiTemplateFiles().get(templateName)
    return this.apiFileFolder() + path.sep + this.toApiFilename(tag) + suffix
  }

  public apiDataFilename(templateName, tag) {
    const suffix = this.apiDataTemplateFile().get(templateName)
    return this.apiFileFolder() + path.sep + this.toModelName(tag) + suffix
  }

  /**
   * Return the full path and API documentation file
   *
   * @param templateName template name
   * @param tag tag
   *
   * @return the API documentation file name with full path
   */
  public apiDocFilename(templateName, tag) {
    const suffix = this.apiDocTemplateFiles().get(templateName)
    return this.apiDocFileFolder() + this.toApiDocFilename(tag) + suffix
  }

  /**
   * Return the full path and API test file
   *
   * @param templateName template name
   * @param tag tag
   *
   * @return the API test file name with full path
   */
  public apiTestFilename(templateName, tag) {
    const suffix = this.apiTestTemplateFiles().get(templateName)
    return (
      this.apiTestFileFolder() + path.sep + this.toApiTestFilename(tag) + suffix
    )
  }

  public shouldOverwrite(filename) {
    return !(this.skipOverwrite && new File(filename).exists())
  }

  public isSkipOverwrite() {
    return this.skipOverwrite
  }

  public setSkipOverwrite(skipOverwrite) {
    this.skipOverwrite = skipOverwrite
  }

  /**
   * All library templates supported.
   * (key: library name, value: library description)
   * @return the supported libraries
   */
  public supportedLibraries() {
    return this.__supportedLibraries
  }

  /**
   * Set library template (sub-template).
   *
   * @param library Library template
   */
  public setLibrary(library) {
    if (library != null && !this.__supportedLibraries.containsKey(library)) {
      throw new Error('unknown library: ' + library)
    }
    this.library = library
  }

  /**
   * Library template (sub-template).
   *
   * @return Library template
   */
  public getLibrary() {
    return this.library
  }

  /**
   * Set Git user ID.
   *
   * @param gitUserId Git user ID
   */
  public setGitUserId(gitUserId) {
    this.gitUserId = gitUserId
  }

  /**
   * Git user ID
   *
   * @return Git user ID
   */
  public getGitUserId() {
    return this.gitUserId
  }

  /**
   * Set Git repo ID.
   *
   * @param gitRepoId Git repo ID
   */
  public setGitRepoId(gitRepoId) {
    this.gitRepoId = gitRepoId
  }

  /**
   * Git repo ID
   *
   * @return Git repo ID
   */
  public getGitRepoId() {
    return this.gitRepoId
  }

  /**
   * Set release note.
   *
   * @param releaseNote Release note
   */
  public setReleaseNote(releaseNote) {
    this.releaseNote = releaseNote
  }

  /**
   * Release note
   *
   * @return Release note
   */
  public getReleaseNote() {
    return this.releaseNote
  }

  /**
   * Set HTTP user agent.
   *
   * @param httpUserAgent HTTP user agent
   */
  public setHttpUserAgent(httpUserAgent) {
    this.httpUserAgent = httpUserAgent
  }

  /**
   * HTTP user agent
   *
   * @return HTTP user agent
   */
  public getHttpUserAgent() {
    return this.httpUserAgent
  }

  public buildLibraryCliOption(supportedLibraries) {
    const sb = StringBuilder('library template (sub-template) to use:')
    for (const [key, lib] of supportedLibraries) {
      sb.append('\n')
        .append(key)
        .append(' - ')
        .append(lib)
    }
    return new CliOption('library', sb.toString())
  }

  /**
   * Sanitize name (parameter, property, method, etc)
   *
   * @param name string to be sanitize
   * @return sanitized string
   */
  public sanitizeName(name) {
    if (name == null) {
      Log.error('String to be sanitized is null. Default to ERROR_UNKNOWN')
      return 'ERROR_UNKNOWN'
    }
    if ('$' === name) {
      return 'value'
    }
    name = name.replace(new RegExp('\\[\\]', 'g'), '')
    name = name.replace(new RegExp('\\[', 'g'), '_')
    name = name.replace(new RegExp('\\]', 'g'), '')
    name = name.replace(new RegExp('\\(', 'g'), '_')
    name = name.replace(new RegExp('\\)', 'g'), '')
    name = name.replace(new RegExp('\\.', 'g'), '_')
    name = name.replace(new RegExp('-', 'g'), '_')
    name = name.replace(new RegExp(' ', 'g'), '_')
    return name.replace(new RegExp('[^a-zA-Z0-9_]', 'g'), '')
  }

  /**
   * Sanitize tag
   *
   * @param tag Tag
   * @return Sanitized tag
   */
  public sanitizeTag(tag) {
    const parts = tag.split(' ')
    const buf = StringBuilder()
    for (const part of parts) {
      {
        if (StringUtils.isNotEmpty(part)) {
          buf.append(StringUtils.capitalize(part))
        }
      }
    }
    return buf.toString().replace(new RegExp('[^a-zA-Z ]', 'g'), '')
  }

  /**
   * Only write if the file doesn't exist
   *
   * @param outputFolder Output folder
   * @param supportingFile Supporting file
   */
  public writeOptional(outputFolder, supportingFile) {
    let folder = ''
    if (outputFolder != null && !('' === outputFolder)) {
      folder += outputFolder + File.separator
    }
    folder += supportingFile.folder
    if (!('' === folder)) {
      folder += File.separator + supportingFile.destinationFilename
    } else {
      folder = supportingFile.destinationFilename
    }
    if (!new File(folder).exists()) {
      this.__supportingFiles.push(supportingFile)
    } else {
      Log.info(
        'Skipped overwriting ' +
          supportingFile.destinationFilename +
          ' as the file already exists in ' +
          folder
      )
    }
  }

  /**
   * Set CodegenParameter boolean flag using CodegenProperty.
   *
   * @param parameter Codegen Parameter
   * @param property  Codegen property
   */
  public setParameterBooleanFlagWithCodegenProperty(parameter, property) {
    if (parameter == null) {
      Log.error('Codegen Parameter cannnot be null.')
      return
    }
    if (property == null) {
      Log.error('Codegen Property cannot be null.')
      return
    }
    if (property.isString) {
      parameter.isString = true
      parameter.isPrimitiveType = true
    } else if (property.isBoolean) {
      parameter.isBoolean = true
      parameter.isPrimitiveType = true
    } else if (property.isLong) {
      parameter.isLong = true
      parameter.isPrimitiveType = true
    } else if (property.isInteger) {
      parameter.isInteger = true
      parameter.isPrimitiveType = true
    } else if (property.isDouble) {
      parameter.isDouble = true
      parameter.isPrimitiveType = true
    } else if (property.isFloat) {
      parameter.isFloat = true
      parameter.isPrimitiveType = true
    } else if (property.isByteArray) {
      parameter.isByteArray = true
      parameter.isPrimitiveType = true
    } else if (property.isBinary) {
      parameter.isByteArray = true
      parameter.isPrimitiveType = true
    } else if (property.isDate) {
      parameter.isDate = true
      parameter.isPrimitiveType = true
    } else if (property.isDateTime) {
      parameter.isDateTime = true
      parameter.isPrimitiveType = true
    } else {
      Log.debug('Property type is not primitive: ' + property.datatype)
    }

    if (property.isListContainer && property.items) {
      if (property.items.isString) {
        parameter.isItemString = true
      } else if (property.items.isBoolean) {
        parameter.isItemBoolean = true
      } else if (property.items.isLong) {
        parameter.isItemLong = true
      } else if (property.items.isInteger) {
        parameter.isItemInteger = true
      } else if (property.items.isDouble) {
        parameter.isItemDouble = true
      } else if (property.items.isFloat) {
        parameter.isItemFloat = true
      } else if (property.items.isByteArray) {
        parameter.isItemByteArray = true
      } else if (property.items.isBinary) {
        parameter.isItemByteArray = true
      } else if (property.items.isDate) {
        parameter.isItemDate = true
      } else if (property.items.isDateTime) {
        parameter.isItemDateTime = true
      } else {
        Log.debug('Property item type is not primitive: ' + property.datatype)
      }
    }
  }

  /**
   * Update codegen property's enum by adding "enumVars" (with name and value)
   *
   * @param var list of CodegenProperty
   */
  public updateCodegenPropertyEnum(__var) {
    let allowableValues = __var.allowableValues
    if (__var.items != null) {
      allowableValues = __var.items.allowableValues
    }
    if (allowableValues == null) {
      return
    }
    const values = allowableValues.get('values')
    if (values == null) {
      return
    }
    const enumVars: any[] = []
    const commonPrefix = this.findCommonPrefixOfVars(values)
    const truncateIdx = commonPrefix.length
    for (const value of values) {
      const enumVar = newHashMap()
      let enumName
      if (truncateIdx === 0) {
        enumName = value.toString()
      } else {
        enumName = value.toString().substring(truncateIdx)
        if ('' === enumName) {
          enumName = value.toString()
        }
      }
      enumVar.put('name', this.toEnumVarName(enumName, __var.datatype))
      enumVar.put('value', this.toEnumValue(value.toString(), __var.datatype))
      enumVars.push(enumVar)
    }
    allowableValues.put('enumVars', enumVars)
    if (__var.defaultValue != null) {
      let enumName = null
      for (const enumVar of enumVars) {
        if (
          this.toEnumValue(__var.defaultValue, __var.datatype) ===
          enumVar.get('value')
        ) {
          enumName = enumVar.get('name')
          break
        }
      }
      if (enumName != null) {
        __var.defaultValue = this.toEnumDefaultValue(
          enumName,
          __var.datatypeWithEnum
        )
      }
    }
  }
}
const Log = LoggerFactory.getLogger(DefaultCodegen)
