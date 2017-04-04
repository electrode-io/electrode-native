import SortedMap from "collections/sorted-map";
import SortedArraySet from 'collections/sorted-array-set';
import _newHashMap, {fakeSet, FakeHashMap, javaIterator} from './fakeMap';
export const newHashMap = _newHashMap;
const _iterator = javaIterator;
/**
 * This provides a bunch of Java like classes.  Collections, HashMap, HashSet
 * TreeMap and a few conviences.   Attention has been paid to make it look very
 * similar, however they are not identically. Specifically "size" is not a function
 * it still a property.   This is mostly due to fear, of what will break if we change
 * that value.
 *
 * It should be useful for Java programmers coming to JS and for porting code from JS->JavaScript
 *
 * These classes are meant to be convient hence iteration.
 *
 */

function makeCompare(obj) {
    const compare = makeSort(obj);
    return compare ? (a, b) => compare(a, b) === 0 : null;
}
function makeSort(obj) {
    return obj && obj.compare.bind(obj);
}

export class TreeMap extends SortedMap {
    iterator = _iterator;

    //(new SortedMap(null, (a, b) => sorter.compare(a, b) == 0, sorter.compare)
    constructor(map, comparator) {
        super(comparator ? map : null, makeCompare(comparator || map), makeSort(comparator || map));
    }

    put(k, v) {
        this.set(k, v);

    }

    putAll(itr) {
        for (const [k, v] in itr) {
            this.set(k, v);
        }
    }

    isEmpty() {
        return this.size === 0;
    }

    keySet() {
        const hs = new HashSet();
        for (const [key] of this) {
            hs.add(key);
        }
        return hs;
    }

    [Symbol.iterator]() {
        return this.entries();
    }
}

export class HashSet extends Set {
    iterator = _iterator;

    contains(value) {
        return this.has(value);
    }

    isEmpty() {
        return this.size == 0;
    }

    add(val) {
        const size = this.size;
        return super.add(val).size !== size;
    }

    addAll(itr) {
        const size = this.size;
        for (const val of itr) this.add(val);
        return size != this.size;
    }

    containsAll(itr) {
        for (const val of itr) if (!this.has(val)) return false;
        return true;
    }

    remove(val) {
        return this.delete(val);
    }

    removeAll(itr) {
        const size = this.size;
        for (const val of itr) this.delete(val);
        return size != this.size;
    }

    retainAll(itr) {
        const set = itr instanceof Set ? itr : new Set(itr);
        const size = this.size;
        for (const val of this) if (!set.has(val)) this.remove(val);

        return size != this.size;
    }

    toArray() {
        return Array.from(this);
    }

    toJSON() {
        const ret = [];
        for (const value of this) ret.push(value);
        return ret;
    }

    toString() {
        return JSON.stringify(this.toJSON())
    }


}


export const Collections = {
    sort(arr, comparator){
        return arr && arr.sort(comparator);
    },
    emptyList(){
        return EMPTY_LIST;
    },
    emptySet(){
        return HASH_SET
    },
    emptyHashMap(){
        return HASH_MAP;
    }
};

export const Arrays = {
    asList(...args)
    {
        return args;
    }
};

export const Lists = {
    transform(arr, fn){
        return arr.map(fn);
    },
    newArrayList(arr){
        return arr ? arr.concat() : [];
    }
};
function keyThis(key) {
    return [key, this[key]];
}
function arrThis(k, v) {
    return [k, v];
}

export const asMap = (obj) => {
    if (obj == null) return newHashMap();
    if (obj instanceof Map || obj instanceof FakeHashMap) return obj;
    if (Array.isArray(obj)) return newHashSet(...obj);

    return newHashMap(...Object.keys(obj).map(keyThis, obj));
};


export const newHashSet = fakeSet;

const EMPTY_LIST = Object.freeze([]);
const HASH_SET = Object.freeze(newHashSet());
const HASH_MAP = Object.freeze(newHashMap());

export const isNotEmptySet = (set) => {
    if (set == null) return false;
    if (set instanceof Set || set instanceof Map) {
        return set.size > 0;
    }
    if (Array.isArray(set)) {
        return set.length > 0;
    }
    if (typeof set[Symbol.iterator] === 'function') {
        if ('size' in set) return set.size != 0;
        return !set[Symbol.iterator]().next().done;
    }

    return false;
};