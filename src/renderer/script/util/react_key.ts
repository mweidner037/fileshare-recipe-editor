const keys = new WeakMap<object, string>();
let counter = 0;

/**
 * Workaround to let you use objects as React keys,
 * by assigning a unique string to each object.
 */
export function reactKey(obj: object): string {
  let value = keys.get(obj);
  if (value === undefined) {
    value = `reactKey_${counter++}`;
    keys.set(obj, value);
  }
  return value;
}
