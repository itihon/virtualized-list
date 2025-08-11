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