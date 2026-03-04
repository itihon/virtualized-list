/**
 * @fileoverview FixedListLayout calculates offsets asynchronously based on specified item sizes. Splits offset calculation task in time by maxMeasuringPortionSize.
 * @license MIT
 * @author Alexandr Kalabin
 */

import type { IAsyncLayout, IItemStore, ILifecycleHooks, IRenderer } from "../types/types";

export default class FixedListLayout implements IAsyncLayout {
  private _maxMeasuredPortionSize: number;
  private _lastProcessedItemIndex: number = 0;
  private _runningOffsetCalculation: boolean = false;
  private _scheduledOffsetCalculation: number | undefined;

  private _renderer: IRenderer = {
    getRenderedElements() {
      return Array.from({ length: 4 }).map(() => document.createElement('div'));
    },
  };

  private _stopOffsetCalculation() {
    this._runningOffsetCalculation = false;
    this._lastProcessedItemIndex = 0;
    this._scheduledOffsetCalculation = undefined;
  }

  private _scheduleOffsetCalculation(index: number, store: IItemStore) {
    if (this._runningOffsetCalculation && index <= this._lastProcessedItemIndex) {
      this._stopOffsetCalculation();
    }

    if (!this._scheduledOffsetCalculation) {
      this._scheduledOffsetCalculation = setTimeout(() => {
        this._runningOffsetCalculation = true;
        this._calculateItemOffsets(index, store);
      });
    }
  }

  /**
   * NOTE: this function calculates offsets with non-collapsing margins.
   */
  private async _calculateItemOffsets(index: number, store: IItemStore) {
    let currentItem = store.getByIndex(index);
    let nextItem;
    let processedItems = 0;

    if (currentItem) {
      const previousItem = store.getPrevious(currentItem);
      const { offset = 0, height = 0, marginBottom = 0 } = previousItem || {};

      currentItem.offset = offset + height + marginBottom + (currentItem.marginTop || 0);

      while ((nextItem = store.getNext(currentItem)) && this._runningOffsetCalculation) {
        const { offset = 0, height = 0, marginBottom = 0 } = currentItem || {};
        nextItem.offset = offset + height + marginBottom + (nextItem.marginTop || 0);

        currentItem = nextItem;

        if (++processedItems > this._maxMeasuredPortionSize) {
          this._lastProcessedItemIndex = index + processedItems;
          processedItems = 0;
          await new Promise(res => setTimeout(res));
        }
      } 
    }

    this._stopOffsetCalculation();
  }

  constructor({ maxMeasuredPortionSize = 100_000 } = {}) {
    this._maxMeasuredPortionSize = maxMeasuredPortionSize;
  }

  attach(hooks: ILifecycleHooks, store: IItemStore) {
    hooks.on('onInsert', (index) => this._scheduleOffsetCalculation(index, store));
    hooks.on('onDelete', (index) => this._scheduleOffsetCalculation(index, store));
   
    return this._renderer;
  } 

  detach() {

  }

  onMeasureStart() {

  }

  onMeasureEnd() {

  }

  onPortionMeasured() {

  }
}