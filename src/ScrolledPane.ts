import DOMConstructor from "./DOMConstructor";

export type OverscanHeight = `${string}px` | `${string}%`;
export type OnEachEntryMeasuredCallback = (
  entry: IntersectionObserverEntry, 
  entries: Array<IntersectionObserverEntry>, 
  observer: IntersectionObserver
) => void;
export type OnAllEntriesMeasuredCallback = IntersectionObserverCallback;
export type OnBeforeEntriesMeasuredCallback = IntersectionObserverCallback;
export type OnNewItemsCallback = IntersectionObserverCallback;

export default class ScrolledPane extends DOMConstructor {
  private _paneElement: HTMLElement;
  private _contentBoxWidth: number = 0;
  private _borderBoxHeight: number = 0;
  private _resizeObserver: ResizeObserver;
  private _observer: IntersectionObserver;
  private _onEachEntryMeasuredCB: OnEachEntryMeasuredCallback = () => {};
  private _onAllEntriesMeasuredCB: OnAllEntriesMeasuredCallback = () => {};
  private _onBeforeEntriesMeasuredCB: OnBeforeEntriesMeasuredCallback = () => {};
  private _onNewItemsCB: OnNewItemsCallback = () => {};
  private _onSizeUpdatedCB: ResizeObserverCallback = () => {};
  private _newItems: Set<Element> = new Set();

  private _runCallbacks: IntersectionObserverCallback = (entries, observer) => {
    const onEachEntryMeasuredCB = this._onEachEntryMeasuredCB;
    const newEntries: Array<IntersectionObserverEntry> = [];
    const newItems = this._newItems;
    const paneElement = this._paneElement;
    const entriesCount = entries.length;

    this._onBeforeEntriesMeasuredCB(entries, observer);

    for (let entryNumber = 0; entryNumber < entriesCount; entryNumber++) {
      const entry = entries[entryNumber];
      const { target } = entry;

      if (newItems.has(target)) {
        newEntries.push(entry);
        newItems.delete(target);
      }

      if (target.parentElement !== paneElement) {
        observer.unobserve(target);
      }

      onEachEntryMeasuredCB(entry, entries, observer);
    }

    if (newEntries.length) this._onNewItemsCB(newEntries, observer);

    this._onAllEntriesMeasuredCB(entries, observer);
  };
  
  private _createObserver(height: OverscanHeight): IntersectionObserver {

    const rootMargin = `${height} 0px ${height} 0px`;

    return new IntersectionObserver(
      this._runCallbacks, 
      {
        root: this.parentContainer,
        rootMargin: rootMargin,
      }
    );
  }

  constructor(scrollableParent: HTMLElement, classList: string[] = []) {
    super(scrollableParent, ['class__ScrolledPane', ...classList]);
    this._paneElement = super.DOMRoot;

    this._resizeObserver = new ResizeObserver((entries, observer) => {
      this._contentBoxWidth = entries[0].contentBoxSize[0].inlineSize;
      this._borderBoxHeight = entries[0].borderBoxSize[0].blockSize;
      this._onSizeUpdatedCB(entries, observer);
    });

    this._observer = this._createObserver('0px');
  }

  scheduleSizeUpdate() {
    this._resizeObserver.disconnect();
    this._resizeObserver.observe(this._paneElement);
  }

  scheduleEntriesMeasuring() {
    this._observer.disconnect();
    for (const item of this._paneElement.children) {
      this._observer.observe(item);
    }
  }

  runScheduledCallbacks() {
    const entries = this._observer.takeRecords();

    if (entries.length) {
      this._runCallbacks(entries, this._observer);
    }
  }

  onEachEntryMeasured(cb: OnEachEntryMeasuredCallback) {
    this._onEachEntryMeasuredCB = cb;
  }

  onAllEntriesMeasured(cb: OnAllEntriesMeasuredCallback) {
    this._onAllEntriesMeasuredCB = cb;
  }

  onBeforeEntriesMeasured(cb: OnBeforeEntriesMeasuredCallback) {
    this._onBeforeEntriesMeasuredCB = cb;
  }

  onNewItems(cb: OnNewItemsCallback) {
    this._onNewItemsCB = cb;
  }

  onSizeUpdated(cb: ResizeObserverCallback) {
    this._onSizeUpdatedCB = cb;
  }

  setOverscanHeight(height: OverscanHeight) {
    if (!height.endsWith('px') && !height.endsWith('%')) {
      throw new Error(
        'Overscan height must be specified in pixels or percents.'
      );
    }

    this._observer.disconnect();
    this._observer = this._createObserver(height);
  }

  getContentBoxWidth(): number {
    return this._contentBoxWidth;
  }

  getBorderBoxHeight(): number {
    return this._borderBoxHeight;
  }

  setScrollLimit(limit: number) {
    const roundLimit = Math.round(limit);
    this._paneElement.style.setProperty('--scroll-limit', `${roundLimit}px`);
  }

  // this method is probably unnecessary
  append(...items: Element[]) {
    this._paneElement.append(...items);
    for (const item of items) {
      this._newItems.add(item)
      this._observer.observe(item);
    }
  }
 
  // this method is probably unnecessary 
  prepend(...items: Element[]) {
    this._paneElement.prepend(...items);
    for (const item of items) {
      this._newItems.add(item)
      this._observer.observe(item);
    }
  }

  appendItem(item: Element) {
    this._paneElement.append(item);
    this._newItems.add(item)
    this._observer.observe(item);
  }
  
  prependItem(item: Element) {
    this._paneElement.prepend(item);
    this._newItems.add(item)
    this._observer.observe(item);
  }

  removeItem(itemIndex: number): boolean {
    const item = this._paneElement.children.item(itemIndex);

    if (item) {
      item.remove();
      return true;
    }

    return false;
  }

  get length(): number {
    return this._paneElement.children.length;
  }
}