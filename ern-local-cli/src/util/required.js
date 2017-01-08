export default function required(obj, name) {
  if (!obj) {
    throw new Error(`${name} is required`);
  }
}
