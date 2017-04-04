import * as properties from "./properties";
import {beanify, apply} from "../java/beanUtils";
import ComposedModel from './ComposedModel';

const values = (obj) => Object.keys(obj).map(key => {
    return obj[key]
});

/**
 * Best guess here. It is possible for json schema to refer
 * to types that we do not support. I.E, union types.
 * @param prop
 * @returns {*}
 */
let TYPES;
let STR_TYPES;
export function resolve(prop = {}) {

    TYPES = TYPES || values(properties);
    STR_TYPES = STR_TYPES || TYPES.filter(function (t) {
            return t && t.TYPE === 'string';
        });
    if (prop == null){
        return properties.NullProperty;
    }
    if (prop.format && prop.type === 'string') {
        for (const clz of STR_TYPES) {
            if (prop.format === clz.FORMAT)
                return clz;
        }
    }

    for (const clz of TYPES) {
        if (!prop.type) {
            if ('properties' in prop) {
                if (prop.additionalProperties) {
                    return properties.MapProperty;
                }
                return properties.ObjectProperty;
            }
            if ('anyOf' in prop) {
                return properties.ObjectProperty;
            }
            if ('items' in prop) {
                return properties.ArrayProperty;
            }
            if ('$ref' in prop) {
                return properties.RefProperty;
            }
            if (prop.minimum || prop.maximum || prop.exclusiveMinimum || prop.exclusiveMaximum || prop.multipleOf) {
                return properties.NumberProperty;
            }
            if (prop.minLength || prop.maxLength || prop.pattern) {
                return properties.StringProperty;
            }
            if (prop.format) {
                for (const strClz of STR_TYPES) {
                    if (strClz.FORMAT === prop.format)
                        return strClz;
                }
            }
        } else if (clz.TYPE === prop.type) {
            if (prop.type === 'object') {
                return prop.additionalProperties ? properties.MapProperty : properties.ObjectProperty;
            }
            if (prop.format) {
                if (clz.FORMAT === prop.format)
                    return clz;
            } else {
                return clz;
            }
        }
    }
    if (prop.allOf){
       return ComposedModel;

    }
    throw new Error(`Could not resolve type ${prop.type} ${prop.format}`)
}


function setup() {
    for (const {prototype, allowedProps} of values(properties)) {
        beanify(prototype, allowedProps);
    }
}

let hasSetup = false;
export function factory(prop, parent) {
    const TYPES = values(properties);

    if (!hasSetup) {
        setup();
        hasSetup = true;
    }
    for (const type of TYPES) {
        if (prop instanceof type) {
            return prop;
        }
    }
    const PropertyClz = resolve(prop);
    if (!PropertyClz) {
        throw new Error(`Can not resolve property for ${prop}`);
    }
    const ret = apply(new PropertyClz(prop, parent), prop);
    return ret;
}

export default factory;
