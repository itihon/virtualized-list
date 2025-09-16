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
  private _resizeObserver: ResizeObserver;
  private _observer: IntersectionObserver;
  private _onEachEntryMeasuredCB: OnEachEntryMeasuredCallback = () => {};
  private _onAllEntriesMeasuredCB: OnAllEntriesMeasuredCallback = () => {};
  private _onBeforeEntriesMeasuredCB: OnBeforeEntriesMeasuredCallback = () => {};
  private _onNewItemsCB: OnNewItemsCallback = () => {};
  private _newItems: Set<Element> = new Set();
  
  private _createObserver(height: OverscanHeight): IntersectionObserver {

    const rootMargin = `${height} 0px ${height} 0px`;

    return new IntersectionObserver((entries, observer) => {
      const onEachEntryMeasuredCB = this._onEachEntryMeasuredCB;
      const newEntries: Array<IntersectionObserverEntry> = [];
      const newItems = this._newItems;
      const paneElement = this._paneElement;

      this._onBeforeEntriesMeasuredCB(entries, observer);

      for (const entry of entries) {
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
    }, {
      root: this.parentContainer,
      rootMargin: rootMargin,
    });
  }

  constructor(scrollableParent: HTMLElement, classList: string[] = []) {
    super(scrollableParent, ['class__ScrolledPane', ...classList]);
    this._paneElement = super.DOMRoot;

    this._resizeObserver = new ResizeObserver((entries) => {
      this._contentBoxWidth = entries[0].contentBoxSize[0].inlineSize;
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

  setScrollLimit(limit: number) {
    const roundLimit = Math.round(limit);
    this._paneElement.style.setProperty('--scroll-limit', `${roundLimit}px`);
  }

  append(...items: HTMLElement[]) {
    this._paneElement.append(...items);
    for (const item of items) {
      this._newItems.add(item)
      this._observer.observe(item);
    }
  }
  
  prepend(...items: HTMLElement[]) {
    this._paneElement.prepend(...items);
    for (const item of items) {
      this._newItems.add(item)
      this._observer.observe(item);
    }
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