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
    return Object.hasOwnProperty.call(obj, path);
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
/**
 * Apply however, it only sets a value that has a property or a setter to invoke.
 * @param bean
 * @param obj
 */
export const applyStrict = (bean, obj) => {
    return apply(bean, obj, null, true);
};
export const canResolveNoFunc = (obj, prop) => {
    if (!canResolve(obj, prop))
        return false;
    return typeof obj[prop] !== 'function';
};

export const apply = (bean, obj, properties, strict = false) => {
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
            } else if (!strict || canResolveNoFunc(bean, prop)) {
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


export default({beanify, apply, has})
