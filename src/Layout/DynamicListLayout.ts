/**
 * @fileoverview DynamicListLayout measures unknown items' heights one frame before rendering. Items' heights depend on their content.
 * @license MIT
 * @author Alexandr Kalabin
 */

import type { 
  IDynamicListLayout, 
  IItem, 
  IItemStore, 
  IMeasurerEvents,
  IEventEmitter,
  IEventMap,
} from "../types/types";
import DynamicListRenderer from "./DynamicListRenderer";

export default class DynamicListLayout implements IDynamicListLayout {
  private _overscanHeight: number;
  private _eventBus: IEventEmitter<IEventMap> | null = null;

  constructor({ overscanHeight = 100 } = {}) {
    this._overscanHeight = overscanHeight;
  }

  attach(container: HTMLElement, eventBus: IEventEmitter<IEventMap>, store: IItemStore<IItem>) {
    const overscanHeight = this._overscanHeight;

    this._eventBus = eventBus;

    new DynamicListRenderer({ container, eventBus, store, overscanHeight });
  } 

  detach() {
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

  onItemsReady(cb: IMeasurerEvents['onItemsReady']) {
    this._eventBus?.on('onItemsReady', cb);
  }
}