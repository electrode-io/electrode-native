import _newHashMap, { FakeHashMap } from './fakeMap'
import { fakeSet } from './FakeHashSet'

export const newHashMap = _newHashMap

/**
 * This provides a bunch of Java like classes.  Collections, HashMap, HashSet
 * and a few conviences.   Attention has been paid to make it look very
 * similar, however they are not identically. Specifically "size" is not a function
 * it still a property.   This is mostly due to fear, of what will break if we change
 * that value.
 *
 * It should be useful for Java programmers coming to JS and for porting code from JS->JavaScript
 *
 * These classes are meant to be convient hence iteration.
 *
 */

export class HashSet {
  private set = new Set()

  public contains(value) {
    return this.set.has(value)
  }

  public isEmpty() {
    return this.set.size === 0
  }

  public add(val) {
    const size = this.set.size
    return this.set.add(val).size !== size
  }

  public addAll(itr) {
    const size = this.set.size
    for (const val of itr) {
      this.add(val)
    }
    return size !== this.set.size
  }

  public containsAll(itr) {
    for (const val of itr) {
      if (!this.set.has(val)) {
        return false
      }
    }
    return true
  }

  public remove(val) {
    return this.set.delete(val)
  }

  public removeAll(itr) {
    const size = this.set.size
    for (const val of itr) {
      this.set.delete(val)
    }
    return size !== this.set.size
  }

  public retainAll(itr) {
    const set = itr instanceof Set ? itr : new Set(itr)
    const size = this.set.size
    for (const val of this.set) {
      if (!set.has(val)) {
        this.remove(val)
      }
    }

    return size !== this.set.size
  }

  public toArray() {
    return Array.from(this.set)
  }

  public toJSON() {
    const ret: any = []
    for (const value of this.set) {
      ret.push(value)
    }
    return ret
  }

  public toString() {
    return JSON.stringify(this.toJSON())
  }
}

export const Collections = {
  sort(arr, comparator?: any) {
    return arr && arr.sort(comparator)
  },
  emptyList() {
    return EMPTY_LIST
  },
  emptySet() {
    return HASH_SET
  },
  emptyHashMap() {
    return HASH_MAP
  },
}

export const Arrays = {
  asList(...args) {
    return args
  },
}

export const Lists = {
  transform(arr, fn) {
    return arr.map(fn)
  },
  newArrayList(arr) {
    return arr ? arr.concat() : []
  },
}
function keyThis(key) {
  return [key, this[key]]
}
function arrThis(k, v) {
  return [k, v]
}

export const asMap = obj => {
  if (obj == null) {
    return newHashMap()
  }
  if (obj instanceof Map || obj instanceof FakeHashMap) {
    return obj
  }
  if (Array.isArray(obj)) {
    return newHashSet(...obj)
  }

  return newHashMap(...Object.keys(obj).map(keyThis, obj))
}

export const newHashSet = fakeSet

const EMPTY_LIST = Object.freeze([])
const HASH_SET = Object.freeze(newHashSet())
const HASH_MAP = Object.freeze(newHashMap())

export const isNotEmptySet = set => {
  if (set == null) {
    return false
  }
  if (set instanceof Set || set instanceof Map) {
    return set.size > 0
  }
  if (Array.isArray(set)) {
    return set.length > 0
  }
  if (typeof set[Symbol.iterator] === 'function') {
    if ('size' in set) {
      return set.size !== 0
    }
    return !set[Symbol.iterator]().next().done
  }

  return false
}
