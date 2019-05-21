/**
 * create a debounced function
 * @param {(...args: any[]) => any} func
 * @param {{wait: number, trailing: boolean, head: boolean}} param1
 */
export const debounce = ((func, {
  wait = 10,
  trailing = true,
  head = false,
}) => {
  let timer = null;
  return function(...args) {
    if (timer) {
      clearTimeout(timer);
    } else {
      if (head) {
        func(...args);
      }
    }
    timer = setTimeout(() => {
      if (trailing) {
        func(...args);
      }
      timer = null;
    }, wait);
  }
});
/**
 * create a asynchronous debounced function
 * @param {(...args: any[]) => any} func
 * @param {{wait: number, trailing: boolean, head: boolean}} param1
 */
export const asyncDebounce = (func, {
  wait = 10,
  trailing = true,
  head = false,
}) => {
  let timer = null;
  return function (...args) {
    return new Promise((resolve) => {
      if (timer) {
        clearTimeout(timer);
      } else {
        if (head) {
          resolve(func(...args));
        }
      }
      timer = setTimeout(() => {
        if (trailing) {
          resolve(func(...args));
        }
        timer = null;
      }, wait);
    })
  }
}
