/**
 * @fileoverview FixedListLayout calculates offsets asynchronously based on specified item sizes. Splits offset calculation task in time by maxMeasuringPortionSize.
 * @license MIT
 * @author Alexandr Kalabin
 */

import type { 
  IFixedListLayout, 
  IFixedItem, 
  IItemStore, 
  ILifecycleHooks, 
  IMeasurerHooks, 
} from "../types/types";
import EventBus from "../VirtualizedList/EventBus";

export default class FixedListLayout implements IFixedListLayout {
  private _maxMeasuredPortionSize: number;
  private _lastProcessedItemIndex: number = 0;
  private _runningOffsetCalculation: boolean = false;
  private _scheduledOffsetCalculation: number | undefined;
  private _hooks = new EventBus<IMeasurerHooks>();
  private _attachedHook: ((index: number) => void) | null = null;

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

  private _scheduleOffsetCalculation(index: number, store: IItemStore<IFixedItem>) {
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
  private async _calculateItemOffsets(index: number, store: IItemStore<IFixedItem>) {
    let currentItem = store.getByIndex(index);
    let currentIndex = index;
    let processedItems = 0;
    let startIndex = index;
    let endIndex = currentIndex;
    let startOffset = 0;
    let endOffset = 0;

    this._hooks.emit(
      'onMeasureStart', 
      { startIndex, endIndex, total: store.size, startOffset, endOffset },
    );

    if (currentItem) {
      do {
        const previousItem = store.getPrevious(currentItem);
        const { offsetTop = 0, height = 0, marginBottom = 0 } = previousItem || {};
        const portionProcessed = ++processedItems === this._maxMeasuredPortionSize;
        const endReached = currentIndex === store.size - 1;

        currentItem.offsetTop = offsetTop + height + marginBottom + (currentItem.marginTop || 0);

        if (portionProcessed || endReached) {
          endIndex = currentIndex;
          endOffset = currentItem.offsetTop;

          this._hooks.emit(
            'onPortionMeasured', 
            { startIndex, endIndex, total: store.size, startOffset, endOffset },
          );
          this._lastProcessedItemIndex = endIndex;

          startIndex = endIndex + 1;
          startOffset = endOffset;
          processedItems = 0;

          if (!endReached) {
            await new Promise(res => setTimeout(res));
          }
        }
        currentIndex++;
      } 
      while ((currentItem = store.getNext(currentItem)) && this._runningOffsetCalculation)
    }

    this._stopOffsetCalculation();
    this._hooks.emit(
      'onMeasureEnd', 
      { startIndex, endIndex, total: store.size, startOffset, endOffset  },
    );
  }

  constructor({ maxMeasuredPortionSize = 100_000 } = {}) {
    this._maxMeasuredPortionSize = maxMeasuredPortionSize;
  }

  attach(hooks: ILifecycleHooks, store: IItemStore<IFixedItem>) {
    this._attachedHook = (index: number) => this._scheduleOffsetCalculation(index, store);

    hooks.on('onInsert', this._attachedHook);
    hooks.on('onDelete', this._attachedHook);
   
    return this._renderer;
  } 

  detach(hooks: ILifecycleHooks) {
    if (this._attachedHook) {
      hooks.off('onInsert', this._attachedHook);
      hooks.off('onDelete', this._attachedHook);
    }
  }

  onMeasureStart(cb: IMeasurerHooks['onMeasureStart']) {
    this._hooks.on('onMeasureStart', cb);
  }

  onMeasureEnd(cb: IMeasurerHooks['onMeasureEnd']) {
    this._hooks.on('onMeasureEnd', cb);
  }

  onPortionMeasured(cb: IMeasurerHooks['onPortionMeasured']) {
    this._hooks.on('onPortionMeasured', cb);
  }
}