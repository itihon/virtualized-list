/**
 * @fileoverview FixedListLayout calculates offsets asynchronously based on specified item sizes. Splits offset calculation task in time by maxMeasuringPortionSize.
 * @license MIT
 * @author Alexandr Kalabin
 */

import type { 
  IFixedListLayout, 
  IFixedItem, 
  IItemStore, 
  IMeasurerEvents,
  IEventEmitter,
  IEventMap, 
} from "../types/types";
import FixedListRenderer from "./FixedListRenderer";

export default class FixedListLayout implements IFixedListLayout {
  private _maxMeasuredPortionSize: number;
  private _lastProcessedItemIndex: number = 0;
  private _runningOffsetCalculation: boolean = false;
  private _scheduledOffsetCalculation: number | undefined;
  private _eventBus: IEventEmitter<IEventMap> | null = null;
  private _renderer: FixedListRenderer | null = null;
  private _attachedHook: ((index: number) => void) | null = null;

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

    if (!this._eventBus) return;

    this._eventBus.emit(
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

          this._eventBus.emit(
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
    this._eventBus.emit(
      'onMeasureEnd', 
      { startIndex, endIndex, total: store.size, startOffset, endOffset  },
    );
  }

  constructor({ maxMeasuredPortionSize = 100_000 } = {}) {
    this._maxMeasuredPortionSize = maxMeasuredPortionSize;
  }

  attach(container: HTMLElement, eventBus: IEventEmitter<IEventMap>, store: IItemStore<IFixedItem>) {
    this._attachedHook = (index: number) => this._scheduleOffsetCalculation(index, store);
    this._eventBus = eventBus;
    this._renderer =  new FixedListRenderer(container, eventBus, store);

    eventBus.on('onInsert', this._attachedHook);
    eventBus.on('onDelete', this._attachedHook);
  } 

  detach() {
    if (this._attachedHook && this._eventBus) {
      this._eventBus.off('onInsert', this._attachedHook);
      this._eventBus.off('onDelete', this._attachedHook);
    }
  }

  onMeasureStart(cb: IMeasurerEvents['onMeasureStart']) {
    this._eventBus?.on('onMeasureStart', cb);
  }

  onMeasureEnd(cb: IMeasurerEvents['onMeasureEnd']) {
    this._eventBus?.on('onMeasureEnd', cb);
  }

  onPortionMeasured(cb: IMeasurerEvents['onPortionMeasured']) {
    this._eventBus?.on('onPortionMeasured', cb);
  }
}