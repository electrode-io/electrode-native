export function sortObjectByKeys(obj: { [key: string]: any }): {
  [key: string]: any;
} {
  const res: { [key: string]: any } = {};
  Object.keys(obj)
    .sort()
    .forEach((k: string) => {
      res[k] = obj[k];
    });
  return res;
}
