class FakeHashSet {
    value = [];

    constructor(...arr) {
        this.addAll(arr);
    }

    add(v) {
        if (this.contains(v)) return false;
        this.value.push(v);
        return true;
    }

    addAll(all) {
        let ret = false;
        for (const v of all) {
            ret |= this.add(v);
        }
        return !!ret;
    }

    clear() {
        this.value = [];
    }

    remove(v) {
        const idx = this.value.indexOf(v);
        if (idx > -1) {
            this.value.splice(idx, 1);
            return true;
        }
        return false;
    }

    removeAll(c) {
        let ret = false;
        for (const v of c) {
            ret |= this.remove(v);
        }
        return !!ret;
    }

    contains(v) {
        return this.value.indexOf(v) > -1;
    }

    get size() {
        return this.value.length;
    }

    //So Array.from will work.
    get length() {
        return this.value.length;
    }

    isEmpty() {
        return this.value.length === 0;
    }

    [Symbol.iterator]() {
        return this.value[Symbol.iterator]();
    }

    //Java Like iterator different than Symbol.iterator.
    iterator() {
        const itr = this.value[Symbol.iterator]();
        let c = itr.next();
        return {
            next(){
                const value = c.value;
                c = itr.next();
                return value;
            },
            hasNext(){
                return !c.done;
            }
        };
    }

    toArray() {
        return this.value;
    }

    toJSON() {
        return this.value;
    }
}

export const fakeSet = (...arr) => new FakeHashSet(...arr);


export class FakeHashMap {

    static toEntry(key) {
        const self = this;
        return {
            getValue(){
                return self[key];
            },
            getKey(){
                return key
            }
        }
    };


    value = {};

    constructor(...args) {
        for (const [k, v] of args)
            this.value[k] = v;
    }

    put(key, value) {
        return (this.value[key] = value);
    }

    putAll(all) {
        if (Symbol.iterator in all)
            for (const [key, value] of all)
                this.value[key] = value;
        else {
            for (const key of Object.keys(all)) {
                this.value[key] = all[key];
            }
        }
    }


    entrySet() {
        return new FakeHashSet(...Object.keys(this.value).map(FakeHashMap.toEntry, this.value));
    }

    keySet() {
        return new FakeHashSet(...Object.keys(this.value));
    }

    isEmpty() {
        return this.size === 0;
    }

    remove(key) {
        return delete this.value[key];
    }

    clear() {
        this.value = {};
    }

    values() {
        const values = [];
        for (const [k, v] of this) {
            values.push(v);
        }
        return values;
    }

    containsValue(value) {
        for (const key of Object.keys(this.value)) {
            if (this.value[key] === value) return true;
        }
        return false;
    }

    containsKey(value) {
        return value in this.value;
    }

    [Symbol.iterator]() {
        const {value} = this;
        const it = Object.keys(value)[Symbol.iterator]();
        return {
            next() {
                const n = it.next();
                if (!n.done) {
                    n.value = [n.value, value[n.value]]
                }
                return n;
            }
        }
    }

    get(key) {
        return this.value[key];
    }

    get size() {
        return Object.keys(this.value).length;
    }

    toJSON() {
        return this.value;
    }


}

export default function newHashMap(...args) {
    return new FakeHashMap(...args);
}