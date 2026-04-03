/**
 * @fileoverview This function checks two ranges for including one another exclusively with top and bottom possibly swapped.
 * @license MIT
 * @author Alexandr Kalabin
 */

export default function isStrictlyNestedRange(top1: number, bottom1: number, top2: number, bottom2: number): boolean {
  const [min1, max1] = [Math.min(top1, bottom1), Math.max(top1, bottom1)];
  const [min2, max2] = [Math.min(top2, bottom2), Math.max(top2, bottom2)];
  return (min1 < min2 && max1 > max2) || (min1 > min2 && max1 < max2);
}
