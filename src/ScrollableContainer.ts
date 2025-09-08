import ScrolledPane from './ScrolledPane';
import Filler from './Filler';
import ScrollHeight from './ScrollHeight';
import './ScrollableContainer.css';
import HeightAccumulator from './HeightAccumulator';

type ScrolledPaneBuffer = ScrolledPane;

export type OnOverscanCallback = () => void;
export type OnEmptyBufferCallback = (buffer: ScrolledPaneBuffer) => void;

export type OnNewItemsCallback = (
  newEntries: Array<IntersectionObserverEntry>,
) => void;

export type OverscanHeight = `${string}px` | `${string}%`;

export default class ScrollableContainer {
  private _scrollableParent: HTMLElement;
  private _scrollHeightFiller: ScrollHeight;
  private _fillerTop: Filler;
  private _fillerBottom: Filler;
  private _scrolledPane: ScrolledPane;
  private _scrolledPaneTopBuffer: ScrolledPane;
  private _scrolledPaneBottomBuffer: ScrolledPane;
  private _onScrollDownOverscanCB: OnOverscanCallback = () => {};
  private _onScrollUpOverscanCB: OnOverscanCallback = () => {};
  private _onScrollDownEmptyBufferCB: OnEmptyBufferCallback = () => {};
  private _onScrollUpEmptyBufferCB: OnEmptyBufferCallback = () => {};
  private _onNewItemsCB: OnNewItemsCallback = () => {};
  private _resizeObserver: ResizeObserver;
  private _scrollHeight: number = 0;
  private _previousScrollTop: number = 0;
  private _observer: IntersectionObserver | undefined;
  private _newItems: Set<Element> = new Set();
  private _itemsHeightAcc: HeightAccumulator = new HeightAccumulator();
  private _remainedItemsHeightAcc: HeightAccumulator = new HeightAccumulator();

  private _checkBuffers = () => { 
    const { scrollTop } = this._scrollableParent;
    const isScrollingDown = this._previousScrollTop < scrollTop;
    const isScrollingUp = this._previousScrollTop > scrollTop;

    if (isScrollingDown && !this._scrolledPaneBottomBuffer.length) {
      this._onScrollDownEmptyBufferCB(this._scrolledPaneBottomBuffer); 
    }
    
    if (isScrollingUp && !this._scrolledPaneTopBuffer.length) {
      this._onScrollUpEmptyBufferCB(this._scrolledPaneTopBuffer); 
    }
  };

  private _createObserver(height: OverscanHeight): IntersectionObserver {

    const rootMargin = `${height} 0px ${height} 0px`;

    const observer = new IntersectionObserver((entries) => {

      const notIntersectedEntries: Array<IntersectionObserverEntry> = [];
      const newEntries: Array<IntersectionObserverEntry> = [];
      const scrolledPane = this._scrolledPane;
      const newItems = this._newItems;
      const rootBounds = entries[0].rootBounds!;
      const itemsHeightAcc = this._itemsHeightAcc;
      const remainedItemsHeightAcc = this._remainedItemsHeightAcc;
      const { scrollTop, clientHeight: rootHeight } = this._scrollableParent;
      const isScrollingDown = this._previousScrollTop < scrollTop;
      const isScrollingUp = this._previousScrollTop > scrollTop;
      const paddingTop = parseInt(
        getComputedStyle(this._scrollableParent).paddingTop,
      );

      const { offsetTop: scrolledPaneOffsetTop } = scrolledPane.DOMRoot;
      
      const scrolledPaneScrollHeight = scrolledPane.preserveScrollHeight();

      scrolledPane.preserveOffsetHeight();
      scrolledPane.setScrollLimit(scrolledPaneScrollHeight - rootHeight + paddingTop);

      itemsHeightAcc.reset();
      remainedItemsHeightAcc.reset();

      for (const observerEntry of entries) {
        const { target, boundingClientRect } = observerEntry;

        itemsHeightAcc.accumulate(boundingClientRect);

        if (newItems.has(target)) {
          newEntries.push(observerEntry);
          newItems.delete(target);
        }

        if (!observerEntry.isIntersecting) {
          notIntersectedEntries.push(observerEntry);
        }
        else {
          remainedItemsHeightAcc.accumulate(boundingClientRect);
        }

        if (target.parentElement !== scrolledPane.DOMRoot) {
          observer.unobserve(target);
        }
      }

      if (newEntries.length) this._onNewItemsCB(newEntries);

      if (isScrollingUp && itemsHeightAcc.getTop() > rootBounds.top) {

        for (const entry of notIntersectedEntries) {
          entry.target.remove();
        }

        this._onScrollUpOverscanCB();

        // scrolledPane.setScrollLimit(scrolledPane.DOMRoot.scrollHeight - rootHeight + paddingTop);
        this.scroll(scrolledPaneOffsetTop - (itemsHeightAcc.getBottom() - remainedItemsHeightAcc.getBottom()) - paddingTop);
      }

      if (isScrollingDown && itemsHeightAcc.getBottom() < rootBounds.bottom) {

        for (const entry of notIntersectedEntries) {
          entry.target.remove();
        }

        this._onScrollDownOverscanCB();

        // scrolledPane.setScrollLimit(scrolledPane.DOMRoot.scrollHeight - rootHeight + paddingTop);
        this.scroll(scrolledPaneOffsetTop + remainedItemsHeightAcc.getTop() - itemsHeightAcc.getTop() - paddingTop);
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
    this._scrollHeightFiller = new ScrollHeight(scrollableParent);
    this._fillerTop = new Filler(scrollableParent);
    this._scrolledPaneTopBuffer = new ScrolledPane(scrollableParent, ['ScrolledPane__Buffer']);
    this._scrolledPane = new ScrolledPane(scrollableParent);
    this._scrolledPaneBottomBuffer = new ScrolledPane(scrollableParent, ['ScrolledPane__Buffer']);
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

    this._scrollHeightFiller.setScrollHeight(scrollHeight);
    this._fillerTop.offsetHeight = scrollTop;
    this._fillerBottom.offsetHeight = scrollHeight - scrollTop - scrolledPaneHeight;
    
    this._scrollHeight = scrollHeight;
  }

  getScrollHeight(): number {
    return this._scrollHeight;
  }

  scroll(position: number) {
    const { offsetHeight: scrolledPaneHeight, scrollHeight: scrolledPaneScrollHeight } = this._scrolledPane;
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
