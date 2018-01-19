export function dateReviver(key, value) {
  if (typeof value === 'string') {
    const a = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*)?)Z$/.exec(value);
    if (a) { return new Date(Date.UTC(+a[1], +a[2] - 1, +a[3], +a[4], +a[5], +a[6])); }
    const b = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/.exec(value);
    if (b) { return new Date(Date.UTC(+b[1], +b[2] - 1, +b[3], +b[4], +b[5])); }
  }
  return value;
}