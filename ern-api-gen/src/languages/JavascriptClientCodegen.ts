/* tslint:disable:variable-name */
import CliOption from '../CliOption';
import CodegenConstants from '../CodegenConstants';
import CodegenModel from '../CodegenModel';
import CodegenOperation from '../CodegenOperation';
import CodegenParameter from '../CodegenParameter';
import CodegenProperty from '../CodegenProperty';
import CodegenType from '../CodegenType';
import DefaultCodegen from '../DefaultCodegen';
import SupportingFile from '../SupportingFile';
import ArrayModel from '../models/ArrayModel';
import ModelImpl from '../models/ModelImpl';
import {
  ArrayProperty,
  BooleanProperty,
  DoubleProperty,
  FloatProperty,
  IntegerProperty,
  LongProperty,
  MapProperty,
  RefProperty,
  StringProperty,
} from '../models/properties';
import { log } from 'ern-core';
import File from '../java/File';
import { Collections, newHashMap, newHashSet } from '../java/javaUtil';
import StringBuilder from '../java/StringBuilder';
import { isEmpty } from '../java/StringUtils';
import path from 'path';
import { parseBoolean } from '../java/BooleanHelper';

export default class JavascriptClientCodegen extends DefaultCodegen {
  public static PROJECT_NAME = 'projectName';
  public static MODULE_NAME = 'moduleName';
  public static PROJECT_DESCRIPTION = 'projectDescription';
  public static PROJECT_VERSION = 'projectVersion';
  public static PROJECT_LICENSE_NAME = 'projectLicenseName';
  public static USE_PROMISES = 'usePromises';
  public static USE_INHERITANCE = 'useInheritance';
  public static EMIT_MODEL_METHODS = 'emitModelMethods';
  public static EMIT_JS_DOC = 'emitJSDoc';

  public static reconcileInlineEnums(codegenModel, parentCodegenModel) {
    if (parentCodegenModel.hasEnums) {
      const parentModelCodegenProperties = parentCodegenModel.vars;
      const codegenProperties = codegenModel.vars;
      let removedChildEnum = false;
      for (const parentModelCodegenPropery of parentModelCodegenProperties) {
        if (parentModelCodegenPropery.isEnum) {
          for (let i = codegenProperties.length; i--; ) {
            const codegenProperty = codegenProperties[i];
            if (
              codegenProperty.isEnum &&
              codegenProperty.equals(parentModelCodegenPropery)
            ) {
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

  public sourceFolder = 'src';
  public localVariablePrefix = '';
  public emitJSDoc = true;
  public apiDocPath = 'docs/';
  public modelDocPath = 'docs/';
  public apiTestPath = 'api/';
  public modelTestPath = 'model/';
  public usePromises = false;
  public emitModelMethods = false;
  public __outputFolder = 'generated-code/js';
  public __templateDir = 'Javascript';
  public __apiPackage = 'api';
  public __modelPackage = 'model';
  public __typeMapping = newHashMap(
    ['array', 'Array'],
    ['map', 'Object'],
    ['List', 'Array'],
    ['boolean', 'Boolean'],
    ['string', 'String'],
    ['int', 'Integer'],
    ['float', 'Number'],
    ['number', 'Number'],
    ['DateTime', 'Date'],
    ['date', 'Date'],
    ['long', 'Integer'],
    ['short', 'Integer'],
    ['char', 'String'],
    ['double', 'Number'],
    ['object', 'Object'],
    ['integer', 'Integer'],
    ['ByteArray', 'String'],
    ['binary', 'String'],
    ['UUID', 'String'],
  );

  public _swaggerToFlowMapping = newHashMap(
    ['Integer', 'number'],
    ['Number', 'number'],
    ['String', 'string'],
    ['Boolean', 'boolean'],
  );

  public __languageSpecificPrimitives = newHashSet(
    'String',
    'Boolean',
    'Integer',
    'Number',
    'Array',
    'Object',
    'Date',
    'File',
  );

  public projectVersion;
  public projectDescription;
  public projectName;
  public moduleName;
  public invokerPackage;

  constructor() {
    super();
    this.__modelTemplateFiles.put('model.mustache', '.js');
    this.__modelTestTemplateFiles.put('model_test.mustache', '.js');
    this.__apiTemplateFiles.put('api.mustache', '.js');
    this.__apiTestTemplateFiles.put('api_test.mustache', '.js');
    this.__modelDocTemplateFiles.put('model_doc.mustache', '.md');
    this.__apiDocTemplateFiles.put('api_doc.mustache', '.md');
    this.__defaultIncludes = newHashSet(...this.__languageSpecificPrimitives);
    this.__instantiationTypes.put('array', 'Array');
    this.__instantiationTypes.put('list', 'Array');
    this.__instantiationTypes.put('map', 'Object');
    this.__supportingFiles.push(
      new SupportingFile('git_push.sh.mustache', '', 'git_push.sh'),
    );
    this.__supportingFiles.push(
      new SupportingFile('README.mustache', '', 'README.md'),
    );
    this.__supportingFiles.push(
      new SupportingFile('mocha.opts', '', 'mocha.opts'),
    );
    this.__supportingFiles.push(
      new SupportingFile('travis.yml', '', '.travis.yml'),
    );
    // this.__supportingFiles.push(new SupportingFile("package.mustache", "", "package.json"));

    this.setReservedWordsLowerCase([
      'abstract',
      'arguments',
      'boolean',
      'break',
      'byte',
      'case',
      'catch',
      'char',
      'class',
      'const',
      'continue',
      'debugger',
      'default',
      'delete',
      'do',
      'double',
      'else',
      'enum',
      'eval',
      'export',
      'extends',
      'false',
      'final',
      'finally',
      'float',
      'for',
      'function',
      'goto',
      'if',
      'implements',
      'import',
      'in',
      'instanceof',
      'int',
      'interface',
      'let',
      'long',
      'native',
      'new',
      'null',
      'package',
      'private',
      'protected',
      'public',
      'return',
      'short',
      'static',
      'super',
      'switch',
      'synchronized',
      'this',
      'throw',
      'throws',
      'transient',
      'true',
      'try',
      'typeof',
      'var',
      'void',
      'volatile',
      'while',
      'with',
      'yield',
      'Array',
      'Date',
      'eval',
      'function',
      'hasOwnProperty',
      'Infinity',
      'isFinite',
      'isNaN',
      'isPrototypeOf',
      'Math',
      'NaN',
      'Number',
      'Object',
      'prototype',
      'String',
      'toString',
      'undefined',
      'valueOf',
    ]);
  }

  public initalizeCliOptions() {
    super.initalizeCliOptions();
    this.__cliOptions.push(
      new CliOption(
        CodegenConstants.SOURCE_FOLDER,
        CodegenConstants.SOURCE_FOLDER_DESC,
      ).defaultValue('src'),
    );
    this.__cliOptions.push(
      new CliOption(
        CodegenConstants.LOCAL_VARIABLE_PREFIX,
        CodegenConstants.LOCAL_VARIABLE_PREFIX_DESC,
      ),
    );
    this.__cliOptions.push(
      new CliOption(
        CodegenConstants.INVOKER_PACKAGE,
        CodegenConstants.INVOKER_PACKAGE_DESC,
      ),
    );
    this.__cliOptions.push(
      new CliOption(
        CodegenConstants.API_PACKAGE,
        CodegenConstants.API_PACKAGE_DESC,
      ),
    );
    this.__cliOptions.push(
      new CliOption(
        CodegenConstants.MODEL_PACKAGE,
        CodegenConstants.MODEL_PACKAGE_DESC,
      ),
    );
    this.__cliOptions.push(
      new CliOption(
        JavascriptClientCodegen.PROJECT_NAME,
        'name of the project (Default: generated from info.title or "swagger-js-client")',
      ),
    );
    this.__cliOptions.push(
      new CliOption(
        JavascriptClientCodegen.MODULE_NAME,
        'module name for AMD, Node or globals (Default: generated from <projectName>)',
      ),
    );
    this.__cliOptions.push(
      new CliOption(
        JavascriptClientCodegen.PROJECT_DESCRIPTION,
        'description of the project (Default: using info.description or "Client library of <projectName>")',
      ),
    );
    this.__cliOptions.push(
      new CliOption(
        JavascriptClientCodegen.PROJECT_VERSION,
        'version of the project (Default: using info.version or "1.0.0")',
      ),
    );
    this.__cliOptions.push(
      new CliOption(
        JavascriptClientCodegen.PROJECT_LICENSE_NAME,
        'name of the license the project uses (Default: using info.license.name)',
      ),
    );
    this.__cliOptions.push(
      new CliOption(
        JavascriptClientCodegen.USE_PROMISES,
        'use Promises as return values from the client API, instead of superagent callbacks',
      ).defaultValue('false'),
    );
    this.__cliOptions.push(
      new CliOption(
        JavascriptClientCodegen.EMIT_MODEL_METHODS,
        'generate getters and setters for model properties',
      ).defaultValue('false'),
    );
    this.__cliOptions.push(
      new CliOption(
        JavascriptClientCodegen.EMIT_JS_DOC,
        'generate JSDoc comments',
      ).defaultValue('true'),
    );
    this.__cliOptions.push(
      new CliOption(
        JavascriptClientCodegen.USE_INHERITANCE,
        'use JavaScript prototype chains & delegation for inheritance',
      ).defaultValue('true'),
    );
  }

  public getTag() {
    return CodegenType.CLIENT;
  }

  public getName() {
    return 'javascript';
  }

  public getHelp() {
    return 'Generates a JavaScript client library.';
  }

  public processOpts() {
    super.processOpts();
    if (
      this.__additionalProperties.containsKey(
        JavascriptClientCodegen.PROJECT_NAME,
      )
    ) {
      (this as any).setProjectName(
        this.__additionalProperties.get(JavascriptClientCodegen.PROJECT_NAME),
      );
    }
    if (
      this.__additionalProperties.containsKey(
        JavascriptClientCodegen.MODULE_NAME,
      )
    ) {
      (this as any).setModuleName(
        this.__additionalProperties.get(JavascriptClientCodegen.MODULE_NAME),
      );
    }
    if (
      this.__additionalProperties.containsKey(
        JavascriptClientCodegen.PROJECT_DESCRIPTION,
      )
    ) {
      (this as any).setProjectDescription(
        this.__additionalProperties.get(
          JavascriptClientCodegen.PROJECT_DESCRIPTION,
        ),
      );
    }
    if (
      this.__additionalProperties.containsKey(
        JavascriptClientCodegen.PROJECT_VERSION,
      )
    ) {
      (this as any).setProjectVersion(
        this.__additionalProperties.get(
          JavascriptClientCodegen.PROJECT_VERSION,
        ),
      );
    }
    if (
      this.__additionalProperties.containsKey(
        JavascriptClientCodegen.PROJECT_LICENSE_NAME,
      )
    ) {
      (this as any).setProjectLicenseName(
        this.__additionalProperties.get(
          JavascriptClientCodegen.PROJECT_LICENSE_NAME,
        ),
      );
    }
    if (
      this.__additionalProperties.containsKey(
        CodegenConstants.LOCAL_VARIABLE_PREFIX,
      )
    ) {
      (this as any).setLocalVariablePrefix(
        this.__additionalProperties.get(CodegenConstants.LOCAL_VARIABLE_PREFIX),
      );
    }
    if (
      this.__additionalProperties.containsKey(CodegenConstants.SOURCE_FOLDER)
    ) {
      (this as any).setSourceFolder(
        this.__additionalProperties.get(CodegenConstants.SOURCE_FOLDER),
      );
    }
    if (
      this.__additionalProperties.containsKey(CodegenConstants.INVOKER_PACKAGE)
    ) {
      (this as any).setInvokerPackage(
        this.__additionalProperties.get(CodegenConstants.INVOKER_PACKAGE),
      );
    }
    if (
      this.__additionalProperties.containsKey(
        JavascriptClientCodegen.USE_PROMISES,
      )
    ) {
      this.usePromises = parseBoolean(
        this.__additionalProperties.get(JavascriptClientCodegen.USE_PROMISES),
      );
    }
    if (
      this.__additionalProperties.containsKey(
        JavascriptClientCodegen.USE_INHERITANCE,
      )
    ) {
      this.supportsInheritance = parseBoolean(
        this.__additionalProperties.get(
          JavascriptClientCodegen.USE_INHERITANCE,
        ),
      );
    } else {
      this.supportsInheritance = true;
    }
    if (
      this.__additionalProperties.containsKey(
        JavascriptClientCodegen.EMIT_MODEL_METHODS,
      )
    ) {
      (this as any).setEmitModelMethods(
        parseBoolean(
          this.__additionalProperties.get(
            JavascriptClientCodegen.EMIT_MODEL_METHODS,
          ),
        ),
      );
    }
    if (
      this.__additionalProperties.containsKey(
        JavascriptClientCodegen.EMIT_JS_DOC,
      )
    ) {
      (this as any).setEmitJSDoc(
        parseBoolean(
          this.__additionalProperties.get(JavascriptClientCodegen.EMIT_JS_DOC),
        ),
      );
    }
  }

  public preprocessSwagger(swagger) {
    super.preprocessSwagger(swagger);
    if (swagger.getInfo() != null) {
      const info = swagger.getInfo();
      if (isEmpty(this.projectName) && info.getTitle() != null) {
        this.projectName = this.sanitizeName(this.dashize(info.getTitle()));
      }
      if (isEmpty(this.projectVersion)) {
        this.projectVersion = this.escapeUnsafeCharacters(
          this.escapeQuotationMark(info.getVersion()),
        );
      }
      if (this.projectDescription == null && info.getDescription()) {
        this.projectDescription = this.sanitizeName(info.getDescription());
      }
      if (
        this.__additionalProperties.get(
          JavascriptClientCodegen.PROJECT_LICENSE_NAME,
        ) == null
      ) {
        const license = info.getLicense();
        if (license && license.getName()) {
          this.__additionalProperties.put(
            JavascriptClientCodegen.PROJECT_LICENSE_NAME,
            this.sanitizeName(license.getName()),
          );
        }
      }
    }
    if (isEmpty(this.projectName)) {
      this.projectName = 'swagger-js-client';
    }
    if (isEmpty(this.moduleName)) {
      this.moduleName = DefaultCodegen.camelize(
        DefaultCodegen.underscore(this.projectName),
      );
    }
    if (isEmpty(this.projectVersion)) {
      this.projectVersion = '1.0.0';
    }
    if (this.projectDescription == null) {
      this.projectDescription = 'Client library of ' + this.projectName;
    }
    this.__additionalProperties.put(
      JavascriptClientCodegen.PROJECT_NAME,
      this.projectName,
    );
    this.__additionalProperties.put(
      JavascriptClientCodegen.MODULE_NAME,
      this.moduleName,
    );
    this.__additionalProperties.put(
      JavascriptClientCodegen.PROJECT_DESCRIPTION,
      this.escapeText(this.projectDescription),
    );
    this.__additionalProperties.put(
      JavascriptClientCodegen.PROJECT_VERSION,
      this.projectVersion,
    );
    this.__additionalProperties.put(
      CodegenConstants.API_PACKAGE,
      this.__apiPackage,
    );
    this.__additionalProperties.put(
      CodegenConstants.INVOKER_PACKAGE,
      this.invokerPackage,
    );
    this.__additionalProperties.put(
      CodegenConstants.LOCAL_VARIABLE_PREFIX,
      this.localVariablePrefix,
    );
    this.__additionalProperties.put(
      CodegenConstants.MODEL_PACKAGE,
      this.__modelPackage,
    );
    this.__additionalProperties.put(
      CodegenConstants.SOURCE_FOLDER,
      this.sourceFolder,
    );
    this.__additionalProperties.put(
      JavascriptClientCodegen.USE_PROMISES,
      this.usePromises,
    );
    this.__additionalProperties.put(
      JavascriptClientCodegen.USE_INHERITANCE,
      this.supportsInheritance,
    );
    this.__additionalProperties.put(
      JavascriptClientCodegen.EMIT_MODEL_METHODS,
      this.emitModelMethods,
    );
    this.__additionalProperties.put(
      JavascriptClientCodegen.EMIT_JS_DOC,
      this.emitJSDoc,
    );
    this.__additionalProperties.put('apiDocPath', this.apiDocPath);
    this.__additionalProperties.put('modelDocPath', this.modelDocPath);
    this.__supportingFiles.push(
      new SupportingFile(
        'index.mustache',
        this.createPath(this.sourceFolder, this.invokerPackage),
        'index.js',
      ),
    );
    this.__supportingFiles.push(
      new SupportingFile(
        'ApiClient.mustache',
        this.createPath(this.sourceFolder, this.invokerPackage),
        'ApiClient.js',
      ),
    );
  }

  public escapeReservedWord(name) {
    return '_' + name;
  }

  /**
   * Concatenates an array of path segments into a path string.
   * @param segments The path segments to concatenate. A segment may contain either of the file separator characters '\' or '/'.
   * A segment is ignored if it is <code>null</code>, empty or &quot;.&quot;.
   * @return A path string using the correct platform-specific file separator character.
   */
  public createPath(...segments) {
    const buf = StringBuilder();
    for (const segment of segments) {
      if (!isEmpty(segment) && !(segment === '.')) {
        if (buf.length() !== 0) {
          buf.append(File.separatorChar);
        }
        buf.append(segment);
      }
    }

    return path.normalize(buf.toString());
  }

  public apiTestFileFolder() {
    return (
      this.__outputFolder +
      path.sep +
      'test' +
      path.sep +
      this.apiTestPath
    )
      .split(path.sep)
      .join(File.separatorChar);
  }

  public modelTestFileFolder() {
    return (
      this.__outputFolder +
      path.sep +
      'test' +
      path.sep +
      this.modelTestPath
    )
      .split(path.sep)
      .join(File.separatorChar);
  }

  public apiFileFolder() {
    return this.createPath(
      this.__outputFolder,
      this.sourceFolder,
      this.invokerPackage,
      this.apiPackage(),
    );
  }

  public modelFileFolder() {
    return this.createPath(
      this.__outputFolder,
      this.sourceFolder,
      this.invokerPackage,
      this.modelPackage(),
    );
  }

  public apiDocFileFolder() {
    return this.createPath(this.__outputFolder, this.apiDocPath);
  }

  public modelDocFileFolder() {
    return this.createPath(this.__outputFolder, this.modelDocPath);
  }

  public toApiDocFilename(name) {
    return this.toApiName(name);
  }

  public toModelDocFilename(name) {
    return this.toModelName(name);
  }

  public toApiTestFilename(name) {
    return this.toApiName(name) + '.spec';
  }

  public toModelTestFilename(name) {
    return this.toModelName(name) + '.spec';
  }

  public toVarName(name) {
    name = this.sanitizeName(name);
    if ('_' === name) {
      name = '_u';
    }
    if (name.match('^[A-Z_]*$')) {
      return name;
    }
    name = DefaultCodegen.camelize(name, true);
    if (this.isReservedWord(name) || name.match('^\\d.*')) {
      name = this.escapeReservedWord(name);
    }
    return name;
  }

  public toParamName(name) {
    return this.toVarName(name);
  }

  public toModelName(name) {
    name = this.sanitizeName(name);
    if (!isEmpty(this.modelNamePrefix)) {
      name = this.modelNamePrefix + '_' + name;
    }
    if (!isEmpty(this.modelNameSuffix)) {
      name = name + '_' + this.modelNameSuffix;
    }
    name = DefaultCodegen.camelize(name);
    if (this.isReservedWord(name)) {
      const modelName = 'Model' + name;
      log.warn(
        `${name} (reserved word) cannot be used as model name. Renamed to ${modelName}`,
      );
      return modelName;
    }
    if (name.match('^\\d.*')) {
      const modelName = 'Model' + name;
      log.warn(
        `${name} (model name starts with number) cannot be used as model name. Renamed to ${modelName}`,
      );
      return modelName;
    }
    return name;
  }

  public toModelFilename(name) {
    return this.toModelName(name);
  }

  public toModelImport(name) {
    return name;
  }

  public toApiImport(name) {
    return this.toApiName(name);
  }

  public getTypeDeclaration(p) {
    if (p != null && p instanceof ArrayProperty) {
      const inner = p.getItems();
      return '[' + this.getTypeDeclaration(inner) + ']';
    } else if (p != null && p instanceof MapProperty) {
      const inner = p.getAdditionalProperties();
      return '{String: ' + this.getTypeDeclaration(inner) + '}';
    }
    return super.getTypeDeclaration(p);
  }

  public toDefaultValue(p) {
    const dp = p.getDefault();
    if (dp != null) {
      if (p instanceof StringProperty) {
        return JSON.stringify(dp) + '';
      }
      if (
        p instanceof BooleanProperty ||
        p instanceof DoubleProperty ||
        p instanceof FloatProperty ||
        p instanceof IntegerProperty ||
        p instanceof LongProperty
      ) {
        return dp.toString();
      }
    }

    return dp;
  }

  public toDefaultValueWithParam(name, p) {
    const type = this.normalizeType(this.getTypeDeclaration(p));
    if (p instanceof RefProperty) {
      return ' = ' + type + ".constructFromObject(data['" + name + "']);";
    } else {
      return " = ApiClient.convertToType(data['" + name + "'], " + type + ');';
    }
  }

  public setParameterExampleValue(p) {
    let example;
    if (p.defaultValue == null) {
      example = p.example;
    } else {
      example = p.defaultValue;
    }
    let type = p.baseType;
    if (type == null) {
      type = p.dataType;
    }
    if ('String' === type) {
      if (example == null) {
        example = p.paramName + '_example';
      }
      example = '"' + this.escapeText(example) + '"';
    } else if ('Integer' === type) {
      if (example == null) {
        example = '56';
      }
    } else if ('Number' === type) {
      if (example == null) {
        example = '3.4';
      }
    } else if ('Boolean' === type) {
      if (example == null) {
        example = 'true';
      }
    } else if ('File' === type) {
      if (example == null) {
        example = '/path/to/file';
      }
      example = '"' + this.escapeText(example) + '"';
    } else if ('Date' === type) {
      if (example == null) {
        example = '2013-10-20T19:20:30+01:00';
      }
      example = 'new Date("' + this.escapeText(example) + '")';
    } else if (!this.__languageSpecificPrimitives.contains(type)) {
      example = 'new ' + this.moduleName + '.' + type + '()';
    }
    if (example == null) {
      example = 'null';
    } else if (p.isListContainer) {
      example = '[' + example + ']';
    } else if (p.isMapContainer) {
      example = '{key: ' + example + '}';
    }
    p.example = example;
  }

  /**
   * Normalize type by wrapping primitive types with single quotes.
   *
   * @param type Primitive type
   * @return Normalized type
   */
  public normalizeType(type) {
    return type.replace(
      new RegExp('\\b(Boolean|Integer|Number|String|Date)\\b', 'g'),
      "'$1'",
    );
  }

  public getSwaggerType(p) {
    const swaggerType = super.getSwaggerType(p);
    let type = null;
    if (this.__typeMapping.containsKey(swaggerType)) {
      type = this.__typeMapping.get(swaggerType);
      if (!this.needToImport(type)) {
        return type;
      }
    } else {
      type = swaggerType;
    }
    if (null == type) {
      log.error(`No Type defined for Property ${p}`);
    }
    return this.toModelName(type);
  }

  public toOperationId(operationId) {
    if (isEmpty(operationId)) {
      throw new Error('Empty method/operation name (operationId) not allowed');
    }
    operationId = DefaultCodegen.camelize(this.sanitizeName(operationId), true);
    if (this.isReservedWord(operationId)) {
      const newOperationId = DefaultCodegen.camelize(
        'call_' + operationId,
        true,
      );
      log.warn(
        `${operationId} (reserved word) cannot be used as method name. Renamed to ${newOperationId}`,
      );
      return newOperationId;
    }
    return operationId;
  }

  public fromOperation(pp, httpMethod, operation, definitions, swagger) {
    if (arguments.length > 4) {
      const op = super.fromOperation(
        pp,
        httpMethod,
        operation,
        definitions,
        swagger,
      );
      if (op.returnType != null) {
        op.returnType = this.normalizeType(op.returnType);
      }
      op.path = this.sanitizePath(op.path);
      let lastRequired = null;
      let lastOptional = null;
      for (const p of op.allParams) {
        if (p.required) {
          lastRequired = p;
        } else {
          lastOptional = p;
        }
      }
      for (const p of op.allParams) {
        if (p === lastRequired) {
          p._hasMoreRequired = false;
        } else if (p === lastOptional) {
          p._hasMoreOptional = false;
        } else {
          p._hasMoreRequired = true;
          p._hasMoreOptional = true;
        }
      }
      op._hasRequiredParams = lastRequired != null;
      return op;
    }
    return super.fromOperation(pp, httpMethod, operation, definitions);
  }

  public fromModel(name, model, allDefinitions) {
    if (arguments.length > 2) {
      let codegenModel = super.fromModel(name, model, allDefinitions);
      if (
        allDefinitions != null &&
        codegenModel != null &&
        codegenModel.parent != null &&
        codegenModel.hasEnums
      ) {
        const parentModel = allDefinitions.get(codegenModel.parentSchema);
        const parentCodegenModel = super.fromModel(
          codegenModel.parent,
          parentModel,
          allDefinitions,
        );
        codegenModel = JavascriptClientCodegen.reconcileInlineEnums(
          codegenModel,
          parentCodegenModel,
        );
      }
      if (model != null && model instanceof ArrayModel) {
        const am = model;
        if (am.getItems() != null) {
          codegenModel._isArray = true;
          codegenModel._itemType = this.getSwaggerType(am.getItems());
        }
      } else if (model != null && model instanceof ModelImpl) {
        const mm = model;
        if (mm.getAdditionalProperties() != null) {
          codegenModel._isMap = true;
          codegenModel._itemType = this.getSwaggerType(
            mm.getAdditionalProperties(),
          );
        }
      }
      return codegenModel;
    } else {
      return super.fromModel(name, model);
    }
  }

  public sanitizePath(p) {
    return p.replace(new RegExp("'", 'g'), '%27');
  }

  public trimBrackets(s) {
    if (s != null) {
      const beginIdx = s[0] === '[' ? 1 : 0;
      let endIdx = s.length;
      if (s[endIdx - 1] === ']') {
        endIdx--;
      }
      return s.substring(beginIdx, endIdx);
    }
    return null;
  }

  public getModelledType(dataType) {
    return (
      'module:' +
      (isEmpty(this.invokerPackage) ? '' : this.invokerPackage + '/') +
      (isEmpty(this.__modelPackage) ? '' : this.__modelPackage + '/') +
      dataType
    );
  }

  public getJSDocType(cm, cp?: any) {
    if (
      ((cm != null && cm instanceof CodegenModel) || cm === null) &&
      ((cp != null && cp instanceof CodegenProperty) || cp === null)
    ) {
      if (cp.isContainer) {
        if (cp.containerType === 'array') {
          return 'Array.<' + this.getJSDocType(cm, cp.items) + '>';
        } else if (cp.containerType === 'map') {
          return 'Object.<String, ' + this.getJSDocType(cm, cp.items) + '>';
        }
      }
      let dataType = this.trimBrackets(cp.datatypeWithEnum);
      if (cp.isEnum) {
        dataType = cm.classname + '.' + dataType;
      }
      if (this.isModelledType(cp)) {
        dataType = this.getModelledType(dataType);
      }
      return dataType;
    } else if (
      ((cm != null && cm instanceof CodegenParameter) || cm === null) &&
      cp === undefined
    ) {
      let dataType = this.trimBrackets(cm.dataType);
      if (this.isModelledType(cm)) {
        dataType = this.getModelledType(dataType);
      }
      if (cm.isListContainer) {
        return 'Array.<' + dataType + '>';
      } else if (cm.isMapContainer) {
        return 'Object.<String, ' + dataType + '>';
      }
      return dataType;
    } else if (
      ((cm != null && cm instanceof CodegenOperation) || cm === null) &&
      cp === undefined
    ) {
      let returnType = this.trimBrackets(cm.returnType);
      if (returnType != null) {
        if (this.isModelledType(cm)) {
          returnType = this.getModelledType(returnType);
        }
        if (cm.isListContainer) {
          return 'Array.<' + returnType + '>';
        } else if (cm.isMapContainer) {
          return 'Object.<String, ' + returnType + '>';
        }
      }
      return returnType;
    } else {
      throw new Error('invalid overload');
    }
  }

  public isModelledType(cp) {
    if ((cp != null && cp instanceof CodegenProperty) || cp === null) {
      return (
        cp.isEnum ||
        !this.__languageSpecificPrimitives.contains(
          cp.baseType == null ? cp.datatype : cp.baseType,
        )
      );
    } else if ((cp != null && cp instanceof CodegenParameter) || cp === null) {
      return (
        cp.isEnum ||
        !this.__languageSpecificPrimitives.contains(
          cp.baseType == null ? cp.dataType : cp.baseType,
        )
      );
    } else if ((cp != null && cp instanceof CodegenOperation) || cp === null) {
      return !cp.returnTypeIsPrimitive;
    }
    throw new Error('invalid overload');
  }

  public postProcessOperations(objs) {
    const operations = objs.get('operations');
    if (operations != null) {
      const ops = operations.get('operation');
      for (const operation of ops) {
        const argList: any[] = [];
        let hasOptionalParams = false;
        for (const p of operation.allParams) {
          if (p.required) {
            let flowsify = p.paramName;
            const swaggerType = p.dataType;
            if (this._swaggerToFlowMapping.containsKey(swaggerType)) {
              flowsify += `: ${this._swaggerToFlowMapping.get(swaggerType)}`;
            } else {
              flowsify += ': any';
            }
            argList.push(flowsify);
          } else {
            hasOptionalParams = true;
          }
        }
        if (hasOptionalParams) {
          argList.push('opts: any');
        }
        if (!this.usePromises) {
          argList.push('callback: Function');
        }
        operation._argList = argList.join(', ');
        for (const cp of operation.allParams) {
          cp._jsDocType = this.getJSDocType(cp);
        }
        operation.hasOptionalParams = hasOptionalParams;
        operation.hasParams = operation.allParams.length > 0;
        operation._jsDocType = this.getJSDocType(operation);
      }
    }
    Collections.sort(objs.get('imports'), (a, b) => {
      const a1 = a.get('import');
      const b1 = b.get('import');
      return a1.localeCompare(b1);
    });
    return objs;
  }

  public postProcessModels(objs) {
    objs = super.postProcessModelsEnum(objs);
    const models = objs.get('models');
    for (const mo of models) {
      const cm = mo.get('model');
      const required: any[] = [];
      const allRequired = this.supportsInheritance ? [] : required;
      cm._required = required;

      cm._allRequired = allRequired;

      for (const __var of cm.vars) {
        const jsDocType = this.getJSDocType(cm, __var);
        __var._jsDocType = jsDocType;

        if (__var.required) {
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
        } else if (vars.required != null && vars.required) {
          vars._hasMoreRequired = true;
        }
      }
    }
    return objs;
  }

  public needToImport(type) {
    return (
      !this.__defaultIncludes.contains(type) &&
      !this.__languageSpecificPrimitives.contains(type)
    );
  }

  public staticsanitizePackageName(packageName) {
    packageName = packageName.trim();
    packageName = packageName.replace(new RegExp('[^a-zA-Z0-9_\\.]', 'g'), '_');
    if (isEmpty(packageName)) {
      return 'invalidPackageName';
    }
    return packageName;
  }

  public toEnumName(property) {
    return this.sanitizeName(DefaultCodegen.camelize(property.name)) + 'Enum';
  }

  public toEnumVarName(value, datatype) {
    return value;
  }

  public toEnumValue(value, datatype) {
    if ('Integer' === datatype || 'Number' === datatype) {
      return value;
    } else {
      return '"' + this.escapeText(value) + '"';
    }
  }

  public escapeQuotationMark(input) {
    return (
      input &&
      input
        .split('"')
        .join('')
        .split("'")
        .join('')
    );
  }

  public escapeUnsafeCharacters(input) {
    return (
      input &&
      input
        .split('*/')
        .join('*_/')
        .split('/*')
        .join('/_*')
    );
  }
}
