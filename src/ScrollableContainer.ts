import ScrolledPane from './ScrolledPane';
import Filler from './Filler';
import ScrolledPaneBuffer from './ScrolledPaneBuffer';
import './ScrollableContainer.css';
import { createItemsHeightReducer, createNotIntersectedFlexItemsReducer } from './reducers';

export type OnOverscanCallback = () => void;
export type OnEmptyBufferCallback = (buffer: ScrolledPaneBuffer) => void;

export type OnNewItemsCallback = (
  newEntries: Array<IntersectionObserverEntry>,
) => void;

export type OverscanHeight = `${string}px` | `${string}%`;

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
  private _onNewItemsCB: OnNewItemsCallback = () => {};
  private _resizeObserver: ResizeObserver;
  private _scrollHeight: number = 0;
  private _scrollTop: number = 0;
  private _previousScrollTop: number = 0;
  private _observer: IntersectionObserver | undefined;
  private _newItems: Set<Element> = new Set();
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

  private _createObserver(height: OverscanHeight): IntersectionObserver {

    const rootMargin = `${height} 0px ${height} 0px`;

    const observer = new IntersectionObserver((entries) => {

      const newEntries: Array<IntersectionObserverEntry> = [];
      const scrolledPane = this._scrolledPane;
      const newItems = this._newItems;
      const rootBounds = entries[0].rootBounds!;
      const itemsHeightAcc = this._itemsHeightAcc;
      const remainedItemsHeightAcc = this._remainedItemsHeightAcc;
      const notIntersectedEntriesAcc = this._notIntersectedEntriesAcc;
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
      
      itemsHeightAcc.init();
      remainedItemsHeightAcc.init();
      notIntersectedEntriesAcc.init(scrolledPane.DOMRoot, scrolledPane.getContentBoxWidth());

      for (const observerEntry of entries) {
        const { target } = observerEntry;

        itemsHeightAcc.run(observerEntry, entries);
        notIntersectedEntriesAcc.run(observerEntry, entries);

        if (newItems.has(target)) {
          newEntries.push(observerEntry);
          newItems.delete(target);
        }

        if (!observerEntry.isIntersecting) {
        }
        else {
          remainedItemsHeightAcc.run(observerEntry, entries);
        }

        if (target.parentElement !== scrolledPane.DOMRoot) {
          observer.unobserve(target);
        }
      }

      if (newEntries.length) this._onNewItemsCB(newEntries);

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
        
    }, {
      root: this._scrollableParent,
      rootMargin: rootMargin,
    });

    return observer;
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
      this._observer?.disconnect();
      for (const item of this._scrolledPane.DOMRoot.children) {
        this._observer?.observe(item);
      }

      requestAnimationFrame(this._checkBuffers);
      this._scrolledPane.scheduleSizeUpdate();

      this._scrollTop = this._scrollableParent.scrollTop;
    });
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
    this._onNewItemsCB = cb;
  }

  append(...nodes: HTMLElement[]) {
    this._scrolledPane.append(...nodes);
    for (const node of nodes) {
      this._newItems.add(node)
      this._observer?.observe(node);
    }
  }
  
  prepend(...nodes: HTMLElement[]) {
    this._scrolledPane.prepend(...nodes);
    for (const node of nodes) {
      this._newItems.add(node)
      this._observer?.observe(node);
    }
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

  // clear() {
  //   const children = this._scrolledPane.children;
  //   const length = children.length;

  //   for (let i = 0; i < length; i++) {
  //     children[i].remove();
  //   }
  // }

  // getLength(): number {
  //   return this._scrolledPane.children.length;
  // }
  setOverscanHeight(height: OverscanHeight) {
    if (!height.endsWith('px') && !height.endsWith('%')) {
      throw new Error(
        'Overscan height must be specified in pixels or percents.'
      );
    }

    this._observer?.disconnect();
    this._observer = this._createObserver(height);
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

    // this._scrolledPane.setScrollLimit(scrolledPaneScrollHeight - this._scrollableParent.clientHeight);

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
