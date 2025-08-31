import ScrolledPane from './ScrolledPane';
import Filler from './Filler';
import ScrollHeight from './ScrollHeight';
import './ScrollableContainer.css';

export type OnOverscanCallback = (
  scrollTop: number, 
  scrollLimit: number,
  paddingTop: number,
  items: HTMLCollection,
  entry: IntersectionObserverEntry,
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

    let _scrollTop = 0;
    
    const rootMargin = `${height} 0px ${height} 0px`;

    const observer = new IntersectionObserver((entries) => {
      const entry = entries[entries.length - 1];
      const scrolledPane = this._scrolledPane;
      const paddingTop = parseInt(
        getComputedStyle(this._scrollableParent).paddingTop
      );

      const { scrollTop } = this._scrollableParent;
      const isScrollingDown = _scrollTop < scrollTop;
      const isScrollingUp = _scrollTop > scrollTop;

      this._scrolledPane.scrollLimit = 
        entry.boundingClientRect.height 
          - this._scrollableParent.clientHeight 
          + paddingTop;

      if (isScrollingUp && entry.boundingClientRect.top > entry.rootBounds!.top) 
        this._onScrollUpOverscanCB(
          this._scrollableParent.scrollTop, 
          scrolledPane.scrollLimit,
          paddingTop,
          scrolledPane.DOMRoot.children,
          entry,
        );

      if (isScrollingDown && entry.boundingClientRect.bottom < entry.rootBounds!.bottom) 
        this._onScrollDownOverscanCB(
          this._scrollableParent.scrollTop, 
          scrolledPane.scrollLimit,
          paddingTop,
          scrolledPane.DOMRoot.children,
          entry,
        );

      _scrollTop = scrollTop;
        
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
    const { offsetHeight: scrolledPaneHeight } = this._scrolledPane.DOMRoot;
    const scrollHeight = this._scrollHeight;

    if (position < 0) {
      this._fillerTop.offsetHeight = 0;
      this._fillerBottom.offsetHeight = scrollHeight - scrolledPaneHeight;
    }
    else if (position + scrolledPaneHeight > scrollHeight) {
      this._fillerTop.offsetHeight = scrollHeight - scrolledPaneHeight;
      this._fillerBottom.offsetHeight = 0;
    }
    else {
      this._fillerTop.offsetHeight = position;
      this._fillerBottom.offsetHeight = scrollHeight - position - scrolledPaneHeight;
    }
  }
}
