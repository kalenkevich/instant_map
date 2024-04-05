export const throttle = function (func: (...args: unknown[]) => void, delay: number) {
  let timerId: number | undefined;

  return (...args: unknown[]) => {
    // If setTimeout is already scheduled, no need to do anything
    if (timerId) {
      return;
    } else {
      func(...args);
    }

    // Schedule a setTimeout after delay seconds
    timerId = setTimeout(function () {
      // Once setTimeout function execution is finished, timerId = undefined so that in <br>
      // the next scroll event function execution can be scheduled by the setTimeout
      timerId = undefined;
    }, delay) as unknown as number;
  };
};
