/**
 * @fileoverview DynamicListMeasurer measures unknown items' heights one frame before rendering. Items' heights depend on their content.
 * @license MIT
 * @author Alexandr Kalabin
 */

import type { 
  IItem, 
  IItemStore, 
  IEventEmitter,
  IEventMap,
  MeasuredItem,
  MeasurementRange,
} from "../types/types";

type DynamicListMeasurerOptions = {
  overscanHeight: number;
  container: HTMLElement;
  eventBus: IEventEmitter<IEventMap>;
  store: IItemStore<IItem>;
};

export default class DynamicListMeasurer {
  private _container: HTMLElement;
  private _overscanHeight: number;
  private _eventBus: IEventEmitter<IEventMap>;
  private _store: IItemStore<IItem>;
  private _offscreenBuffer: HTMLElement;
  private _scheduledMeasurement: number = 0;
  private _observer: IntersectionObserver;
  private _minItemHeight = Infinity;
  private _maxItemHeight = 0;
  private _measuredRange: MeasurementRange = {
    startIndex: 0,
    endIndex: 0,
    startOffset: 0,
    endOffset: 0,
    total: 0,
    totalHeight: 0,
  };

  private _configureOffscreenBuffer = () => {
    // styles are needed to be reassigned to the offscreen buffer every time they are changed on the container

    const srcStyles = getComputedStyle(this._container);
    const dstStyles = getComputedStyle(this._offscreenBuffer);

    for (const prop of srcStyles) {
      const srcPropValue = srcStyles.getPropertyValue(prop);
      const dstPropValue = dstStyles.getPropertyValue(prop);

      if (srcPropValue !== dstPropValue) {
        this._offscreenBuffer.style.setProperty(prop, srcPropValue);
      }
    }

    Object.assign(
      this._offscreenBuffer.style,
      {
        position: 'absolute',
        visibility: 'hidden',
        contain: 'layout',
        zIndex: '-1',
        insetBlock: '0',
        insetInline: '0',
        borderBlock: 'none',
        borderInline: 'none',
        overflow: 'hidden',
        top: '0',
        left: '0',
      }
    );

    this._offscreenBuffer.removeAttribute('id'); // reset id to avoid collisions
    this._offscreenBuffer.removeAttribute('class'); // reset class to avoid style collisions
  };

  private _sortByItemsIndex = (a: IntersectionObserverEntry, b: IntersectionObserverEntry) => {
    const itemA = a.target as HTMLElement;
    const itemB = b.target as HTMLElement;

    return Number(itemA.dataset.index) - Number(itemB.dataset.index);
  };

  private _measureItems: IntersectionObserverCallback = (entries, observer) => {
    const measuredRange = this._measuredRange;
    const sortedEntries = entries.sort(this._sortByItemsIndex);
    const entriesCount = sortedEntries.length;

    measuredRange.startOffset = 0;
    measuredRange.endOffset = 0;

    // measuring items
    for (let i = 0; i < entriesCount; i++) {
      const entry = sortedEntries[i]!;
      const { height, top, bottom } = entry.boundingClientRect;
      const element = entry.target as HTMLElement;

      // if (!element.offsetParent) continue; // skip unmounted elements

      measuredRange.startOffset = Math.min(measuredRange.startOffset, top);
      measuredRange.endOffset = Math.max(measuredRange.endOffset, bottom);

      // adjust min and max item height
      this._minItemHeight = Math.min(this._minItemHeight, height);
      this._maxItemHeight = Math.max(this._maxItemHeight, height);
    }

    measuredRange.totalHeight = measuredRange.endOffset - measuredRange.startOffset;

    console.log('MEASURED', measuredRange)
    this._eventBus.emit(
      'onItemsReady',
      measuredRange,
      sortedEntries,
    );

    observer.disconnect();
  };

  constructor({ overscanHeight = 100, container, eventBus, store }: DynamicListMeasurerOptions) {
    this._overscanHeight = overscanHeight;
    this._container = container;
    this._store = store;
    this._eventBus = eventBus;
    this._offscreenBuffer = container.cloneNode(false) as HTMLElement;
    this._observer = new IntersectionObserver(this._measureItems, { root: this._offscreenBuffer });
    this._minItemHeight = container.clientHeight;

    document.body.appendChild(this._offscreenBuffer);

    this._configureOffscreenBuffer();

    eventBus.on('onResize', this._configureOffscreenBuffer);

    new MutationObserver(this._configureOffscreenBuffer)
      .observe(container, { attributes: true, attributeFilter: ['style', 'class']});
  } 

  measure(fromIndex: number, toIndex: number) {
    // cancelAnimationFrame(this._scheduledMeasurement);
    this.cancel();
    this._scheduledMeasurement = requestAnimationFrame(() => {
      const offscreenBuffer = this._offscreenBuffer;
      const observer = this._observer;
      const store = this._store;
      const measuredRange = this._measuredRange;

      if (!observer || !offscreenBuffer) return;

      const endIndex = Math.min(toIndex, store.size - 1);
      let currentIdx = Math.max(Math.floor(fromIndex), 0);
      let item: MeasuredItem<IItem> | undefined;

      // clear offscreen buffer before measuring
      while (offscreenBuffer.firstElementChild) {
        offscreenBuffer.firstElementChild.remove();
      }

      measuredRange.startIndex = currentIdx;

      while (currentIdx <= endIndex && (item = store.getByIndex(currentIdx))) {
        const element = item.render(item.data);

        element.dataset.index = item.index as unknown as string;

        offscreenBuffer.appendChild(element);
        observer.observe(element);

        currentIdx++;
      }

      measuredRange.endIndex = currentIdx - 1;
      measuredRange.total = measuredRange.endIndex + 1 - measuredRange.startIndex;
    });
  }

  cancel() {
    cancelAnimationFrame(this._scheduledMeasurement);
    this._observer.takeRecords();
    this._observer.disconnect();
  }

  getMinItemHeight(): number {
    return this._minItemHeight;
  }

  getMaxItemHeight(): number {
    return this._maxItemHeight;
  }

  getMeasuredRange(): MeasurementRange {
    return this._measuredRange;
  }
}