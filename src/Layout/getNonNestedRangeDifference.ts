/**
 * @fileoverview This function returnes difference in intersected ranges
 * @license MIT
 * @author Alexandr Kalabin
 */

import isRangeIntersecting from "./isRangeIntersecting";

type RangeDiff = {
  start1: number;
  end1: number;
  start2: number;
  end2: number;
};

/*
    This function does not cover strictly nested intervals!!!

    NOT INTERSECTED
    [----1----]        [----2----]
            [----1----]        [----2----]

    EQUAL
    [--------1--------]
    [--------2--------]

    STRICTLY NESTED (NOT COVERED!!!)
    [--------------1--------------]
          [------2------]

          [------1------]
    [--------------2--------------]

    NORMAL INTERSECTION
    [--------1--------]
            [--------2--------]

            [--------1--------]
    [--------2--------]

    TOUCHING
    [--------1--------]
                    [--------2--------]

                    [--------1--------]
    [--------2--------]

    NOT STRICT (SHARED EDGE)
    [--------1--------]
    [----2----]

    [--------1--------]
            [----2----]
*/

export default function getNonNestedRangeDifference(top1: number, bottom1: number, top2: number, bottom2: number): RangeDiff {
  const [min1, max1] = [Math.min(top1, bottom1), Math.max(top1, bottom1)];
  const [min2, max2] = [Math.min(top2, bottom2), Math.max(top2, bottom2)];

  const diff: RangeDiff = { start1: 0, end1: -1, start2: 0, end2: -1 };

  if (!isRangeIntersecting(min1, max1, min2, max2)) {
    diff.start1 = min1;
    diff.end1 = max1;
    diff.start2 = min2;
    diff.end2 = max2;
  }
  else {
    if (min1 < min2) {
      diff.start1 = min1;
      diff.end1 = min2 - 1;
    }
    else if (max1 > max2) {
      diff.start1 = max2 + 1;
      diff.end1 = max1;
    }

    if (min1 > min2) {
      diff.start2 = min2;
      diff.end2 = min1 - 1;
    }
    else if (max1 < max2) {
      diff.start2 = max1 + 1;
      diff.end2 = max2;
    }
  }

  return diff;
}
