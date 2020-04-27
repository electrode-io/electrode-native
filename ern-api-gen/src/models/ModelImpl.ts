/* tslint:disable:variable-name */
import { asMap, Collections, newHashMap } from '../java/javaUtil';
import AbstractModel from './AbstractModel';
import factory from './factory';

export default class ModelImpl extends AbstractModel {
  public static OBJECT = 'object';

  public __isSimple = false;
  public __enum;
  public ___enum;
  public __minimum;
  public __maximum;
  public __discriminator;
  public __name;
  public __description;
  public __additionalProperties;
  public __allowEmptyValue;
  public __type;
  public __format;
  public __required;
  public properties;
  public __example;
  public __xml;
  public defaultValue;
  public __uniqueItems;
  public __readOnly;

  public _enum(value) {
    if (Array.isArray(value)) {
      this.__enum = value;
    } else if (value != null) {
      this.__enum = [value];
    }
    return this;
  }

  public getEnum() {
    return this.___enum;
  }

  public setEnum(_enum) {
    this.___enum = _enum;
  }

  public discriminator(discriminator) {
    this.setDiscriminator(discriminator);
    return this;
  }

  public type(type) {
    this.setType(type);
    return this;
  }

  public format(format) {
    this.setFormat(format);
    return this;
  }

  public name(name) {
    this.setName(name);
    return this;
  }

  public uniqueItems(uniqueItems) {
    this.setUniqueItems(uniqueItems);
    return this;
  }

  public allowEmptyValue(allowEmptyValue) {
    this.setAllowEmptyValue(allowEmptyValue);
    return this;
  }

  public description(description) {
    this.setDescription(description);
    return this;
  }

  public property(key, property) {
    this.addProperty(key, property);
    return this;
  }

  public example(example) {
    this.setExample(example);
    return this;
  }

  public additionalProperties(additionalProperties) {
    this.setAdditionalProperties(additionalProperties);
    return this;
  }

  public required(name) {
    this.addRequired(name);
    return this;
  }

  public xml(xml) {
    this.setXml(xml);
    return this;
  }

  public minimum(minimum) {
    this.__minimum = minimum;
    return this;
  }

  public maximum(maximum) {
    this.__maximum = maximum;
    return this;
  }

  public getDiscriminator() {
    return this.__discriminator;
  }

  public setDiscriminator(discriminator) {
    this.__discriminator = discriminator;
  }

  public getName() {
    return this.__name;
  }

  public setName(name) {
    this.__name = name;
  }

  public getDescription() {
    return this.__description;
  }

  public setDescription(description) {
    this.__description = description;
  }

  public isSimple() {
    return this.__isSimple;
  }

  public setSimple(isSimple) {
    this.__isSimple = isSimple;
  }

  public getAdditionalProperties() {
    return this.__additionalProperties;
  }

  public setAdditionalProperties(additionalProperties) {
    this.type(ModelImpl.OBJECT);
    this.__additionalProperties = additionalProperties;
  }

  public getAllowEmptyValue() {
    return this.__allowEmptyValue;
  }

  public setAllowEmptyValue(allowEmptyValue) {
    if (allowEmptyValue != null) {
      this.__allowEmptyValue = allowEmptyValue;
    }
  }

  public getType() {
    return this.__type;
  }

  public setType(type) {
    this.__type = type;
  }

  public getFormat() {
    return this.__format;
  }

  public setFormat(format) {
    this.__format = format;
  }

  public addRequired(name) {
    if (this.__required == null) {
      this.__required = [];
    }
    this.__required.push(name);
    const p = this.properties.get(name);
    if (p != null) {
      p.setRequired(true);
    }
  }

  public getRequired() {
    const output: any[] = [];
    if (this.properties != null) {
      for (const [key, prop] of this.properties) {
        if (prop != null && prop.getRequired()) {
          output.push(key);
        }
      }
    }
    if (output.length === 0) {
      return null;
    }
    Collections.sort(output);
    return output;
  }

  public setRequired(required) {
    this.__required = required;
    if (this.properties != null) {
      for (const s of required) {
        const p = this.properties.get(s);
        if (p != null) {
          p.setRequired(true);
        }
      }
    }
  }

  public addProperty(key, property) {
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
  }

  public getProperties() {
    return this.properties;
  }

  public setProperties(properties) {
    if (properties != null) {
      for (const [key, property] of asMap(properties)) {
        this.addProperty(key, property);
      }
    }
  }

  public getExample() {
    if (this.__example == null) {
      // Empty
    }
    return this.__example;
  }

  public setExample(example) {
    this.__example = example;
  }

  public getXml() {
    return this.__xml;
  }

  public setXml(xml) {
    this.__xml = xml;
  }

  public getDefaultValue() {
    if (this.defaultValue == null) {
      return null;
    }
    try {
      if ('integer' === this.__type) {
        return parseInt(this.defaultValue, 10);
      }
      if ('number' === this.__type) {
        return parseFloat(this.defaultValue);
      }
    } catch (e) {
      return null;
    }
    return this.defaultValue;
  }

  public setDefaultValue(defaultValue) {
    this.defaultValue = defaultValue;
  }

  public getMinimum() {
    return this.__minimum;
  }

  public setMinimum(minimum) {
    this.__minimum = minimum;
  }

  public getMaximum() {
    return this.__maximum;
  }

  public setMaximum(maximum) {
    this.__maximum = maximum;
  }

  public getUniqueItems() {
    return this.__uniqueItems;
  }

  public getReadOnly() {
    return this.__readOnly;
  }

  public setReadOnly(ro) {
    this.__readOnly = ro;
  }

  public setUniqueItems(uniqueItems) {
    this.__uniqueItems = uniqueItems;
  }

  public clone() {
    const res = new ModelImpl();
    res.__isSimple = this.__isSimple;
    res.__enum = this.__enum;
    res.___enum = this.___enum;
    res.__minimum = this.__minimum;
    res.__maximum = this.__maximum;
    res.__discriminator = this.__discriminator;
    res.__name = this.__name;
    res.__description = this.__description;
    res.__additionalProperties = this.__additionalProperties;
    res.__allowEmptyValue = this.__allowEmptyValue;
    res.__type = this.__type;
    res.__format = this.__format;
    res.__required = this.__required;
    res.properties = this.properties;
    res.__example = this.__example;
    res.__xml = this.__xml;
    res.defaultValue = this.defaultValue;
    res.__uniqueItems = this.__uniqueItems;
    res.__readOnly = this.__readOnly;
    res.vendorExtensions = this.vendorExtensions;
    res.externalDocs = this.externalDocs;
    res.title = this.title;
    res.reference = this.reference;
    return res;
  }
}
