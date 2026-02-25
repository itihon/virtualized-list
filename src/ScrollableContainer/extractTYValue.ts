/**
 * @fileoverview Exports a function necessary for obtaining current translateY value from computed CSS transform property
 * @license MIT
 * @author Alexandr Kalabin
 */

export default function extractTYValue(transform: string): number {
  return new DOMMatrix(transform).m42;
}