/**
 * @fileoverview Exports a function necessary for obtaining current translateY value from computed CSS transform property
 * @license MIT
 * @author Alexandr Kalabin
 */

const matrixRegex = /^matrix\(([^)]+)\)$/;

export default function extractTYValue(transform: string): number | null {
  const match = transform.match(matrixRegex);
  if (!match) return null;

  const parts = match[1].split(',').map(p => p.trim());
  if (parts.length !== 6) return null;

  const value = Number(parts[5]);
  return Number.isFinite(value) ? value : null;
}