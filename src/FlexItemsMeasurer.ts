import RequestAnimationFrameLoop, { type RequestAnimationFrameStateCallback } from "request-animation-frame-loop";
import { createFlexRowsReducer, type FlexRowsAccumulator } from "./reducers";
import type { OnAllEntriesMeasuredCallback, OnBeforeEntriesMeasuredCallback, OnEachEntryMeasuredCallback, OnNewItemsCallback } from "./ScrolledPane";
import ScrolledPaneBuffer from "./ScrolledPaneBuffer";

const WARNING_MESSAGE = 'This method is not supposed to be invoked on FlexItemsMeasurer';

export type OnFlexItemsPortionMeasuredCallback = (rows: FlexRowsAccumulator) => void;

export default class FlexItemsMeasurer extends ScrolledPaneBuffer {
  private _portionSize: number = 500;
  private _promise: Promise<undefined> | null = null;
  private _allItemsMeasured: (arg?: PromiseLike<undefined> | undefined) => void = () => {};
  private _items: Array<Element> = [];
  private _currentItemIndex: number = 0;
  private _rAFLoop = new RequestAnimationFrameLoop(this);
  private _onPortionMeasuredCB: OnFlexItemsPortionMeasuredCallback = () => {};
  private _flexRowsReducer = createFlexRowsReducer();
  private _flexRowsAcc = this._flexRowsReducer.getAccumulator();
  private _flexRowsReducerCfg = {
    ignoreLastRow: true,
    ignoreRowIntersection: true,
    minRowsNumber: 2,
  };

  private _removeMeasuredRows = () => {
    const rows = this._flexRowsAcc.rows;
    const rowsCount = rows.length;

    if (rowsCount < 2) return; // first row is marker

    for (let rowNumber = 1; rowNumber < rowsCount; rowNumber++) { // first row is marker
      const row = rows[rowNumber];
      const itemsCount = row.length;

      for (let itemNumber = 0; itemNumber < itemsCount; itemNumber++) {
        row[itemNumber].target.remove();
      }
    }
  };

  private _processPortion: RequestAnimationFrameStateCallback = (_, loop) => {
    const items = this._items;
    const portionSize = Math.min(
      this._portionSize, 
      items.length, 
      items.length - this._currentItemIndex,
    );

    this._removeMeasuredRows();

    if (this._currentItemIndex < items.length) {
      for (let i = 0; i < portionSize; i++) {
        super.appendItem(items[this._currentItemIndex++]);
      }
    }

    if (!this.length) {
      this._items = [];
      this._promise = null;
      this._currentItemIndex = 0;
      loop.stop();
      this._allItemsMeasured();
    }
    else {
      this.scheduleSizeUpdate();
    }
  };

  private _initAccumulator = () => {
    this._flexRowsReducerCfg.ignoreLastRow = this._currentItemIndex !== this._items.length;
    this._flexRowsReducer.init(
      this.DOMRoot,
      this.getContentBoxWidth(),
      this._flexRowsReducerCfg,
    );
  }

  private _accumulateEntries: OnEachEntryMeasuredCallback = (observerEntry, entries) => {
    this._flexRowsReducer.exec(observerEntry, entries);
  };

  private _performPostMeasuringJob: OnAllEntriesMeasuredCallback = (_, observer) => {
    this._onPortionMeasuredCB(this._flexRowsAcc);
    observer.disconnect();
  };

  constructor(parentContainer: HTMLElement) {
    super(parentContainer, ['class__FlexItemsMeasurer']);
    super.onSizeUpdated((_, observer) => { this.scheduleEntriesMeasuring(); observer.disconnect(); });
    super.onBeforeEntriesMeasured(this._initAccumulator);
    super.onEachEntryMeasured(this._accumulateEntries);
    super.onAllEntriesMeasured(this._performPostMeasuringJob);

    this._rAFLoop.each(this._processPortion);
    this.setOverscan('0%', this.DOMRoot);
  }

  measure(): Promise<undefined> {
    if (!this._promise) {
      this._promise = new Promise((res) => {
        this._allItemsMeasured = res;
      });

      this._rAFLoop.start();
    }

    return this._promise;
  }

  onPortionMeasured(cb: OnFlexItemsPortionMeasuredCallback) {
    this._onPortionMeasuredCB = cb;
  }

  setPortionSize(size: number) {
    this._portionSize = size;
  }

  appendItem(item: Element): void {
    this._items.push(item);
  }

  prependItem(item: Element): void {
    console.warn(WARNING_MESSAGE, item);    
  }

  onBeforeEntriesMeasured(cb: OnBeforeEntriesMeasuredCallback): void {
    console.warn(WARNING_MESSAGE, cb);    
  }

  onEachEntryMeasured(cb: OnEachEntryMeasuredCallback): void {
    console.warn(WARNING_MESSAGE, cb);    
  }

  onAllEntriesMeasured(cb: OnAllEntriesMeasuredCallback): void {
    console.warn(WARNING_MESSAGE, cb);    
  }

  onNewItems(cb: OnNewItemsCallback): void {
    console.warn(WARNING_MESSAGE, cb);    
  }

  onSizeUpdated(cb: ResizeObserverCallback): void {
    console.warn(WARNING_MESSAGE, cb);    
  }
}