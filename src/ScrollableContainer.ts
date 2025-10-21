import ScrolledPane, { type OverscanHeight, type OnNewItemsCallback, type OnEachEntryMeasuredCallback, type OnAllEntriesMeasuredCallback } from './ScrolledPane';
import Filler from './Filler';
import ScrolledPaneBuffer from './ScrolledPaneBuffer';
import './ScrollableContainer.css';
import { createItemsHeightReducer, createFlexRowsReducer } from './reducers';
import StickyContainer from './StickyContainer';
import OneTimeValue from './OneTimeValue';

export type OnResizeCallback = (inlineSize: number, blockSize: number) => void;
export type OnOverscanCallback = (scrolledPane: ScrolledPane, scrollTop: number, previousScrollTop: number) => void;
export type OnReadBufferCallback = (buffer: ScrolledPaneBuffer, scrollTop: number, previousScrollTop: number) => void;
export { type OverscanHeight, type OnNewItemsCallback };

export default class ScrollableContainer {
  private _scrollableParent: HTMLElement;
  private _scrollHeightFiller: Filler;
  private _fillerTop: Filler;
  private _fillerBottom: Filler;
  private _stickyContainer: StickyContainer;
  private _scrolledPane: ScrolledPane;
  private _scrolledPaneTopBuffer: ScrolledPaneBuffer;
  private _scrolledPaneBottomBuffer: ScrolledPaneBuffer;
  private _onResizeCB: OnResizeCallback = () => {};
  private _onScrollDownOverscanCB: OnOverscanCallback = () => {};
  private _onScrollUpOverscanCB: OnOverscanCallback = () => {};
  private _onScrollDownEmptyBufferCB: OnReadBufferCallback = () => {};
  private _onScrollUpEmptyBufferCB: OnReadBufferCallback = () => {};
  private _onScrollDownReadBufferCB: OnReadBufferCallback = () => {};
  private _onScrollUpReadBufferCB: OnReadBufferCallback = () => {};
  private _resizeObserver: ResizeObserver;
  private _scrollHeight: number = 0;
  private _scrollTop: number = 0;
  private _previousScrollTop: number = 0;
  private _itemsHeightAcc = createItemsHeightReducer();
  private _intersectedEntriesAcc = createFlexRowsReducer();
  private _notIntersectedEntriesAcc = createFlexRowsReducer();
  private _bufferedEntriesAcc = createFlexRowsReducer();
  private _itemsHeightAccResult = this._itemsHeightAcc.getAccumulator();
  private _intersectedEntriesAccResult = this._intersectedEntriesAcc.getAccumulator();
  private _notIntersectedEntriesAccResult = this._notIntersectedEntriesAcc.getAccumulator();
  private _bufferedEntriesAccResult = this._bufferedEntriesAcc.getAccumulator();
  private _scrolledPaneScrollHeight: number = 0;
  private _scrolledPaneScrollLimit: number = 0;
  private _scrolledPaneOffsetTop: number = 0;
  private _insertionAdjustment = new OneTimeValue<number>(0);

  private _checkTopBuffer = () => { 
    const buffer = this._scrolledPaneTopBuffer;
    if (!buffer.length) this._onScrollUpEmptyBufferCB(buffer, this._scrollTop, this._previousScrollTop); 
  };

  private _checkBottomBuffer = () => { 
    const buffer = this._scrolledPaneBottomBuffer;
    if (!buffer.length) this._onScrollDownEmptyBufferCB(buffer, this._scrollTop, this._previousScrollTop); 
  };

  private _clearTopBuffer = () => {
    this._scrolledPaneTopBuffer.clear();
  }

  private _clearBottomBuffer = () => {
    this._scrolledPaneBottomBuffer.clear();
  }

  private _adjustScrolledPane = () => {
    this._stickyContainer.setScrollLimit(this._scrolledPaneScrollLimit);
    this.scroll(this._scrolledPaneOffsetTop, this._scrolledPaneScrollHeight);
  };

  private _removeNotIntersectedItems = () => {
    const rows = this._notIntersectedEntriesAccResult.rows;
    const rowsCount = rows.length;

    for (let rowNumber = 0; rowNumber < rowsCount; rowNumber++) {
      const row = rows[rowNumber];
      const itemsCount = row.length;

      for (let itemNumber = 0; itemNumber < itemsCount; itemNumber++) {
        row[itemNumber].target.remove();
      }
    }
  };

  // ! code duplication
  private _insertItemsFromTopBuffer = () => {
    const scrolledPane = this._scrolledPane;
    const rows = this._bufferedEntriesAccResult.rows;
    const rowsCount = rows.length;

    for (let rowNumber = 1; rowNumber < rowsCount; rowNumber++) { // first row is marker
      const row = rows[rowNumber];
      const itemsCount = row.length;

      for (let itemNumber = 0; itemNumber < itemsCount; itemNumber++) {
        scrolledPane.prependItem(row[itemNumber].target);
      }
    }

    this._onScrollUpReadBufferCB(this._scrolledPaneTopBuffer, this._scrollTop, this._previousScrollTop);
  };

  // ! code duplication
  private _insertItemsFromBottomBuffer = () => {
    const scrolledPane = this._scrolledPane;
    const rows = this._bufferedEntriesAccResult.rows;
    const rowsCount = rows.length;

    for (let rowNumber = 1; rowNumber < rowsCount; rowNumber++) { // first row is marker
      const row = rows[rowNumber];
      const itemsCount = row.length;

      for (let itemNumber = 0; itemNumber < itemsCount; itemNumber++) {
        scrolledPane.appendItem(row[itemNumber].target);
      }
    }

    this._onScrollDownReadBufferCB(this._scrolledPaneBottomBuffer, this._scrollTop, this._previousScrollTop);
  };

  private _callScrollUpOverscanCallback = () => {
    this._onScrollUpOverscanCB(this._scrolledPane, this._scrollTop, this._previousScrollTop);
  };

  private _callScrollDownOverscanCallback = () => {
    this._onScrollDownOverscanCB(this._scrolledPane, this._scrollTop, this._previousScrollTop);
  };

  private _initAccumulators = () => {
    const scrolledPane = this._scrolledPane;
    const isScrollingDown = this._previousScrollTop < this._scrollTop;
    const isScrollingUp = this._previousScrollTop > this._scrollTop;

    this._itemsHeightAcc.init();
    this._intersectedEntriesAcc.init(
      scrolledPane.DOMRoot, 
      scrolledPane.getContentBoxWidth(),
      { intersection: true }, // do not create a new object every time !
    );
    this._notIntersectedEntriesAcc.init(
      scrolledPane.DOMRoot, 
      scrolledPane.getContentBoxWidth(),
      { 
        collectTop: isScrollingDown,
        collectBottom: isScrollingUp,
      }, // do not create a new object every time !
    );
  };

  private _initTopBufferAccumulator = () => {
    this._bufferedEntriesAcc.init(
      this._scrolledPaneTopBuffer.DOMRoot,
      this._scrolledPaneTopBuffer.getContentBoxWidth(),
      {
        ignoreLastRow: true,
        ignoreRowIntersection: true,
        minRowsNumber: 2,
      }, // do not create a new object every time !
    );
  };

  private _initBottomBufferAccumulator = () => {
    this._bufferedEntriesAcc.init(
      this._scrolledPaneBottomBuffer.DOMRoot,
      this._scrolledPaneBottomBuffer.getContentBoxWidth(),
      {
        ignoreLastRow: true,
        ignoreRowIntersection: true,
        minRowsNumber: 2,
      }, // do not create a new object every time !
    );
  };

  private _accumulateEntries: OnEachEntryMeasuredCallback = (observerEntry, entries) => {
    this._itemsHeightAcc.exec(observerEntry, entries);
    this._notIntersectedEntriesAcc.exec(observerEntry, entries);
    this._intersectedEntriesAcc.exec(observerEntry, entries);
  };

  private _accumulateBufferEntries: OnEachEntryMeasuredCallback = (observerEntry, entries) => {
    this._bufferedEntriesAcc.exec(observerEntry, entries);
  };

  private _processEntries: OnAllEntriesMeasuredCallback = (entries, observer) => {
    const scrolledPane = this._scrolledPane;
    const rootBounds = entries[0].rootBounds!;
    const itemsHeightAccResult = this._itemsHeightAccResult;
    const intersectedEntriesAccResult = this._intersectedEntriesAccResult;
    const notIntersectedEntriesAccResult = this._notIntersectedEntriesAccResult;
    const bufferedEntriesAccResult = this._bufferedEntriesAccResult;
    const { clientHeight: rootHeight } = this._scrollableParent;
    const scrollTop = this._scrollTop;
    const isScrollingDown = this._previousScrollTop < scrollTop;
    const isScrollingUp = this._previousScrollTop > scrollTop;
    const rowsNumberToRemove = notIntersectedEntriesAccResult.rows.length;

    let isRemovalScheduled = false;
    let isInsertionScheduled = false;

    if (rowsNumberToRemove) {
      requestAnimationFrame(this._removeNotIntersectedItems);
      isRemovalScheduled = true;
    }
     
    if (isScrollingUp) {
      if (itemsHeightAccResult.top > rootBounds.top) {

        this._scrolledPaneTopBuffer.runScheduledCallbacks();
        const rowsNumberToInsert = bufferedEntriesAccResult.rows.length - 1; // exclude marker

        if (rowsNumberToInsert) {
          requestAnimationFrame(this._insertItemsFromTopBuffer);
          isInsertionScheduled = true;
        }
        
        requestAnimationFrame(this._callScrollUpOverscanCallback);
      }
      else {
        this._scrolledPaneTopBuffer.cancelScheduledCallbacks();
      }
    }
    else if (isScrollingDown) {
      if (itemsHeightAccResult.bottom < rootBounds.bottom) {

        this._scrolledPaneBottomBuffer.runScheduledCallbacks();
        const rowsNumberToInsert = bufferedEntriesAccResult.rows.length - 1; // exclude marker

        if (rowsNumberToInsert) {
          requestAnimationFrame(this._insertItemsFromBottomBuffer);
          isInsertionScheduled = true;
        }

        requestAnimationFrame(this._callScrollDownOverscanCallback);
      }
      else {
        this._scrolledPaneBottomBuffer.cancelScheduledCallbacks();
      }
    }

    const insertionAjustment = this._insertionAdjustment.read();

    if (isRemovalScheduled || isInsertionScheduled || insertionAjustment) {
      const paddingTop = parseInt(getComputedStyle(this._scrollableParent).paddingTop);
      const { scrollHeight: scrolledPaneScrollHeight, offsetHeight: scrolledPaneHeight } = scrolledPane.DOMRoot;
      const stickyContainerOffsetTop = this._stickyContainer.DOMRoot.offsetTop - paddingTop;

      let insertedHeight = 0;
      let removedHeight = 0;

      if (isScrollingUp) {
        insertedHeight = isInsertionScheduled ? bufferedEntriesAccResult.rowsHeight - this._scrolledPaneTopBuffer.getMarkerElement().offsetHeight : insertionAjustment;
        removedHeight = isRemovalScheduled ? notIntersectedEntriesAccResult.rowsBottom - intersectedEntriesAccResult.rowsBottom : 0;
        this._scrolledPaneOffsetTop = stickyContainerOffsetTop - insertedHeight;
      }

      if (isScrollingDown) {
        insertedHeight = isInsertionScheduled ? bufferedEntriesAccResult.rowsHeight - this._scrolledPaneBottomBuffer.getMarkerElement().offsetHeight : insertionAjustment;
        removedHeight = isRemovalScheduled ? intersectedEntriesAccResult.rowsTop - notIntersectedEntriesAccResult.rowsTop : 0;
        this._scrolledPaneOffsetTop = stickyContainerOffsetTop + removedHeight;
      }

      const newScrolledPaneScrollHeight = scrolledPaneScrollHeight + (insertedHeight - removedHeight);

      this._scrolledPaneScrollLimit = newScrolledPaneScrollHeight - rootHeight - scrolledPaneHeight + paddingTop; 
      this._scrolledPaneScrollHeight = newScrolledPaneScrollHeight;

      requestAnimationFrame(this._adjustScrolledPane);
    }

    // this._previousScrollTop = (newScrollTop - scrollTop) ? newScrollTop - (scrollTop - this._previousScrollTop) : scrollTop; // scrollTop shift compensation
    this._previousScrollTop = scrollTop;
    observer.disconnect();
  }

  private _updateSizes = (entries: ResizeObserverEntry[]) => { 
    const { blockSize, inlineSize } = entries[0].contentBoxSize[0];
    const scrolledPaneTopBuffer = this._scrolledPaneTopBuffer;
    const scrolledPane = this._scrolledPane;
    const scrolledPaneBottomBuffer = this._scrolledPaneBottomBuffer;

    scrolledPaneTopBuffer.offsetWidth = inlineSize;
    scrolledPaneTopBuffer.offsetHeight = blockSize;
    scrolledPane.offsetWidth = inlineSize;
    scrolledPane.offsetHeight = blockSize;
    // scrolledPane.offsetTop = -blockSize; // use either this or transform: translateY(-100%);
    scrolledPaneBottomBuffer.offsetWidth = inlineSize;
    scrolledPaneBottomBuffer.offsetHeight = blockSize;

    this.setScrollHeight(this._scrollHeight); 
    this._onResizeCB(inlineSize, blockSize);
  };

  private _scrollHandler = () => {
    const scrollTop = this._scrollableParent.scrollTop;

    this._scrollTop = scrollTop;

    const isScrollingDown = this._previousScrollTop < scrollTop;
    const isScrollingUp = this._previousScrollTop > scrollTop;

    this._scrolledPane.scheduleSizeUpdate();

    if (isScrollingDown)  {
      this._scrolledPaneBottomBuffer.scheduleSizeUpdate();
      requestAnimationFrame(this._checkBottomBuffer);

      if (this._scrolledPaneTopBuffer.length) {
        requestAnimationFrame(this._clearTopBuffer);
      }
    }

    if (isScrollingUp) {
      this._scrolledPaneTopBuffer.scheduleSizeUpdate();
      requestAnimationFrame(this._checkTopBuffer);

      if (this._scrolledPaneBottomBuffer.length) {
        requestAnimationFrame(this._clearBottomBuffer);
      }
    }
  };

  constructor(scrollableParent: HTMLElement) {
    this._scrollableParent = scrollableParent;    
    this._scrollHeightFiller = new Filler(scrollableParent, ['Filler__ScrollHeight']);
    this._fillerTop = new Filler(scrollableParent);
    this._scrolledPaneTopBuffer = new ScrolledPaneBuffer(scrollableParent);
    this._stickyContainer = new StickyContainer(scrollableParent);
    this._scrolledPane = new ScrolledPane(this._stickyContainer.DOMRoot);
    this._scrolledPaneBottomBuffer = new ScrolledPaneBuffer(scrollableParent);
    this._fillerBottom = new Filler(scrollableParent);

    this._scrollableParent.classList.add('class__ScrollableContainer');

    this._resizeObserver = new ResizeObserver(this._updateSizes);

    this._resizeObserver.observe(this._scrollableParent);

    this._scrollableParent.addEventListener('scroll', this._scrollHandler);

    this._scrolledPane.onBeforeEntriesMeasured(this._initAccumulators);
    this._scrolledPane.onEachEntryMeasured(this._accumulateEntries);
    this._scrolledPane.onAllEntriesMeasured(this._processEntries);
    this._scrolledPane.onSizeUpdated(() => this._scrolledPane.scheduleEntriesMeasuring());
    this._scrolledPane.scheduleSizeUpdate();

    this._scrolledPaneTopBuffer.onBeforeEntriesMeasured(this._initTopBufferAccumulator);
    this._scrolledPaneTopBuffer.onEachEntryMeasured(this._accumulateBufferEntries);
    this._scrolledPaneTopBuffer.onAllEntriesMeasured((_, observer) => observer.disconnect());
    this._scrolledPaneTopBuffer.onSizeUpdated(() => this._scrolledPaneTopBuffer.scheduleEntriesMeasuring());

    this._scrolledPaneBottomBuffer.onBeforeEntriesMeasured(this._initBottomBufferAccumulator);
    this._scrolledPaneBottomBuffer.onEachEntryMeasured(this._accumulateBufferEntries);
    this._scrolledPaneBottomBuffer.onAllEntriesMeasured((_, observer) => observer.disconnect());
    this._scrolledPaneBottomBuffer.onSizeUpdated(() => this._scrolledPaneBottomBuffer.scheduleEntriesMeasuring());
  }

  onResize(cb: OnResizeCallback) {
    this._onResizeCB = cb;
  }

  onScrollDownOverscan(cb: OnOverscanCallback) {
    this._onScrollDownOverscanCB = cb;
  }
  
  onScrollUpOverscan(cb: OnOverscanCallback) {
    this._onScrollUpOverscanCB = cb;
  }
  
  onScrollDownEmptyBuffer(cb: OnReadBufferCallback) {
    this._onScrollDownEmptyBufferCB = cb;
  }
  
  onScrollUpEmptyBuffer(cb: OnReadBufferCallback) {
    this._onScrollUpEmptyBufferCB = cb;
  }

  onScrollDownReadBuffer(cb: OnReadBufferCallback) {
    this._onScrollDownReadBufferCB = cb;
  }
  
  onScrollUpReadBuffer(cb: OnReadBufferCallback) {
    this._onScrollUpReadBufferCB = cb;
  }

  onNewItems(cb: OnNewItemsCallback) {
    this._scrolledPane.onNewItems(cb);
  }

  appendItem(item: HTMLElement) {
    this._scrolledPane.appendItem(item);
  }
  
  prependItem(item: HTMLElement) {
    this._scrolledPane.prependItem(item);
  }

  scheduleAppendItem(item: HTMLElement) {
    this._scrolledPane.scheduleAppendItem(item);
  }
  
  schedulePrependItem(item: HTMLElement) {
    this._scrolledPane.schedulePrependItem(item);
  }
  
  removeItem(itemIndex: number): boolean {
    return this._scrolledPane.removeItemByIndex(itemIndex);
  }
  
  get length(): number {
    return this._scrolledPane.length;
  }

  getFirstItem(): HTMLElement | null {
    return this._scrolledPane.getFirstItem();
  }
  
  getLastItem(): HTMLElement | null {
    return this._scrolledPane.getLastItem();
  }

  setOverscanHeight(height: OverscanHeight) {
    this._scrolledPane.setOverscan(height, this._scrollableParent);
  }

  getOverscanHeight(): number {
    const overscan = this._scrolledPane.getOverscan();

    return overscan.endsWith('%') 
      ? this._scrolledPane.getBorderBoxHeight() * parseFloat(overscan.slice(0, -1)) / 100
      : parseFloat(overscan);
  }

  setScrollHeight(scrollHeight: number) {
    const { scrollTop } = this._scrollableParent;
    const { offsetHeight: scrolledPaneHeight } = this._scrolledPane.DOMRoot;

    this._scrollHeightFiller.offsetHeight = scrollHeight;
    this._fillerTop.offsetHeight = scrollTop + scrolledPaneHeight;
    this._fillerBottom.offsetHeight = scrollHeight - (scrollTop + scrolledPaneHeight);
    
    this._scrollHeight = scrollHeight;
  }

  getScrollHeight(): number {
    return this._scrollHeight;
  }

  setInsertionAdjustment(insertedHeight: number) {
    this._insertionAdjustment.set(insertedHeight);
  }

  getScrolledPaneOffsetTop(): number {
    return this._scrolledPaneOffsetTop;
  }

  getScrolledPaneScrollHeight(): number {
    return this._scrolledPaneScrollHeight || this._scrolledPane.DOMRoot.scrollHeight;
  }

  scroll(position: number, scrolledPaneScrollHeight: number) {
    const scrolledPaneHeight = this._scrolledPane.getBorderBoxHeight();
    const scrollHeight = this._scrollHeight;

    if (position < scrolledPaneHeight) {
      this._fillerTop.offsetHeight = scrolledPaneHeight;
      this._fillerBottom.offsetHeight = scrollHeight - scrolledPaneHeight;
    }
    else if (position + scrolledPaneScrollHeight - scrolledPaneHeight > scrollHeight) {
      this._fillerTop.offsetHeight = scrollHeight - (scrolledPaneScrollHeight - scrolledPaneHeight);
      this._fillerBottom.offsetHeight = scrollHeight - this._fillerTop.offsetHeight;
    }
    else {
      this._fillerTop.offsetHeight = position;
      this._fillerBottom.offsetHeight = scrollHeight - position;
    }
  }
}
