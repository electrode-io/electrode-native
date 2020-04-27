/* tslint:disable:variable-name */
import { Property } from './Property';
import factory from '../factory';
import { newHashMap } from '../../java/javaUtil';
import { has } from '../../java/beanUtils';

function objectToPropertyMap(obj) {
  return newHashMap(
    ...Object.keys(obj).map(key => [key, factory(obj[key], obj)]),
  );
}

export class ObjectPropertyBase extends Property {
  public static allowedProps = [
    ...Property.allowedProps,
    'additionalProperties',
    'required',
    'minProperties',
    'maxProperties',
    'anyOf',
    'allOf',
    'readOnly',
    'vendorExtensions',
    'xml',
  ];

  public _additionalProperties;
  public properties;

  constructor(obj?: any, parent?: any) {
    super(obj, parent);
  }

  public getAdditionalProperties() {
    return this._additionalProperties;
  }

  public setAdditionalProperties(properties) {
    if (!properties) {
      this._additionalProperties = null;
    }
    // @todo the ref support here is only dangerously supported
    // { $ref: '#/definition/ModelName }
    if (properties.type || properties.$ref || properties.genericRef) {
      this._additionalProperties = factory(properties);
    } else {
      this._additionalProperties = objectToPropertyMap(properties);
    }
  }

  public setProperties(properties) {
    this.properties = objectToPropertyMap(properties);
  }

  public getRequiredProperties() {
    const required: any[] = [];
    for (const [key, prop] of this.properties) {
      if (prop.required) {
        required.push(key);
      }
    }
    return required;
  }

  public setRequiredProperties(required) {
    for (const [key, prop] of this.properties) {
      const isRequired = required ? required.indexOf(key) !== -1 : false;
      if (has(prop, 'required') || isRequired) {
        prop.required = isRequired;
      }
    }
  }
}
