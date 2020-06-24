/**
 * TreeMap.js
 *
 * MIT License
 *
 * Copyright (c) 2016-2018 Adrian Wirth
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/**
 * Modified implementation by @belemaire
 * - Classify implementation
 * - Add custom comparator support
 * - Add iterator
 */
export default class TreeMap {
  private keyComparator;
  private root;
  private keyType;
  private length;

  constructor(keyComparator?: any) {
    if (keyComparator && !keyComparator.compare) {
      throw new Error('keyComparator does not expose a compare function ');
    }
    this.keyComparator = keyComparator;
    this.root = null;
    this.keyType = void 0;
    this.length = 0;
  }

  public checkKey(key, checkKeyType = false) {
    const localKeyType = typeof key;

    if (
      localKeyType !== 'number' &&
      localKeyType !== 'string' &&
      localKeyType !== 'boolean'
    ) {
      throw new Error("'key' must be a number, a string or a boolean");
    }

    if (checkKeyType === true && localKeyType !== this.keyType) {
      throw new Error('All keys must be of the same type');
    }

    return localKeyType;
  }

  public call(callback, ...rest) {
    const args = Array.prototype.slice.call(arguments, 1);

    if (typeof callback === 'function') {
      callback.apply(void 0, args);
    }
  }

  public getTree() {
    return this.root;
  }

  public getLength() {
    return this.length;
  }

  public each(callback) {
    this.internalEach(this.root, callback);
  }

  public *[Symbol.iterator]() {
    const res: any = [];
    this.each((value, key) => {
      res.push([key, value]);
    });
    yield* res;
  }

  public get(key) {
    this.checkKey(key);
    return this.internalGet(key, this.root);
  }

  public set(key, value) {
    if (this.root === null) {
      this.keyType = this.checkKey(key);
    } else {
      this.checkKey(key, true);
    }

    this.root = this.internalSet(key, value, this.root);
  }

  public getMaxKey() {
    const maxNode = this.getMaxNode(this.root);

    if (maxNode !== null) {
      return maxNode.key;
    }

    return maxNode;
  }

  public getMinKey() {
    const minNode = this.getMinNode(this.root);

    if (minNode !== null) {
      return minNode.key;
    }

    return minNode;
  }

  public getMaxNode(node) {
    while (node !== null && node.right !== null) {
      node = node.right;
    }

    return node;
  }

  public getMinNode(node) {
    while (node !== null && node.left !== null) {
      node = node.left;
    }

    return node;
  }

  public remove(key) {
    this.checkKey(key);

    this.root = this.internalRemove(key, this.root);
  }

  public lt(a, b) {
    return this.keyComparator ? this.keyComparator.compare(a, b) === -1 : a < b;
  }

  public gt(a, b) {
    return this.keyComparator ? this.keyComparator.compare(a, b) === 1 : a > b;
  }

  private internalGet(key, node) {
    if (node === null) {
      return void 0;
    }

    if (this.lt(key, node.key)) {
      return this.internalGet(key, node.left);
    } else if (this.gt(key, node.key)) {
      return this.internalGet(key, node.right);
    } else {
      return node.value;
    }
  }

  private internalSet(key, value, node) {
    if (node === null) {
      this.length++;

      return {
        key,
        left: null,
        right: null,
        value,
      };
    }

    if (this.lt(key, node.key)) {
      node.left = this.internalSet(key, value, node.left);
    } else if (this.gt(key, node.key)) {
      node.right = this.internalSet(key, value, node.right);
    } else {
      node.value = value;
    }

    return node;
  }

  private internalRemove(key, node) {
    if (node === null) {
      return null;
    }

    if (this.lt(key, node.key)) {
      node.left = this.internalRemove(key, node.left);
    } else if (this.gt(key, node.key)) {
      node.right = this.internalRemove(key, node.right);
    } else {
      if (node.left !== null && node.right !== null) {
        const maxNode = this.getMaxNode(node.left);

        const maxNodeKey = maxNode.key;
        const maxNodeValue = maxNode.value;

        maxNode.key = node.key;
        maxNode.value = node.value;
        node.key = maxNodeKey;
        node.value = maxNodeValue;

        node.left = this.internalRemove(key, node.left);
      } else if (node.left !== null) {
        this.length--;
        return node.left;
      } else if (node.right !== null) {
        this.length--;
        return node.right;
      } else {
        this.length--;
        return null;
      }
    }

    return node;
  }

  private internalEach(node, callback, internalCallback?: any) {
    if (node === null) {
      return this.call(internalCallback);
    }

    this.internalEach(node.left, callback, () => {
      this.call(callback, node.value, node.key);

      this.internalEach(node.right, callback, () => {
        this.call(internalCallback);
      });
    });
  }
}
