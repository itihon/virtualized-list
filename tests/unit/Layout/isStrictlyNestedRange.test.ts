import { describe, it, expect } from 'vitest';
import isStrictlyNestedRange from '../../../src/Layout/isStrictlyNestedRange';

describe('isStrictlyNestedRange', () => {
  // --- STRICT CONTAINMENT ---

  it('returns true when range1 strictly contains range2', () => {
    expect(isStrictlyNestedRange(0, 10, 2, 8)).toBe(true);
  });

  it('returns true when range2 strictly contains range1', () => {
    expect(isStrictlyNestedRange(2, 8, 0, 10)).toBe(true);
  });

  it('returns true for negative ranges with strict containment', () => {
    expect(isStrictlyNestedRange(-10, 10, -5, 5)).toBe(true);
  });

  // --- EQUALITY ---

  it('returns false for identical ranges', () => {
    expect(isStrictlyNestedRange(0, 10, 0, 10)).toBe(false);
  });

  it('returns false for identical ranges with reversed inputs', () => {
    expect(isStrictlyNestedRange(10, 0, 0, 10)).toBe(false);
  });

  // --- TOUCHING BOUNDARIES (NOT STRICT) ---

  it('returns false when ranges touch at the boundary (right)', () => {
    expect(isStrictlyNestedRange(0, 10, 10, 20)).toBe(false);
  });

  it('returns false when ranges touch at the boundary (left)', () => {
    expect(isStrictlyNestedRange(10, 20, 0, 10)).toBe(false);
  });

  it('returns false when inner range shares boundary (not strict)', () => {
    expect(isStrictlyNestedRange(0, 10, 0, 5)).toBe(false);
    expect(isStrictlyNestedRange(0, 10, 5, 10)).toBe(false);
  });

  // --- PARTIAL OVERLAP ---

  it('returns false for partial overlap (left overlap)', () => {
    expect(isStrictlyNestedRange(0, 10, -5, 5)).toBe(false);
  });

  it('returns false for partial overlap (right overlap)', () => {
    expect(isStrictlyNestedRange(0, 10, 5, 15)).toBe(false);
  });

  // --- DISJOINT RANGES ---

  it('returns false for completely disjoint ranges (left)', () => {
    expect(isStrictlyNestedRange(0, 5, 10, 15)).toBe(false);
  });

  it('returns false for completely disjoint ranges (right)', () => {
    expect(isStrictlyNestedRange(10, 15, 0, 5)).toBe(false);
  });

  // --- REVERSED INPUTS (NORMALIZATION CHECK) ---

  it('handles reversed bounds correctly (range1 reversed)', () => {
    expect(isStrictlyNestedRange(10, 0, 2, 8)).toBe(true);
  });

  it('handles reversed bounds correctly (range2 reversed)', () => {
    expect(isStrictlyNestedRange(0, 10, 8, 2)).toBe(true);
  });

  it('handles both ranges reversed', () => {
    expect(isStrictlyNestedRange(10, 0, 8, 2)).toBe(true);
  });

  // --- DEGENERATE RANGES (POINTS) ---

  it('returns false when both ranges are single equal points', () => {
    expect(isStrictlyNestedRange(5, 5, 5, 5)).toBe(false);
  });

  it('returns true when a range strictly contains a single point', () => {
    expect(isStrictlyNestedRange(0, 10, 5, 5)).toBe(true);
  });

  it('returns false when point lies on boundary (not strict)', () => {
    expect(isStrictlyNestedRange(0, 10, 0, 0)).toBe(false);
    expect(isStrictlyNestedRange(0, 10, 10, 10)).toBe(false);
  });

  it('returns false when both are different single points', () => {
    expect(isStrictlyNestedRange(1, 1, 2, 2)).toBe(false);
  });

  // --- LARGE / EDGE NUMBERS ---

  it('works with large numbers', () => {
    expect(
      isStrictlyNestedRange(
        Number.MIN_SAFE_INTEGER,
        Number.MAX_SAFE_INTEGER,
        -100,
        100
      )
    ).toBe(true);
  });

  it('returns false when large ranges only partially overlap', () => {
    expect(
      isStrictlyNestedRange(
        Number.MIN_SAFE_INTEGER,
        0,
        -100,
        Number.MAX_SAFE_INTEGER
      )
    ).toBe(false);
  });
});