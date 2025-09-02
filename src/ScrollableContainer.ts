import ScrolledPane from './ScrolledPane';
import Filler from './Filler';
import ScrollHeight from './ScrollHeight';
import './ScrollableContainer.css';

export type OnOverscanCallback = (
  scrollTop: number, 
  previousScrollTop: number, 
  scrollLimit: number,
  offsetTop: number,
  paddingTop: number,
  items: HTMLCollection,
  entry: IntersectionObserverEntry,
  entries: Array<IntersectionObserverEntry>,
) => void;

type OverscanHeight = `${string}px` | `${string}%`;

export default class ScrollableContainer {
  private _scrollableParent: HTMLElement;
  private _scrollHeightFiller: ScrollHeight;
  private _fillerTop: Filler;
  private _fillerBottom: Filler;
  private _scrolledPane: ScrolledPane;
  private _onScrollDownOverscanCB: OnOverscanCallback = () => {};
  private _onScrollUpOverscanCB: OnOverscanCallback = () => {};
  private _resizeObserver: ResizeObserver;
  private _scrollHeight: number = 0;
  private _observer: IntersectionObserver | undefined;

  private _createObserver(height: OverscanHeight): IntersectionObserver {

    let previousScrollTop = 0;
    
    const rootMargin = `${height} 0px ${height} 0px`;

    const observer = new IntersectionObserver((entries) => {

      let entry: IntersectionObserverEntry | undefined;
      const notIntersectedEntries: Array<IntersectionObserverEntry> = [];
      const scrolledPane = this._scrolledPane;

      for (const observerEntry of entries) {
        if (observerEntry.target === scrolledPane.DOMRoot) {
          entry = observerEntry;
        }
        else {
          if (!observerEntry.isIntersecting) {
            observer.unobserve(observerEntry.target);
            notIntersectedEntries.push(observerEntry);
          }
        }
      }

      if (!entry) return;

      const paddingTop = parseInt(
        getComputedStyle(this._scrollableParent).paddingTop
      );

      const { scrollTop, clientHeight: rootHeight } = this._scrollableParent;
      const isScrollingDown = previousScrollTop < scrollTop;
      const isScrollingUp = previousScrollTop > scrollTop;
      const { height, top, bottom } = entry.boundingClientRect;
      const scrolledPaneOffsetTop = scrolledPane.DOMRoot.offsetTop;

      scrolledPane.offsetHeight = height;
      scrolledPane.scrollLimit = height - rootHeight + paddingTop;

      if (isScrollingUp && top > entry.rootBounds!.top) 
        this._onScrollUpOverscanCB(
          scrollTop, 
          previousScrollTop,
          scrolledPane.scrollLimit,
          scrolledPaneOffsetTop,
          paddingTop,
          scrolledPane.DOMRoot.children,
          entry,
          notIntersectedEntries,
        );

      if (isScrollingDown && bottom < entry.rootBounds!.bottom) 
        this._onScrollDownOverscanCB(
          scrollTop, 
          previousScrollTop,
          scrolledPane.scrollLimit,
          scrolledPaneOffsetTop,
          paddingTop,
          scrolledPane.DOMRoot.children,
          entry,
          notIntersectedEntries,
        );

      previousScrollTop = scrollTop;
        
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
    this._scrolledPane = new ScrolledPane(scrollableParent);
    this._fillerBottom = new Filler(scrollableParent);

    this._scrollableParent.classList.add('class__ScrollableContainer');

    this._resizeObserver = new ResizeObserver(() => { 
      this.setScrollHeight(this._scrollHeight); 
    });

    this._resizeObserver.observe(this._scrollableParent);

    this._scrollableParent.addEventListener('scroll', () => {
      this._observer?.disconnect();
      this._observer?.observe(this._scrolledPane.DOMRoot);
      for (const item of this._scrolledPane.DOMRoot.children) {
        this._observer?.observe(item);
      }
    });
  }

  onScrollDownOverscan(cb: OnOverscanCallback) {
    this._onScrollDownOverscanCB = cb;
  }
  
  onScrollUpOverscan(cb: OnOverscanCallback) {
    this._onScrollUpOverscanCB = cb;
  }

  append(...nodes: HTMLElement[]) {
    this._scrolledPane.append(...nodes);
    for (const node of nodes) {
      this._observer?.observe(node);
    }
  }
  
  prepend(...nodes: HTMLElement[]) {
    this._scrolledPane.prepend(...nodes);
    for (const node of nodes) {
      this._observer?.observe(node);
    }
  }
  
  removeItem(itemIndex: number): boolean {
    return this._scrolledPane.removeItem(itemIndex);
  }
  
  get length(): number {
    return this._scrolledPane.length;
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

  scroll(position: number, offsetHeightDelta: number = 0) {
    const { offsetHeight: scrolledPaneHeight } = this._scrolledPane;
    const scrollHeight = this._scrollHeight;
    const newScrolledPaneHeight = scrolledPaneHeight - offsetHeightDelta;
    this._scrolledPane.offsetHeight = newScrolledPaneHeight;

    if (position < 0) {
      this._fillerTop.offsetHeight = 0;
      this._fillerBottom.offsetHeight = scrollHeight - newScrolledPaneHeight;
    }
    else if (position + newScrolledPaneHeight > scrollHeight) {
      this._fillerTop.offsetHeight = scrollHeight - newScrolledPaneHeight;
      this._fillerBottom.offsetHeight = 0;
    }
    else {
      this._fillerTop.offsetHeight = position;
      this._fillerBottom.offsetHeight = scrollHeight - position - newScrolledPaneHeight;
    }
  }
}
