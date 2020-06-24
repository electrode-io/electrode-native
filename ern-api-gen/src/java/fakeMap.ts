import { FakeHashSet } from './FakeHashSet';

export class FakeHashMap {
  public static toEntry(key) {
    const self = this;
    return {
      getValue() {
        return self[key];
      },
      getKey() {
        return key;
      },
    };
  }

  public value = {};

  constructor(...args) {
    for (const [k, v] of args) {
      this.value[k] = v;
    }
  }

  public [Symbol.iterator]() {
    const { value } = this;
    const it = Object.keys(value)[Symbol.iterator]();
    return {
      next() {
        const n: any = it.next();
        if (!n.done) {
          n.value = [n.value, value[n.value]];
        }
        return n;
      },
    };
  }

  public put(key, value) {
    return (this.value[key] = value);
  }

  public putAll(all) {
    if (Symbol.iterator in all) {
      for (const [key, value] of all) {
        this.value[key] = value;
      }
    } else {
      for (const key of Object.keys(all)) {
        this.value[key] = all[key];
      }
    }
  }

  public entrySet() {
    return new FakeHashSet(
      ...Object.keys(this.value).map(FakeHashMap.toEntry, this.value),
    );
  }

  public keySet() {
    return new FakeHashSet(...Object.keys(this.value));
  }

  public isEmpty() {
    return this.size === 0;
  }

  public remove(key) {
    return delete this.value[key];
  }

  public clear() {
    this.value = {};
  }

  public values() {
    const values: any = [];
    for (const [k, v] of this) {
      values.push(v);
    }
    return values;
  }

  public containsValue(value) {
    for (const key of Object.keys(this.value)) {
      if (this.value[key] === value) {
        return true;
      }
    }
    return false;
  }

  public containsKey(value) {
    return value in this.value;
  }

  public get(key) {
    return this.value[key];
  }

  public get size() {
    return Object.keys(this.value).length;
  }

  public toJSON() {
    return this.value;
  }
}

export default function newHashMap(...args) {
  return new FakeHashMap(...args);
}
