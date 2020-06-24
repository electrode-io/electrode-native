export class FakeHashSet {
  public value: any = [];

  constructor(...arr) {
    this.addAll(arr);
  }

  public add(v) {
    if (this.contains(v)) {
      return false;
    }
    this.value.push(v);
    return true;
  }

  public addAll(all) {
    let result = true;
    for (const v of all) {
      const ret = this.add(v);
      if (!ret) {
        result = false;
      }
    }
    return result;
  }

  public clear() {
    this.value = [];
  }

  public remove(v) {
    const idx = this.value.indexOf(v);
    if (idx > -1) {
      this.value.splice(idx, 1);
      return true;
    }
    return false;
  }

  public removeAll(c) {
    let result = true;
    for (const v of c) {
      const ret = this.remove(v);
      if (!ret) {
        result = false;
      }
    }
    return result;
  }

  public contains(v) {
    return this.value.indexOf(v) > -1;
  }

  get size() {
    return this.value.length;
  }

  get length() {
    return this.value.length;
  }

  public isEmpty() {
    return this.value.length === 0;
  }

  public [Symbol.iterator]() {
    return this.value[Symbol.iterator]();
  }

  // Java Like iterator different than Symbol.iterator.
  public iterator() {
    const itr = this.value[Symbol.iterator]();
    let c = itr.next();
    return {
      next() {
        const value = c.value;
        c = itr.next();
        return value;
      },
      hasNext() {
        return !c.done;
      },
    };
  }

  public toArray() {
    return this.value;
  }

  public toJSON() {
    return this.value;
  }
}

export const fakeSet = (...arr) => new FakeHashSet(...arr);
