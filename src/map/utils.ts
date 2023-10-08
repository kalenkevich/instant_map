export const throttle = function (func: Function, delay: number) {
  let timerId: any;

  return (...args: any[]) => {
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
    }, delay);
  };
};

export const downloadFile = async (
  filename: string,
  data: ArrayBuffer|string|Blob,
  contentType: string,
) => {
  return new Promise<void>(resolve => {
    const fileBlob =
        data instanceof Blob ? data : new Blob([data], {type: contentType});
    const fileReader = new FileReader();
  
    fileReader.readAsDataURL(fileBlob);
    fileReader.onload = () => {
      const aElem = document.createElement('a');
      const url = String(fileReader.result);

      aElem.href = url;
      aElem.download = filename;
      aElem.click();

      resolve();
    };
  });
};

export const downloadImage = (
  filename: string,
  url: string,
): Promise<void> => {
  return new Promise<void>((resolve) => {
    const a = document.createElement('a');

    a.href = url;
    a.target = '_blank';
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    resolve();
  });
}