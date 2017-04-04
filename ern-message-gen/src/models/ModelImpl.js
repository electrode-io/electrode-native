import {Collections, newHashMap, HashMap, asMap} from "../java/javaUtil";
import AbstractModel from "./AbstractModel";
import {apply} from '../java/beanUtils';
import factory from './factory';

export default class ModelImpl extends AbstractModel {
    static OBJECT = "object";

    __isSimple = false;

    _enum(value) {
        var _this = this;
        if (Array.isArray(value)) {
            this.__enum = value;
        } else if (value != null) {
            this.__enum = [value];
        }
        return this;
    };

    getEnum() {
        return this.___enum;
    };

    setEnum(_enum) {
        this.___enum = _enum;
    };

    discriminator(discriminator) {
        this.setDiscriminator(discriminator);
        return this;
    };

    type(type) {
        this.setType(type);
        return this;
    };

    format(format) {
        this.setFormat(format);
        return this;
    };

    name(name) {
        this.setName(name);
        return this;
    };

    uniqueItems(uniqueItems) {
        this.setUniqueItems(uniqueItems);
        return this;
    };

    allowEmptyValue(allowEmptyValue) {
        this.setAllowEmptyValue(allowEmptyValue);
        return this;
    };

    description(description) {
        this.setDescription(description);
        return this;
    };

    property(key, property) {
        this.addProperty(key, property);
        return this;
    };

    example(example) {
        this.setExample(example);
        return this;
    };

    additionalProperties(additionalProperties) {
        this.setAdditionalProperties(additionalProperties);
        return this;
    };

    required(name) {
        this.addRequired(name);
        return this;
    };

    xml(xml) {
        this.setXml(xml);
        return this;
    };

    minimum(minimum) {
        this.__minimum = minimum;
        return this;
    };

    maximum(maximum) {
        this.__maximum = maximum;
        return this;
    };

    getDiscriminator() {
        return this.__discriminator;
    };

    setDiscriminator(discriminator) {
        this.__discriminator = discriminator;
    };

    getName() {
        return this.__name;
    };

    setName(name) {
        this.__name = name;
    };

    getDescription() {
        return this.__description;
    };

    setDescription(description) {
        this.__description = description;
    };

    isSimple() {
        return this.__isSimple;
    };

    setSimple(isSimple) {
        this.__isSimple = isSimple;
    };

    getAdditionalProperties() {
        return this.__additionalProperties;
    };

    setAdditionalProperties(additionalProperties) {
        this.type(ModelImpl.OBJECT);
        this.__additionalProperties = additionalProperties;
    };

    getAllowEmptyValue() {
        return this.__allowEmptyValue;
    };

    setAllowEmptyValue(allowEmptyValue) {
        if (allowEmptyValue != null) {
            this.__allowEmptyValue = allowEmptyValue;
        }
    };

    getType() {
        return this.__type;
    };

    setType(type) {
        this.__type = type;
    };

    getFormat() {
        return this.__format;
    };

    setFormat(format) {
        this.__format = format;
    };

    addRequired(name) {
        if (this.__required == null) {
            this.__required = []
        }
        this.__required.push(name);
        const p = this.properties.get(name);
        if (p != null) {
            p.setRequired(true);
        }
    };

    getRequired() {
        const output = [];
        if (this.properties != null) {
            for (const [key, prop] of this.properties) {
                if (prop != null && prop.getRequired()) {
                    output.push(key);
                }
            }
        }
        if (output.length == 0)  return null;
        Collections.sort(output);
        return output;
    };

    setRequired(required) {
        this.__required = required;
        if (this.properties != null) {
            for (const s of required) {
                const p = this.properties.get(s);
                if (p != null) {
                    p.setRequired(true);
                }
            }
        }
    };

    addProperty(key, property) {
        if (property == null) {
            return;
        }
        if (this.properties == null) {
            this.properties = newHashMap();
        }
        if (this.__required != null) {
            if (this.__required.indexOf(key) > -1) {
                property.setRequired(true);
            }
        }
        this.properties.put(key, factory(property));
    };

    getProperties() {
        return this.properties;
    };

    setProperties(properties) {
        if (properties != null) {
            for (const [key, property] of asMap(properties)) {
                this.addProperty(key, property);
            }
        }
    };

    getExample() {
        if (this.__example == null) {
        }
        return this.__example;
    };

    setExample(example) {
        this.__example = example;
    };

    getXml() {
        return this.__xml;
    };

    setXml(xml) {
        this.__xml = xml;
    };

    getDefaultValue() {
        if (this.defaultValue == null) {
            return null;
        }
        try {
            if (("integer" === this.__type)) {
                return parseInt(this.defaultValue, 10);
            }
            if (("number" === this.__type)) {
                return parseFloat(this.defaultValue);
            }
        }
        catch (e) {
            return null;
        }
        return this.defaultValue;
    };

    setDefaultValue(defaultValue) {
        this.defaultValue = defaultValue;
    };

    getMinimum() {
        return this.__minimum;
    };

    setMinimum(minimum) {
        this.__minimum = minimum;
    };

    getMaximum() {
        return this.__maximum;
    };

    setMaximum(maximum) {
        this.__maximum = maximum;
    };

    getUniqueItems() {
        return this.__uniqueItems;
    };

    getReadOnly() {
        return this.__readOnly;
    }

    setReadOnly(ro) {
        this.__readOnly = ro;
    }

    setUniqueItems(uniqueItems) {
        this.__uniqueItems = uniqueItems;
    };

    clone() {
        return apply(new this.constructor, this);
    };
}
