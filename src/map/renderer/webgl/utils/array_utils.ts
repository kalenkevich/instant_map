export function addXTimes(arr: number[], value: number | number[], times: number) {
  if (Array.isArray(value)) {
    for (let i = 0; i < times; i++) {
      for (let j = 0; j < value.length; j++) {
        arr.push(value[j]);
      }
    }
  } else {
    for (let i = 0; i < times; i++) {
      arr.push(value);
    }
  }
}
