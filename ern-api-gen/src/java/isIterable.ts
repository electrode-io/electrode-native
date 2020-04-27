export function isIterable(obj) {
  // checks for null and undefined
  if (obj == null) {
    return false;
  }
  // Don't consider a string iterable.
  if (typeof obj === 'string') {
    return false;
  }
  return typeof obj[Symbol.iterator] === 'function';
}
