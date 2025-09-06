export default class HeightAccumulator {
  private _interval: { top: number; bottom: number; height: number };

  constructor() {
    this._interval = { top: Infinity, bottom: -Infinity, height: 0 };
  }

  accumulate(boundingClientRect: DOMRectReadOnly) {
    const interval = this._interval;
    const { top: rectTop, bottom: rectBottom } = boundingClientRect;
    const { top: intervalTop, bottom: intervalBottom } = interval;

    interval.top = Math.min(intervalTop, rectTop);
    interval.bottom = Math.max(intervalBottom, rectBottom);
    interval.height = interval.bottom - interval.top;
  }

  getTop(): number {
    return this._interval.top;
  }

  getBottom(): number {
    return this._interval.bottom;
  }

  getHeight(): number {
    return this._interval.height;
  }

  reset() {
    const interval = this._interval;

    interval.top = Infinity;
    interval.bottom = -Infinity;
    interval.height = 0;
  }
}