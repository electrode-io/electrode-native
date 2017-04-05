import {newHashMap, HashMap} from "./javaUtil";
import factory from "../models/factory";
import Response from "sway/lib/types/response";
import SwaggerApi from "sway/lib/types/api";
import Path from "sway/lib/types/path";
import Operation from "sway/lib/types/operation";
import parameterFactory from "../models/parameters";
import {beanify, apply} from "./beanUtils";
import {Property} from "../models/properties";
import {toModel} from '../models/PropertyBuilder';
import authFactory from '../models/auth'
import Sway from "sway";
import {upperFirst} from './StringUtils';
import supportedHttpMethods from 'swagger-methods';
supportedHttpMethods.push('event');
/**
 * This class fixes up Sway so that it can work as the model for swagger-codegen.
 *
 */
supportedHttpMethods.map(function method(name) {
    this[`get${upperFirst(name)}`] = function () {
        return this.getOperation(name);
    }
}, Path.prototype);

Path.prototype.toJSON = function () {
    return this.definition;
};
const _asResponse = (r) => [(r.statusCode || 'default') + '', r];

function asParameter(p) {
    if (p.definition && '$ref' in p.definition) {
        return parameterFactory(p.definitionFullyResolved);
    }
    return parameterFactory(p.definition);

}
beanify(Object.assign(Operation.prototype, {
    getVendorExtensions(){
        if (!this._vendorExtensions) {
            this._vendorExtensions = newHashMap();
        }
        return this._vendorExtensions;
    },
    getParameters() {
        if (!this._parameters) {

            if (this.parameterObjects) {
                this._parameters = this.parameterObjects.map(asParameter);
            } else if (this.parameters) {
                this._parameters = this.parameters.map(parameterFactory);
            }
        }
        return this._parameters;
    },
    getResponses() {
        if (!this._responses) {
            this._responses = newHashMap(...this.responseObjects.map(_asResponse));
        }
        return this._responses;
    },
    getSchema(){
        if (this._schema === void(0)) {
            this._schema = this.schema ? factory(this.schema) : null;
        }
        return this._schema;
    },
    setParameters(parameters){
        this._parameters = parameters ? parameters.map(parameterFactory) : [];
    }
}), ['produces', 'summary', 'tags', 'operationId', 'description', 'externalDocs', 'consumes', 'schemes', 'method', 'securityDefinitions']);


beanify(Object.assign(Response.prototype, {
    getSchema () {
        if (this._schema === void(0)) {
            if (!this.definition.schema) {
                this._schema = null;
            } else {
                this._schema = factory(Object.assign({description: this.definition.description}, this.definition.schema));
            }
        }
        return this._schema;
    },
    setSchema(schema) {
        if (schema instanceof Property)
            this._schema = schema;
        else
            this.schema = schema;
    },
    getCode(){
        return this.statusCode;
    },
    getHeaders(){
        return this.headers && newHashMap(...Object.keys(this.headers).map(key => [key, this.headers[key]]));
    },
    toJSON(){
        return this.definition;
    }
}), ['description', 'statusCode', 'examples']);

class VendorExtensions {

    setVendorExtensions(extensions) {
        this.vendorExtensions = extensions;
    }

    getVendorExtensions() {
        if (!this.vendorExtensions)
            this.setVendorExtensions(new HashMap);
        return this.vendorExtensions;
    }

}
class Contact extends VendorExtensions {
}

beanify(Contact.prototype, ['name', 'url', 'email']);

class License extends VendorExtensions {

}

beanify(License.prototype, ['name', 'url']);

class Info {
    getContact() {
        return apply(new Contact(), this.contact);
    }

    getLicense() {
        return apply(new License(), this.license);
    }
}


beanify(Info.prototype, ['title', 'description', 'version', 'title', 'termsOfService']);


Object.assign(SwaggerApi.prototype, {
    addDefinition(name, definition) {
        let definitions = this.getDefinitions();
        if (definitions == null) {
            definitions = this._definitions = newHashMap();
        }
        definitions.put(name, definition);
        return this;
    },
    getDefinitions() {
        if (this._definitions === void(0)) {
            if (this.definitions == null) {
                this._definitions = null;
            } else {
                const defs = Object.keys(this.definitions).map(key => [key, toModel(factory(Object.assign({
                    name: key
                }, this.definitions[key])))]);


                this._definitions = newHashMap(...defs);
            }
        }
        return this._definitions;
    },

    getInfo(){
        if (!this._info) {
            this._info = apply(new Info(), this.info);
        }
        return this._info;
    },
    getSecurityDefinitions(){
        if (!this._securityDefinitions) {
            const securityDefinitions = this.definitionFullyResolved.securityDefinitions || {};
            const defs = Object.keys(securityDefinitions).map(key => [key, authFactory(securityDefinitions[key])]);
            this._securityDefinitions = newHashMap(...defs);
        }
        return this._securityDefinitions
    }
});

beanify(SwaggerApi.prototype, ['info', 'host', 'basePath', 'tags', 'schemes', 'produces', 'consumes', 'security', 'paths',
    'securityDefinitions', 'definitions', 'parameters', 'responses', 'externalDocs', ['vendorExtensions', newHashMap]
]);


export default Sway;
