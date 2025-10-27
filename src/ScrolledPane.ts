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
  private _tempContainer = document.createDocumentFragment();
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
  private _observerRoot: HTMLElement;
  private _filteredEntriesMap: Map<Element, IntersectionObserverEntry> = new Map();
  private _entriesIndexMap: Map<Element, number> = new Map();
  private _ignoredEntries: Set<Element> = new Set();
  private _overscanHeight: OverscanHeight = '0px';
  private _appendRAFID: number | null = null;
  private _prependRAFID: number | null = null;
  private _clearRAFID: number | null = null;

  private _applyAppend = () => {
    this._paneElement.append(this._tempContainer);
    this._appendRAFID = null;
  };

  private _applyPrepend = () => {
    this._paneElement.prepend(this._tempContainer);
    this._prependRAFID = null;
  };

  private _applyClear = () => {
    this.clear();
    this._clearRAFID = null;
  }

  private _filterDuplicateEntries (entries: IntersectionObserverEntry[]): IntersectionObserverEntry[] {
    const filteredEntriesMap = this._filteredEntriesMap;
    const entriesIndexMap = this._entriesIndexMap;
    const entriesCount = entries.length;
    const result = [];

    filteredEntriesMap.clear();
    entriesIndexMap.clear();

    for (let i = 0; i < entriesCount; i++)  {
      const entry = entries[i];
      const { time, target } = entry;
      const filteredEntry = filteredEntriesMap.get(target);

      if (!filteredEntry) {
        filteredEntriesMap.set(target, entry);
        entriesIndexMap.set(target, result.push(entry) - 1);
      }
      else {
        if (filteredEntry.time < time) {
          filteredEntriesMap.set(target, entry);
          result[entriesIndexMap.get(target)!] = entry;
        }
      }
    }

    return result;
  }

  private _runCallbacks: IntersectionObserverCallback = (entries, observer) => {
    const onEachEntryMeasuredCB = this._onEachEntryMeasuredCB;
    const newEntries: Array<IntersectionObserverEntry> = [];
    const newItems = this._newItems;
    const paneElement = this._paneElement;
    const filteredEntries = this._filterDuplicateEntries(entries);
    const entriesCount = filteredEntries.length;

    this._onBeforeEntriesMeasuredCB(filteredEntries, observer);

    for (let entryNumber = 0; entryNumber < entriesCount; entryNumber++) {
      const entry = filteredEntries[entryNumber];
      const { target } = entry;

      if (newItems.has(target)) {
        newEntries.push(entry);
        newItems.delete(target);
      }

      if (target.parentElement !== paneElement) {
        observer.unobserve(target);
      }

      onEachEntryMeasuredCB(entry, filteredEntries, observer);
    }

    if (newEntries.length) this._onNewItemsCB(newEntries, observer);

    this._onAllEntriesMeasuredCB(filteredEntries, observer);
  };
  
  private _createObserver(height: OverscanHeight): IntersectionObserver {

    const rootMargin = `${height} 0px ${height} 0px`;

    return new IntersectionObserver(
      this._runCallbacks, 
      {
        root: this._observerRoot,
        rootMargin: rootMargin,
      }
    );
  }

  constructor(parentContainer: HTMLElement, classList: string[] = []) {
    super(parentContainer, ['class__ScrolledPane', ...classList]);
    this._paneElement = super.DOMRoot;

    this._resizeObserver = new ResizeObserver((entries, observer) => {
      this._contentBoxWidth = entries[0].contentBoxSize[0].inlineSize;
      this._borderBoxHeight = entries[0].borderBoxSize[0].blockSize;
      this._onSizeUpdatedCB(entries, observer);
    });

    // initial observer setup, will be changed when setOverscan() is called
    this._observerRoot = parentContainer;
    this._observer = this._createObserver('0px');
  }

  set offsetTop(top: number) {
    const roundTop = Math.round(top)
    this._paneElement.style.top = `${roundTop}px`;
  }

  set offsetHeight(height: number) {
    const roundHeight = Math.round(height)
    this._paneElement.style.height = `${roundHeight}px`;
  }

  set offsetWidth(width: number) {
    const roundWidth = Math.round(width)
    this._paneElement.style.width = `${roundWidth}px`;
  }

  set translateY(shiftY: number) {
    const roundShiftY = Math.round(shiftY - this._borderBoxHeight); // includes `transform: translateY(-100%);` declaration set at `.class__ScrolledPane {} CSS rule`
    this._paneElement.style.transform = `translateY(${roundShiftY}px)`;
  }

  scheduleSizeUpdate() {
    this._resizeObserver.disconnect();
    this._resizeObserver.observe(this._paneElement);
  }

  scheduleEntriesMeasuring() {
    const ignoredEntries = this._ignoredEntries;

    this._observer.disconnect();
    for (const item of this._paneElement.children) {
      if (!ignoredEntries.has(item)) this._observer.observe(item);
    }
  }

  addIgnoredEntry(element: Element) {
    this._ignoredEntries.add(element);
  }

  runScheduledCallbacks() {
    const entries = this._observer.takeRecords();

    if (entries.length) {
      this._runCallbacks(entries, this._observer);
    }
  }

  cancelScheduledCallbacks() {
    this._observer.disconnect();
    this._observer.takeRecords();
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

  setOverscan(height: OverscanHeight, observerRoot: HTMLElement) {
    if (!height.endsWith('px') && !height.endsWith('%')) {
      throw new Error(
        'Overscan height must be specified in pixels or percents.'
      );
    }

    this._overscanHeight = height;
    this._observerRoot = observerRoot;
    this._observer.disconnect();
    this._observer = this._createObserver(height);
  }

  getOverscan(): OverscanHeight {
    return this._overscanHeight;
  }

  getContentBoxWidth(): number {
    return this._contentBoxWidth;
  }

  getBorderBoxHeight(): number {
    return this._borderBoxHeight;
  }

  appendItem(item: Element) {
    this._paneElement.append(item);
    this._newItems.add(item)
  }
  
  prependItem(item: Element) {
    this._paneElement.prepend(item);
    this._newItems.add(item)
  }

  clear() {
    const paneElement = this._paneElement;
    let lastElementChild;

    while ((lastElementChild = paneElement.lastElementChild)) {
      lastElementChild.remove();
    }
  }

  scheduleAppendItem(item: Element) {
    this._tempContainer.append(item);
    this._newItems.add(item)

    if (this._appendRAFID === null) {
      this._appendRAFID = requestAnimationFrame(this._applyAppend);
    }
  }
  
  schedulePrependItem(item: Element) {
    this._tempContainer.prepend(item);
    this._newItems.add(item)

    if (this._prependRAFID === null) {
      this._prependRAFID = requestAnimationFrame(this._applyPrepend);
    }
  }

  scheduleClear() {
    if (this._clearRAFID === null) {
      this._clearRAFID = requestAnimationFrame(this._applyClear);
    }
  }

  removeItemByIndex(itemIndex: number): boolean {
    const item = this._paneElement.children.item(itemIndex);

    if (item) {
      item.remove();
      this._observer.unobserve(item);
      return true;
    }

    return false;
  }

  getFirstItem(): HTMLElement | null {
    return this._paneElement.firstElementChild as HTMLElement;
  }

  getLastItem(): HTMLElement | null {
    return this._paneElement.lastElementChild as HTMLElement;
  }

  get length(): number {
    return this._paneElement.children.length;
  }
}