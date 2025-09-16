import ScrolledPane, { type OverscanHeight, type OnNewItemsCallback, type OnEachEntryMeasuredCallback, type OnAllEntriesMeasuredCallback } from './ScrolledPane';
import Filler from './Filler';
import ScrolledPaneBuffer from './ScrolledPaneBuffer';
import './ScrollableContainer.css';
import { createItemsHeightReducer, createNotIntersectedFlexItemsReducer } from './reducers';

export type OnOverscanCallback = () => void;
export type OnEmptyBufferCallback = (buffer: ScrolledPaneBuffer) => void;

export default class ScrollableContainer {
  private _scrollableParent: HTMLElement;
  private _scrollHeightFiller: Filler;
  private _fillerTop: Filler;
  private _fillerBottom: Filler;
  private _scrolledPane: ScrolledPane;
  private _scrolledPaneTopBuffer: ScrolledPaneBuffer;
  private _scrolledPaneBottomBuffer: ScrolledPaneBuffer;
  private _onScrollDownOverscanCB: OnOverscanCallback = () => {};
  private _onScrollUpOverscanCB: OnOverscanCallback = () => {};
  private _onScrollDownEmptyBufferCB: OnEmptyBufferCallback = () => {};
  private _onScrollUpEmptyBufferCB: OnEmptyBufferCallback = () => {};
  private _resizeObserver: ResizeObserver;
  private _scrollHeight: number = 0;
  private _scrollTop: number = 0;
  private _previousScrollTop: number = 0;
  private _itemsHeightAcc = createItemsHeightReducer();
  private _remainedItemsHeightAcc = createItemsHeightReducer();
  private _notIntersectedEntriesAcc = createNotIntersectedFlexItemsReducer();
  private _itemsHeightAccResult = this._itemsHeightAcc.getAccumulator();
  private _remainedItemsHeightAccResult = this._remainedItemsHeightAcc.getAccumulator();
  private _notIntersectedEntriesAccResult = this._notIntersectedEntriesAcc.getAccumulator();

  private _checkBuffers = () => { 
    const isScrollingDown = this._previousScrollTop < this._scrollTop;
    const isScrollingUp = this._previousScrollTop > this._scrollTop;

    if (isScrollingDown && !this._scrolledPaneBottomBuffer.length) {
      this._onScrollDownEmptyBufferCB(this._scrolledPaneBottomBuffer); 
    }
    
    if (isScrollingUp && !this._scrolledPaneTopBuffer.length) {
      this._onScrollUpEmptyBufferCB(this._scrolledPaneTopBuffer); 
    }
  };

  private _removeNotIntersectedItems = () => {
    for (const row of this._notIntersectedEntriesAccResult.rows) {
      for (const entry of row) {
        entry.target.remove();
      }
    }
  };

  private _initAccumulators = () => {
    const scrolledPane = this._scrolledPane;

    this._itemsHeightAcc.init();
    this._remainedItemsHeightAcc.init();
    this._notIntersectedEntriesAcc.init(
      scrolledPane.DOMRoot, 
      scrolledPane.getContentBoxWidth(),
    );
  };

  private _accumulateEntries: OnEachEntryMeasuredCallback = (observerEntry, entries) => {
    this._itemsHeightAcc.exec(observerEntry, entries);
    this._notIntersectedEntriesAcc.exec(observerEntry, entries);

    if (observerEntry.isIntersecting) {
      this._remainedItemsHeightAcc.exec(observerEntry, entries);
    }
  };

  private _processEntries: OnAllEntriesMeasuredCallback = (entries) => {
    const scrolledPane = this._scrolledPane;
    const rootBounds = entries[0].rootBounds!;
    const itemsHeightAccResult = this._itemsHeightAccResult;
    const remainedItemsHeightAccResult = this._remainedItemsHeightAccResult;
    const notIntersectedEntriesAccResult = this._notIntersectedEntriesAccResult;
    const { scrollTop, clientHeight: rootHeight } = this._scrollableParent;
    const isScrollingDown = this._previousScrollTop < scrollTop;
    const isScrollingUp = this._previousScrollTop > scrollTop;
    const paddingTop = parseInt(
      getComputedStyle(this._scrollableParent).paddingTop,
    );

    const { offsetTop: scrolledPaneOffsetTop } = scrolledPane.DOMRoot;

    if (isScrollingUp && itemsHeightAccResult.top > rootBounds.top) {

      if (notIntersectedEntriesAccResult.rows.length) {
        requestAnimationFrame(this._removeNotIntersectedItems);
      }

      this._onScrollUpOverscanCB();

      // requestAnimationFrame
      requestAnimationFrame(() => {
        scrolledPane.setScrollLimit(scrolledPane.DOMRoot.scrollHeight - rootHeight + paddingTop);
      });
      this.scroll(scrolledPaneOffsetTop - (itemsHeightAccResult.bottom - remainedItemsHeightAccResult.bottom) - paddingTop);
    }

    if (isScrollingDown && itemsHeightAccResult.bottom < rootBounds.bottom) {

      if (notIntersectedEntriesAccResult.rows.length) {
        requestAnimationFrame(this._removeNotIntersectedItems);
      }

      this._onScrollDownOverscanCB();

      // requestAnimationFrame
      // (previouslyMeasuredScrollHeight - removedItemsHeight + addedItemsHeight) - rootHeight + padding
      requestAnimationFrame(() => {
        scrolledPane.setScrollLimit(scrolledPane.DOMRoot.scrollHeight - rootHeight + paddingTop);
      });
      this.scroll(scrolledPaneOffsetTop + remainedItemsHeightAccResult.top - itemsHeightAccResult.top - paddingTop);
    }

    this._previousScrollTop = scrollTop;
  }

  constructor(scrollableParent: HTMLElement) {
    this._scrollableParent = scrollableParent;    
    this._scrollHeightFiller = new Filler(scrollableParent, ['Filler__ScrollHeight']);
    this._fillerTop = new Filler(scrollableParent);
    this._scrolledPaneTopBuffer = new ScrolledPaneBuffer(scrollableParent);
    this._scrolledPane = new ScrolledPane(scrollableParent);
    this._scrolledPaneBottomBuffer = new ScrolledPaneBuffer(scrollableParent);
    this._fillerBottom = new Filler(scrollableParent);

    this._scrollableParent.classList.add('class__ScrollableContainer');

    this._resizeObserver = new ResizeObserver(() => { 
      this.setScrollHeight(this._scrollHeight); 
    });

    this._resizeObserver.observe(this._scrollableParent);

    this._scrollableParent.addEventListener('scroll', () => {
      requestAnimationFrame(this._checkBuffers);
      this._scrolledPane.scheduleSizeUpdate();
      this._scrolledPane.scheduleEntriesMeasuring();
      this._scrollTop = this._scrollableParent.scrollTop;
    });

    this._scrolledPane.onBeforeEntriesMeasured(this._initAccumulators);
    this._scrolledPane.onEachEntryMeasured(this._accumulateEntries);
    this._scrolledPane.onAllEntriesMeasured(this._processEntries);
  }

  onScrollDownOverscan(cb: OnOverscanCallback) {
    this._onScrollDownOverscanCB = cb;
  }
  
  onScrollUpOverscan(cb: OnOverscanCallback) {
    this._onScrollUpOverscanCB = cb;
  }
  
  onScrollDownEmptyBuffer(cb: OnEmptyBufferCallback) {
    this._onScrollDownEmptyBufferCB = cb;
  }
  
  onScrollUpEmptyBuffer(cb: OnEmptyBufferCallback) {
    this._onScrollUpEmptyBufferCB = cb;
  }

  onNewItems(cb: OnNewItemsCallback) {
    this._scrolledPane.onNewItems(cb);
  }

  append(...nodes: HTMLElement[]) {
    this._scrolledPane.append(...nodes);
  }
  
  prepend(...nodes: HTMLElement[]) {
    this._scrolledPane.prepend(...nodes);
  }
  
  removeItem(itemIndex: number): boolean {
    return this._scrolledPane.removeItem(itemIndex);
  }
  
  get length(): number {
    return this._scrolledPane.length;
  }

  getFirstItem(): HTMLElement | null {
    return this._scrolledPane.DOMRoot.firstElementChild as HTMLElement;
  }
  
  getLastItem(): HTMLElement | null {
    return this._scrolledPane.DOMRoot.lastElementChild as HTMLElement;
  }
  
  prependHTML() {

  }

  appendHTML() {

  }

  setOverscanHeight(height: OverscanHeight) {
    this._scrolledPane.setOverscanHeight(height);
  }

  setScrollHeight(scrollHeight: number) {
    const { scrollTop } = this._scrollableParent;
    const { offsetHeight: scrolledPaneHeight } = this._scrolledPane.DOMRoot;

    this._scrollHeightFiller.offsetHeight = scrollHeight;
    this._fillerTop.offsetHeight = scrollTop;
    this._fillerBottom.offsetHeight = scrollHeight - scrollTop - scrolledPaneHeight;
    
    this._scrollHeight = scrollHeight;
  }

  getScrollHeight(): number {
    return this._scrollHeight;
  }

  scroll(position: number) {
    const { offsetHeight: scrolledPaneHeight, scrollHeight: scrolledPaneScrollHeight } = this._scrolledPane.DOMRoot;
    const scrollHeight = this._scrollHeight;

    if (position < 0) {
      this._fillerTop.offsetHeight = 0;
      this._fillerBottom.offsetHeight = scrollHeight - scrolledPaneHeight;
    }
    else if (position + scrolledPaneScrollHeight > scrollHeight) {
      this._fillerTop.offsetHeight = scrollHeight - scrolledPaneScrollHeight;
      this._fillerBottom.offsetHeight = scrollHeight - this._fillerTop.offsetHeight - scrolledPaneHeight;
    }
    else {
      this._fillerTop.offsetHeight = position;
      this._fillerBottom.offsetHeight = scrollHeight - position - scrolledPaneHeight;
    }
  }
}
