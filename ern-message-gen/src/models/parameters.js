import {newHashMap} from '../java/javaUtil';
import RefType from './refs/RefType';
import GenericRef from './refs/GenericRef';
import {apply, beanify} from '../java/beanUtils';
import {toModel} from './PropertyBuilder';

export class Parameter {
    required = false;
    vendorExtensions = newHashMap();

    isUniqueItems() {
        return this.uniqueItems
    }

    isExclusiveMinimum() {
        return this.exclusiveMinimum != null;
    }

    isExclusiveMaximum() {
        return this.exclusiveMaximum != null;
    }

    setFormat(format) {
        this.format = format
    }

    getFormat() {
        return this.format
    }

    getIn() {
        return this.in;
    };


    isReadOnly() {
        return this.readOnly;
    };

    setVendorExtension(name, value) {
        if (name.startsWith("-x")) {
            this.vendorExtensions.put(name, value);
        }
    };

    getVendorExtensions() {
        return this.vendorExtensions;
    }

    getDefaultValue() {
        return this.defaultValue;
    }


    setDefaultValue(defaultValue) {
        this.defaultValue = defaultValue;
    }

    getDefault() {
        if (this.defaultValue == null || this.defaultValue.length == 0) {
            return null;
        }

        return this.defaultValue;
    }

    setDefault(defaultValue) {
        this.defaultValue = defaultValue == null ? null : defaultValue.toString();
    }

    copy() {
        return apply(new this.constructor, this);
    }
}
export class SerializableParameter extends Parameter {

}


export class BodyParameter extends Parameter {
    static TYPE = "body";

    getSchema() {
        return this.schema;
    }

    setSchema(schema) {
        this.schema = toModel(schema);
    }
}
export class CookieParameter extends SerializableParameter {
    static TYPE = "cookie";
}
export class FormParameter extends SerializableParameter {
    static TYPE = "formData";

    getDefaultCollectionFormat() {
        return "multi";
    }
}
export class HeaderParameter extends SerializableParameter {
    static TYPE = "header";
}
export class PathParameter extends SerializableParameter {
    static TYPE = "path";
    required = true;
}
export class QueryParameter extends SerializableParameter {
    static TYPE = "query";

    getDefaultCollectionFormat() {
        return "multi";
    }
}

export class RefParameter extends Parameter {
    static TYPE = "ref";

    constructor({$ref}={}) {
        super();
        this.set$ref($ref);
    }

    asDefault(ref) {
        this.set$ref(RefType.PARAMETER.getInternalPrefix() + ref);
        return this;
    }

    set$ref(ref) {
        this.genericRef = new GenericRef(RefType.PARAMETER, ref);
    }

    getRefFormat() {
        return this.genericRef.getFormat();
    }

    getSimpleRef() {
        return this.genericRef.getSimpleRef();
    }
}

beanify(Parameter.prototype, ["name", "enum", "in", "description", "required", "type", "items", "collectionFormat", "default", "maximum",
    "exclusiveMaximum", "minimum", "exclusiveMinimum", "maxLength", "minLength", "pattern", "maxItems", "minItems",
    "uniqueItems", "multipleOf", "format"]);

const TYPES = [BodyParameter, CookieParameter, FormParameter, HeaderParameter, PathParameter, QueryParameter, RefParameter];

export default function (val) {

    if (val instanceof Parameter) return val;

    for (const ParameterType of TYPES) {
        if (ParameterType.TYPE == val.in) {
            const ret = apply(new ParameterType(val), val);
            return ret;
        }
    }
    if ('$ref' in val) {
        const rp = new RefParameter(val);

        return apply(rp, val);
    }
    throw new Error(`Could not resolve parameter type: ${val.in}`)
}
