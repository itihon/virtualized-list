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
  private _observerRoot: HTMLElement;
  private _filteredEntriesMap: Map<Element, IntersectionObserverEntry> = new Map();
  private _entriesIndexMap: Map<Element, number> = new Map();

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

    this._observerRoot = observerRoot;
    this._observer.disconnect();
    this._observer = this._createObserver(height);
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