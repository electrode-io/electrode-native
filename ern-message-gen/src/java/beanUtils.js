import Logger from "./Logger";
import {lowerFirst as lcFirst, upperFirst as ucFirst} from './StringUtils';

/**
 * Takes a prototype and a list of property names and creates getters and
 * setters.
 *
 * @param prototype
 * @param p
 * @returns {*}
 */
export const beanify = (prototype, p, prefix = '') => {
    const props = Array.isArray(p) ? p : p == null ? [] : [p];
    for (const p of props) {
        let op = p;
        let pre = prefix;
        let defValue;
        if (Array.isArray(p)) {
            op = p[0];
            if (p.length > 1)
                defValue = p[1];
            if (p.length > 2)
                pre = p[2];
        }
        const prop = `${pre}${op}`;
        const uProp = ucFirst(op);
        const set = `set${uProp}`;
        const get = `get${uProp}`;
        if (!has(prototype, set)) {
            prototype[set] = function (value) {
                this[prop] = value
            }
        }
        if (!has(prototype, get)) {
            prototype[get] = function () {
                return has(this, prop) ? this[prop] : typeof defValue == 'function' ? defValue() : defValue;
            };
        }
    }

    return prototype;
};

/**
 * Takes a bean and applies the values where the values have
 * setters the setters are called.
 */
function resolve(obj, path) {
    if (obj == null) return;
    if (path == null) return obj;
    if (typeof obj[path] === 'function') return obj[path]();
    if (path in obj) return obj[path];
    if (obj instanceof Map) return obj.get(path);
}
function canResolve(obj, path) {
    return true;
    if (obj == null) return false;
    if (path == null) return false;
    if (typeof path != 'string') return false;
    if (obj instanceof Map) return obj.has(path);
    return (path in obj)
}
function each(obj, keys, fn, scope) {
    if (obj == null) return obj;
    if (typeof obj[Symbol.iterator] === 'function') {
        for (const [k, v] of obj) {
            if (!keys || keys.indexOf(k) > -1) {
                fn.call(scope, v, k);
            }
        }
    }
    keys = keys || Object.keys(obj);
    for (const k of keys) {
        fn.call(scope, obj[k], k);
    }
}
export const apply = (bean, obj, properties) => {
    if (obj == null) return bean;
    if (bean == null) throw new Error(`Bean can not be null`);
    const prefix = '';
    each(obj, properties, function (v, p) {
        let op = p;
        let pre = prefix;
        let defValue;
        if (Array.isArray(p)) {
            op = p[0];
            if (p.length > 1)
                defValue = p[1];
            if (p.length > 2)
                pre = p[2];
        }
        const prop = `${pre}${op}`;
        const uProp = ucFirst(op);
        const set = `set${uProp}`;
        const is = `is${uProp}`;
        const get = `get${uProp}`;
        if (canResolve(obj, prop) || typeof obj[get] === 'function' || typeof obj[is] === 'function') {
            const value = typeof obj[get] === 'function' ? obj[get]() : typeof obj[is] === 'function' ? obj[is]() : resolve(obj, prop);
            if (typeof bean[set] === 'function') {
                bean[set](value);
            } else {
                bean[prop] = value;
            }
        }
    });
    return bean;
};

export const has = (obj, ...properties) => {
    if (obj == null) return false;
    for (const p of properties) {
        if (!(p in obj)) {
            return false;
        }
    }
    return true;
};

export const beanProxy = (value) => {
    if (value == null) return null;
    const p = new Proxy(value, BEAN_PROXY_HANDLER);
    p.___name = `Proxy<${value.constructor.name}>`;
    return p;
};

const BEAN_PROXY_HANDLER = {
    get(target, name){
        if (has(target, name)) return target[name];
        if (typeof name !== 'string' || typeof name === 'number') {
            Logger.warn(`bean  is attempting to use  a non-string`);
            return target[name];
        }
        if (name.startsWith("is")) {
            return () => target[lcFirst(name, 2)];
        }
        if (name.startsWith("get")) {
            return () => target[lcFirst(name, 3)];
        }
        if (name.startsWith("set")) {
            return (value) => (target[lcFirst(name, 3)] = value);
        }
    }

};

export default({beanify, apply, has, beanProxy})
