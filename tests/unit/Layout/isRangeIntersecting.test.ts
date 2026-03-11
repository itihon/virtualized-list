import { describe, it, expect } from 'vitest';
import isRangeIntersecting from '../../../src/Layout/isRangeIntersecting';

describe('isRangeIntersecting', () => {
  // Partial overlaps
  it('detects partial overlap on the right', () => expect(isRangeIntersecting(1, 5, 3, 7)).toBe(true));
  it('detects partial overlap on the left', () => expect(isRangeIntersecting(3, 7, 1, 5)).toBe(true));

  // Containment
  it('detects when range1 contains range2', () => expect(isRangeIntersecting(1, 10, 3, 7)).toBe(true));
  it('detects when range2 contains range1', () => expect(isRangeIntersecting(3, 7, 1, 10)).toBe(true));

  // Identical
  it('detects identical ranges', () => expect(isRangeIntersecting(2, 5, 2, 5)).toBe(true));

  // Touching at a single point
  it('detects ranges touching at right edge', () => expect(isRangeIntersecting(1, 5, 5, 9)).toBe(true));
  it('detects ranges touching at left edge', () => expect(isRangeIntersecting(5, 9, 1, 5)).toBe(true));

  // No intersection
  it('returns false when range1 is completely before range2', () => expect(isRangeIntersecting(1, 3, 5, 9)).toBe(false));
  it('returns false when range1 is completely after range2', () => expect(isRangeIntersecting(5, 9, 1, 3)).toBe(false));
  it('returns false for ranges with a gap of 1', () => expect(isRangeIntersecting(1, 4, 5, 9)).toBe(false));

  // Swapped top/bottom for range1
  it('handles swapped range1: partial overlap on the right', () => expect(isRangeIntersecting(5, 1, 3, 7)).toBe(true));
  it('handles swapped range1: no intersection', () => expect(isRangeIntersecting(3, 1, 5, 9)).toBe(false));
  it('handles swapped range1: containment', () => expect(isRangeIntersecting(10, 1, 3, 7)).toBe(true));

  // Swapped top/bottom for range2
  it('handles swapped range2: partial overlap on the left', () => expect(isRangeIntersecting(3, 7, 5, 1)).toBe(true));
  it('handles swapped range2: no intersection', () => expect(isRangeIntersecting(5, 9, 3, 1)).toBe(false));
  it('handles swapped range2: containment', () => expect(isRangeIntersecting(3, 7, 10, 1)).toBe(true));

  // Both swapped
  it('handles both ranges swapped: partial overlap', () => expect(isRangeIntersecting(5, 1, 7, 3)).toBe(true));
  it('handles both ranges swapped: no intersection', () => expect(isRangeIntersecting(3, 1, 9, 5)).toBe(false));
  it('handles both ranges swapped: touching at a point', () => expect(isRangeIntersecting(5, 1, 9, 5)).toBe(true));

  // Edge cases
  it('handles zero-length ranges that are equal', () => expect(isRangeIntersecting(3, 3, 3, 3)).toBe(true));
  it('handles zero-length range inside another range', () => expect(isRangeIntersecting(1, 5, 3, 3)).toBe(true));
  it('handles zero-length ranges that do not intersect', () => expect(isRangeIntersecting(1, 1, 2, 2)).toBe(false));
  it('handles negative numbers', () => expect(isRangeIntersecting(-5, -1, -3, 2)).toBe(true));
  it('handles negative and positive ranges with no intersection', () => expect(isRangeIntersecting(-5, -1, 1, 5)).toBe(false));
});