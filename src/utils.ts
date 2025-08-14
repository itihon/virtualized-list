const intervals:Set<number> = new Set();

export function splitInterval(interval_1: number, interval_2: number, count: number): Set<number> {
  const result = intervals;
  result.clear();
  count = Math.floor(count);

  if (count <= 0) return result.add(interval_1); // Nothing to split
  if (interval_1 === interval_2) return result.add(interval_1); // Nothing to split

  const step = (interval_2 - interval_1) / count;

  for (let i = 0; i <= count; i++) {
    result.add(interval_1 + i * step);
  }

  return result;
}

export function debounce(fn: (...args: unknown[]) => void, delay: number): typeof fn {
  let timeout:NodeJS.Timeout | undefined;

  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(fn, delay, ...args);
  };
}

export function throttle(func, delay) {
  let timeoutId = null;
  let lastArgs = null;
  let lastThis = null;
  let lastCallTime = 0;

  const throttled = function(...args) {
    const now = Date.now();
    lastArgs = args;
    lastThis = this;

    if (now - lastCallTime >= delay) {
      // Execute immediately if delay has passed
      func.apply(lastThis, lastArgs);
      lastCallTime = now;
      lastArgs = null; // Clear last call data as it's been handled
      lastThis = null;
    } else {
      // Schedule the last call if within the delay
      clearTimeout(timeoutId); // Clear any existing scheduled last call
      timeoutId = setTimeout(() => {
        func.apply(lastThis, lastArgs);
        lastCallTime = Date.now(); // Update last call time for the trailing execution
        lastArgs = null;
        lastThis = null;
        timeoutId = null;
      }, delay - (now - lastCallTime)); // Calculate remaining time for the delay
    }
  };

  return throttled;
}