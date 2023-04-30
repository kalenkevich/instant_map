export const throttle = function (func: Function, delay: number) {
  let timerId: any;

  return (...args: any[]) => {
    // If setTimeout is already scheduled, no need to do anything
    if (timerId) {
      return
    }

    // Schedule a setTimeout after delay seconds
    timerId = setTimeout(function () {
      func(...args);

      // Once setTimeout function execution is finished, timerId = undefined so that in <br>
      // the next scroll event function execution can be scheduled by the setTimeout
      timerId = undefined;
    }, delay);
  }
}