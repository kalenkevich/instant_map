export function addXTimes(arr: number[], value: number | number[], times: number) {
  for (let i = 0; i < times; i++) {
    if (Array.isArray(value)) {
      arr.push(...value);
    } else {
      arr.push(value);
    }
  }
}
