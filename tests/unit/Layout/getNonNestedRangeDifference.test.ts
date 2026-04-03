import { describe, it, expect } from 'vitest';
import getNonNestedRangeDifference from '../../../src/Layout/getNonNestedRangeDifference';

const EMPTY = { start1: 0, end1: -1, start2: 0, end2: -1 };

describe('getNonNestedRangeDifference', () => {
  // --- NOT INTERSECTED (2) ---

  it('disjoint: range1 before range2', () => {
    const res = getNonNestedRangeDifference(0, 5, 10, 15);
    expect(res).toEqual({
      start1: 0, end1: 5,
      start2: 10, end2: 15
    });
  });

  it('disjoint: range2 before range1', () => {
    const res = getNonNestedRangeDifference(10, 15, 0, 5);
    expect(res).toEqual({
      start1: 10, end1: 15,
      start2: 0, end2: 5
    });
  });

  // --- EQUAL (1) ---

  it('equal ranges', () => {
    const res = getNonNestedRangeDifference(0, 10, 0, 10);
    expect(res).toEqual(EMPTY);
  });

  // --- STRICTLY NESTED (2) ---

  it('range1 strictly contains range2', () => {
    const res = getNonNestedRangeDifference(0, 20, 5, 10);
    expect(res).toEqual({
      start1: 0, end1: 4,   // ⚠️ only one side returned (by design)
      start2: 0, end2: -1
    });
  });

  it('range2 strictly contains range1', () => {
    const res = getNonNestedRangeDifference(5, 10, 0, 20);
    expect(res).toEqual({
      start1: 0, end1: -1,
      start2: 0, end2: 4
    });
  });

  // --- NORMAL INTERSECTION (2) ---

  it('partial overlap: left overlap', () => {
    const res = getNonNestedRangeDifference(0, 10, 5, 15);
    expect(res).toEqual({
      start1: 0, end1: 4,
      start2: 11, end2: 15
    });
  });

  it('partial overlap: right overlap', () => {
    const res = getNonNestedRangeDifference(5, 15, 0, 10);
    expect(res).toEqual({
      start1: 11, end1: 15,
      start2: 0, end2: 4
    });
  });

  // --- TOUCHING BOUNDARIES (2) ---

  it('touching: range1 ends where range2 starts', () => {
    const res = getNonNestedRangeDifference(0, 10, 10, 20);
    expect(res).toEqual({
      start1: 0, end1: 9,
      start2: 11, end2: 20
    });
  });

  it('touching: range2 ends where range1 starts', () => {
    const res = getNonNestedRangeDifference(10, 20, 0, 10);
    expect(res).toEqual({
      start1: 11, end1: 20,
      start2: 0, end2: 9
    });
  });

  // --- NOT STRICT (BOUNDARY SHARED) (2) ---

  it('range1 shares left boundary with range2', () => {
    const res = getNonNestedRangeDifference(0, 10, 0, 5);
    expect(res).toEqual({
      start1: 6, end1: 10,
      start2: 0, end2: -1
    });
  });

  it('range1 shares right boundary with range2', () => {
    const res = getNonNestedRangeDifference(0, 10, 5, 10);
    expect(res).toEqual({
      start1: 0, end1: 4,
      start2: 0, end2: -1
    });
  });

  // --- NORMALIZATION (SWAPPED INPUTS) ---

  it('handles reversed inputs correctly', () => {
    const res = getNonNestedRangeDifference(10, 0, 15, 5);
    expect(res).toEqual({
      start1: 0, end1: 4,
      start2: 11, end2: 15
    });
  });
});