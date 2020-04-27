import DefaultCodegen from '../DefaultCodegen';
import CliOption from '../CliOption';

export const BRDIGE_VERSION = 'bridgeVersion';
export default function mixit(clz, overide?: any) {
  const { processOpts, fromOperation, initalizeCliOptions } = clz.prototype;
  Object.assign(
    clz.prototype,
    {
      setBridgeVersion(version) {
        this.bridgeVersion = version;
      },
      getBridgeVersion() {
        return this.bridgeVersion;
      },
      processOpts() {
        processOpts.call(this);
        if (this.__additionalProperties.containsKey(BRDIGE_VERSION)) {
          this.setBridgeVersion(
            this.__additionalProperties.get(BRDIGE_VERSION),
          );
        }
      },
      initalizeCliOptions() {
        if (initalizeCliOptions) {
          initalizeCliOptions.call(this);
        }
        this.__cliOptions.push(
          new CliOption(BRDIGE_VERSION, 'The ERN Bridge Version to use'),
        );
      },
      fromOperation(path, httpMethod, operation, definitions, swagger) {
        const op = fromOperation.call(
          this,
          path,
          httpMethod,
          operation,
          definitions,
        );
        this.updateOperationWithRequestDetails(op);
        this.updateOperationWithResponseDetails(op);
        op.nickNameConstant = DefaultCodegen.underscore(
          op.nickname,
        ).toUpperCase();
        op.camelizedNickName = DefaultCodegen.camelize(op.nickname, false);
        return op;
      },

      updateOperationWithRequestDetails(op) {
        let requestTypeName;
        let requestVarName;
        const requestParam: any = {};
        if (op.hasParams) {
          if (op.allParams.length > 1) {
            requestTypeName =
              DefaultCodegen.camelize(op.nickname, false) + 'Data';
            requestVarName =
              DefaultCodegen.camelize(op.nickname, true) + 'Data';
            requestParam.isComposite = true;
          } else if (op.allParams.length === 1) {
            const p = op.allParams[0];
            requestTypeName = p.dataType;
            requestVarName = p.baseName;
            requestParam.isComposite = false;
            if (p.isListContainer) {
              requestParam.isList = true;
              requestParam.baseType = p.baseType;
              requestParam.containerType = 'List';
            }
          }
        }

        if (!requestTypeName) {
          requestTypeName = 'None';
        }

        requestParam.dataType = requestTypeName;
        requestParam.paramName =
          requestTypeName !== 'None' ? requestVarName : '';
        op.hasRequestParam = requestTypeName !== 'None';
        op.requestParam = requestParam;
      },

      updateOperationWithResponseDetails(op) {
        let responseType;
        const responseParam: any = {};

        for (const response of op.responses) {
          if (
            response.code === '200' ||
            response.code === 'default' ||
            /2\d{2}/.test(response.code)
          ) {
            responseType = response.dataType;
            if (
              response.isListContainer ||
              response.containerType === 'array'
            ) {
              responseParam.isList = true;
              responseParam.baseType = response.baseType;
              responseParam.containerType = 'List';
            }
            break;
          }
        }
        if (!responseType) {
          responseType = 'None';
        }
        responseParam.dataType = responseType;

        op.responseParam = responseParam;
      },

      apiFilename(templateName, tag) {
        const suffix = this.apiTemplateFiles().get(templateName);
        if (templateName === 'apirequests.mustache') {
          return (
            this.apiFileFolder() +
            '/' +
            this.toModelName(tag) +
            'Requests' +
            suffix
          );
        } else if (templateName === 'apievents.mustache') {
          return (
            this.apiFileFolder() +
            '/' +
            this.toModelName(tag) +
            'Events' +
            suffix
          );
        } else {
          return this.apiFileFolder() + '/' + this.toApiFilename(tag) + suffix;
        }
      },

      shouldGenerateApiFor(templateName, operation) {
        if (templateName === 'apievents.mustache') {
          return operation.get('hasEvent');
        }
        return true;
      },

      addLicenseFile() {
        return false;
      },

      addSwaggerIgnoreFile() {
        return false;
      },

      postProcessOperations(operations) {
        const ops = operations.get('operations').get('operation');
        const requestDataObjects: any = [];
        for (const operation of ops) {
          if (operation.httpMethod === 'EVENT') {
            operation.isEvent = true;
            operations.put('hasEvent', true);
          }

          if (operation.hasRequestParam) {
            const requestDataObject: any = {};
            const requiredParams: any = [];
            const optionalParams: any = [];

            const imports: any = [];

            for (const param of operation.allParams) {
              const paramCopy = { ...param };
              paramCopy.hasMore = true;
              for (const imp of operation.imports) {
                if (imp === paramCopy.baseType) {
                  imports.push(this.toModelImport(imp));
                }
              }
              if (param.required) {
                requiredParams.push(paramCopy);
              } else {
                optionalParams.push(paramCopy);
              }
            }

            if (requiredParams.length) {
              requiredParams[requiredParams.length - 1].hasMore = false;
            }

            if (optionalParams.length) {
              optionalParams[optionalParams.length - 1].hasMore = false;
            }

            // When there is more than one param, should generate a container class for the params since the request API can only hold one param.
            if (operation.allParams.length > 1) {
              requestDataObject.imports = imports;
              requestDataObject.description = operation.description;
              requestDataObject.requestDataType =
                operation.requestParam.dataType;
              requestDataObject.allParams = operation.allParams;
              requestDataObject.requiredParams = requiredParams;
              requestDataObject.optionalParams = optionalParams;
              requestDataObject.package = operations.get('package');
              requestDataObjects.push(requestDataObject);
            } else if (operation.allParams.length === 1) {
              operation.hasSingleParam = true;
            }
          }
        }
        operations.put('requestDataObjects', requestDataObjects);
        operations.put(
          'requestsImplClassName',
          this.toModelName(
            operations.get('operations').get('pathPrefix') + 'Requests',
          ),
        );
        operations.put(
          'eventsImplClassName',
          this.toModelName(
            operations.get('operations').get('pathPrefix') + 'Events',
          ),
        );
        operations.put('bridgeVersion', this.getBridgeVersion());
        return operations;
      },
    },
    overide,
  );
  return clz;
}
