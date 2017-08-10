import {newHashMap} from "../java/javaUtil";
import factory from "./factory";
import {has} from "../java/beanUtils";
import GenericRef from './refs/GenericRef';
import RefType from './refs/RefType';
import Xml from './Xml';

export class Property {
    static allowedProps = ["title", "type", "format", "description", "name", "readOnly", "position", "access", "enum", "example", "externalDocs", "required", "xml", ["default", null, "_"]];

    constructor(obj, parent) {
        if (parent) {
            this.getParent = () => parent;
        }
    }

    getType() {
        return this.type || this.constructor.TYPE;
    }

    getFormat() {
        return this.format || this.constructor.FORMAT;
    }

    setXml(xml) {
        if (xml instanceof Xml) {
            this.xml = xml;
        }
        this.xml = new Xml(xml);
    }

    getVendorExtensions() {
        if (!this.vendorExtensions) {
            return newHashMap();
        }
        return this.vendorExtensions
    }

    toString() {
        return `[${this.constructor.name}]${JSON.stringify(this, null, 2)}`;
    }

    toXml() {

    }
}
export class AbstractNumericProperty extends Property {
    static allowedProps = [...Property.allowedProps, "minimum", "maximum", "exclusiveMinimum", "exclusiveMaximum", "multipleOf"];

}

function objectToPropertyMap(obj) {
    return newHashMap(...Object.keys(obj).map(key => [key, factory(obj[key], this)]));
}
class _ObjectProperty extends Property {
    static allowedProps = [...Property.allowedProps, "additionalProperties", "required",
        "minProperties", "maxProperties", "anyOf", "allOf", "readOnly", "vendorExtensions", "xml"];

    constructor(obj, parent) {
        super(obj, parent);
        // this.setRequiredProperties(obj.required);
    }

    getAdditionalProperties() {
        return this._additionalProperties;
    }

    setAdditionalProperties(properties) {
        if (!properties) {
            this._additionalProperties = null;
        }
        if (properties.type) {
            this._additionalProperties = factory(properties);
        } else {
            this._additionalProperties = objectToPropertyMap(properties);
        }
    }

    setProperties(properties) {
        this.properties = objectToPropertyMap(properties);

    }

    getRequiredProperties() {
        const required = [];
        for (const [key, prop] of this.properties) {
            if (prop.required) required.push(key);
        }
        return required;
    }

    setRequiredProperties(required) {
        for (const [key, prop] of this.properties) {
            const isRequired = required ? required.indexOf(key) != -1 : false;
            if (has(prop, 'required') || isRequired) {
                prop.required = isRequired;
            }
        }
    }
}

export class ObjectProperty extends _ObjectProperty {
    static TYPE = "object";
    static allowedProps = [..._ObjectProperty.allowedProps, 'properties']
}
export class MapProperty extends _ObjectProperty {
    static TYPE = "object";
}
export class RefProperty extends Property {
    static TYPE = "ref";
    static allowedProps = [...Property.allowedProps, '$ref'];

    constructor(ref) {
        super();
        if (ref && ref.$ref) this.set$ref(ref.$ref);
        else if (typeof ref === 'string')
            this.set$ref(ref);

    }

    set$ref(ref) {
        this.genericRef = new GenericRef(RefType.DEFINITION, ref);
    }

    get$ref() {
        return this.genericRef.getRef();
    }

    asDefault(ref) {
        this.set$ref(RefType.DEFINITION.getInternalPrefix() + ref);
        return this;
    }

    getSimpleRef() {
        if (this.genericRef != null) {
            const simp = this.genericRef.getSimpleRef();
            return simp;
        }
    }

    getRefFormat() {
        if (this.genericRef != null) {
            return this.genericRef.getFormat();
        }

    }
}
export class ArrayProperty extends Property {
    static TYPE = "array";
    static allowedProps = [...Property.allowedProps, "uniqueItems", "items", "maxItems", "minItems"];

    items(items) {
        this.setItems(items);
        return this;
    }

    getItems() {
        return this._items;
    }

    setItems(items) {
        this._items = factory(items, this);
    }
}
export class BooleanProperty extends Property {
    static TYPE = "boolean";
}

export class StringProperty extends Property {
    static TYPE = "string";
    static allowedProps = [...Property.allowedProps, "minLength", "maxLength", "pattern"];

}

export class NumberProperty extends AbstractNumericProperty {
    static TYPE = "number";
}
export class BaseIntegerProperty extends AbstractNumericProperty {
    static TYPE = "integer";
}
export class IntegerProperty extends BaseIntegerProperty {
    static FORMAT = "integer";
}
export class LongProperty extends NumberProperty {
    static FORMAT = "long";
}
export class Int64Property extends LongProperty {
    static FORMAT = "int64";
    static TYPE = "integer";
}
export class Int32Property extends BaseIntegerProperty {
    static FORMAT = "int32";
    static TYPE = "integer";
}
export class DoubleProperty extends NumberProperty {
    static FORMAT = "double";
}

export class DecimalProperty extends NumberProperty {
    static FORMAT = "decimal";
}

export class FloatProperty extends NumberProperty {
    static FORMAT = "float";
}

export class ByteArrayProperty extends StringProperty {
    static FORMAT = "byte-array";
}

export class ByteProperty extends StringProperty {
    static FORMAT = "byte";
}
export class BinaryProperty extends StringProperty {
    static FORMAT = "binary";
}
export class EmailProperty extends StringProperty {
    static FORMAT = "email";
}
export class DateProperty extends StringProperty {
    static FORMAT = "date";
}

export class DateTimeProperty extends StringProperty {
    static FORMAT = "date-time";
}

export class UriProperty extends StringProperty {
    static FORMAT = "uri";
}

export class UrlProperty extends UriProperty {
    static FORMAT = "url";
}

export class UUIDProperty extends Property {
    static FORMAT = "uuid";
    static TYPE = "string";
}

export class NullProperty extends Property {
    static TYPE = "null";
}
export class FileProperty extends StringProperty {
    static TYPE = "file";
}
