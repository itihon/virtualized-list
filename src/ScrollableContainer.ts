import ScrolledPane, { type OverscanHeight, type OnNewItemsCallback, type OnEachEntryMeasuredCallback, type OnAllEntriesMeasuredCallback } from './ScrolledPane';
import Filler from './Filler';
import ScrolledPaneBuffer from './ScrolledPaneBuffer';
import './ScrollableContainer.css';
import { createItemsHeightReducer, createFlexRowsReducer } from './reducers';

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

  private _checkTopBuffer = () => { 
    const buffer = this._scrolledPaneTopBuffer;
    if (!buffer.length) this._onScrollUpEmptyBufferCB(buffer); 
  };

  private _checkBottomBuffer = () => { 
    const buffer = this._scrolledPaneBottomBuffer;
    if (!buffer.length) this._onScrollDownEmptyBufferCB(buffer); 
  };

  private _adjustScrolledPane = () => {
    this._scrolledPane.setScrollLimit(this._scrolledPaneScrollLimit);
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
  };

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

  private _initBufferAccumulators = () => {
    const isScrollingDown = this._previousScrollTop < this._scrollTop;
    const isScrollingUp = this._previousScrollTop > this._scrollTop;

    const scrolledPaneBuffer = isScrollingDown 
      ? this._scrolledPaneBottomBuffer
      : this._scrolledPaneTopBuffer;

    this._bufferedEntriesAcc.init(
      scrolledPaneBuffer.DOMRoot,
      scrolledPaneBuffer.getContentBoxWidth(),
      {
        ignoreLastRow: isScrollingUp,
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

  private _processEntries: OnAllEntriesMeasuredCallback = (entries) => {
    const scrolledPane = this._scrolledPane;
    const rootBounds = entries[0].rootBounds!;
    const itemsHeightAccResult = this._itemsHeightAccResult;
    const intersectedEntriesAccResult = this._intersectedEntriesAccResult;
    const notIntersectedEntriesAccResult = this._notIntersectedEntriesAccResult;
    const bufferedEntriesAccResult = this._bufferedEntriesAccResult;
    const { scrollTop, clientHeight: rootHeight } = this._scrollableParent;
    const isScrollingDown = this._previousScrollTop < scrollTop;
    const isScrollingUp = this._previousScrollTop > scrollTop;
    const paddingTop = parseInt(
      getComputedStyle(this._scrollableParent).paddingTop,
    );

    const { offsetTop: scrolledPaneOffsetTop, scrollHeight: scrolledPaneScrollHeight } = scrolledPane.DOMRoot;
    const rowsNumberToRemove = notIntersectedEntriesAccResult.rows.length;
    const rowsNumberToInsert = bufferedEntriesAccResult.rows.length - 1; // exclude marker

    let isRemovalScheduled = false;
    let isInsertionScheduled = false;

    if (rowsNumberToRemove) {
      requestAnimationFrame(this._removeNotIntersectedItems);
      isRemovalScheduled = true;
    }
      
    if (isScrollingUp && itemsHeightAccResult.top > rootBounds.top) {

      this._scrolledPaneTopBuffer.runScheduledCallbacks();

      if (rowsNumberToInsert) {
        requestAnimationFrame(this._insertItemsFromTopBuffer);
        isInsertionScheduled = true;
      }
      
      // this._onScrollUpOverscanCB();
    }

    if (isScrollingDown && itemsHeightAccResult.bottom < rootBounds.bottom) {

      this._scrolledPaneBottomBuffer.runScheduledCallbacks();

      if (rowsNumberToInsert) {
        requestAnimationFrame(this._insertItemsFromBottomBuffer);
        isInsertionScheduled = true;
      }

      // this._onScrollDownOverscanCB();
    }

    if (isRemovalScheduled || isInsertionScheduled) {
      let insertedHeight = 0;
      let removedHeight = 0;

      if (isScrollingUp) {
        insertedHeight = isInsertionScheduled ? bufferedEntriesAccResult.rowsHeight - this._scrolledPaneTopBuffer.getMarkerElement().offsetHeight : 0;
        removedHeight = isRemovalScheduled ? notIntersectedEntriesAccResult.rowsBottom - intersectedEntriesAccResult.rowsBottom : 0;
        this._scrolledPaneOffsetTop = scrolledPaneOffsetTop - insertedHeight - paddingTop;
      }

      if (isScrollingDown) {
        insertedHeight = isInsertionScheduled ? bufferedEntriesAccResult.rowsHeight - this._scrolledPaneBottomBuffer.getMarkerElement().offsetHeight : 0;
        removedHeight = isRemovalScheduled ? intersectedEntriesAccResult.rowsTop - notIntersectedEntriesAccResult.rowsTop : 0;
        this._scrolledPaneOffsetTop = scrolledPaneOffsetTop + removedHeight - paddingTop;
      }

      const newScrolledPaneScrollHeight = scrolledPaneScrollHeight + (insertedHeight - removedHeight);

      this._scrolledPaneScrollLimit = newScrolledPaneScrollHeight - rootHeight + paddingTop; 
      this._scrolledPaneScrollHeight = newScrolledPaneScrollHeight;

      requestAnimationFrame(this._adjustScrolledPane);
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
      this._scrollTop = this._scrollableParent.scrollTop;

      const isScrollingDown = this._previousScrollTop < this._scrollTop;
      const isScrollingUp = this._previousScrollTop > this._scrollTop;

      this._scrolledPane.scheduleSizeUpdate();

      if (isScrollingDown)  {
        this._scrolledPaneBottomBuffer.scheduleSizeUpdate();
        requestAnimationFrame(this._checkBottomBuffer);
      }

      if (isScrollingUp) {
        this._scrolledPaneTopBuffer.scheduleSizeUpdate();
        requestAnimationFrame(this._checkTopBuffer);
      }
    });

    this._scrolledPane.onBeforeEntriesMeasured(this._initAccumulators);
    this._scrolledPane.onEachEntryMeasured(this._accumulateEntries);
    this._scrolledPane.onAllEntriesMeasured(this._processEntries);
    this._scrolledPane.onSizeUpdated(() => this._scrolledPane.scheduleEntriesMeasuring());
    this._scrolledPaneTopBuffer.onBeforeEntriesMeasured(this._initBufferAccumulators);
    this._scrolledPaneTopBuffer.onEachEntryMeasured(this._accumulateBufferEntries);
    this._scrolledPaneTopBuffer.onSizeUpdated(() => this._scrolledPaneTopBuffer.scheduleEntriesMeasuring());
    this._scrolledPaneBottomBuffer.onBeforeEntriesMeasured(this._initBufferAccumulators);
    this._scrolledPaneBottomBuffer.onEachEntryMeasured(this._accumulateBufferEntries);
    this._scrolledPaneBottomBuffer.onSizeUpdated(() => this._scrolledPaneBottomBuffer.scheduleEntriesMeasuring());
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

  scroll(position: number, scrolledPaneScrollHeight: number) {
    const scrolledPaneHeight = this._scrolledPane.getBorderBoxHeight();
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
