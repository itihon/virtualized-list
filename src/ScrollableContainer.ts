import ScrolledPane from './ScrolledPane';
import Filler from './Filler';
import './ScrollableContainer.css';

export type OnScrollCallback = (
  scrollTop: number, 
  scrollLimit: number,
  items: HTMLCollection,
  entry: IntersectionObserverEntry,
) => void;

const topSymbol: unique symbol = Symbol('top');
const bottomSymbol: unique symbol = Symbol('bottom');

type TopSymbol = typeof topSymbol;
type BottomSymbol = typeof bottomSymbol;
type OverscanHeight = `${string}px` | `${string}%`;

export default class ScrollableContainer {
  private static readonly _TOP: TopSymbol = topSymbol;
  private static readonly _BOTTOM: BottomSymbol = bottomSymbol;

  private _scrollableParent: HTMLElement;
  private _fillerTop: Filler;
  private _fillerBottom: Filler;
  private _scrolledPane: ScrolledPane;
  private _onScrollDownLimitCB: OnScrollCallback = () => {};
  private _onScrollUpLimitCB: OnScrollCallback = () => {};
  private _onScrollDownOverscanCB: OnScrollCallback = () => {};
  private _onScrollUpOverscanCB: OnScrollCallback = () => {};
  private _onScrollDownOverflowCB: OnScrollCallback = () => {};
  private _onScrollUpOverflowCB: OnScrollCallback = () => {};
  private _resizeObserver: ResizeObserver;
  private _scrollHeight: number = 0;
  private _observerTop: IntersectionObserver | undefined;
  private _observerBottom: IntersectionObserver | undefined;

  private _createObserver(
    position: TopSymbol | BottomSymbol, 
    height: OverscanHeight,
    maxThreshold: number,
  ): IntersectionObserver {
    
    const rootMargin = position === ScrollableContainer._TOP 
      ? `${height} 0px -101% 0px` 
      : position === ScrollableContainer._BOTTOM 
        ? `-101% 0px ${height} 0px` 
        : '';

    const observer = new IntersectionObserver((entries) => {
      const entry = entries[entries.length - 1];
      const scrolledPane = this._scrolledPane;

      const { paddingTop } = getComputedStyle(this._scrollableParent);
      this._scrolledPane.scrollLimit = 
        entry.boundingClientRect.height 
          - this._scrollableParent.clientHeight 
          + parseInt(paddingTop);

        if (!entry.isIntersecting) {

          if (position === ScrollableContainer._TOP) 
            this._onScrollUpLimitCB(
              this._scrollableParent.scrollTop, 
              scrolledPane.scrollLimit,
              scrolledPane.DOMRoot.children,
              entry,
            );

          if (position === ScrollableContainer._BOTTOM) 
            this._onScrollDownLimitCB(
              this._scrollableParent.scrollTop, 
              scrolledPane.scrollLimit,
              scrolledPane.DOMRoot.children,
              entry,
            );
        }
        else {
          const intersectionDiff = 
            entry.rootBounds!.height / entry.boundingClientRect.height -
            entry.intersectionRatio;
          
          if (intersectionDiff < 0.001) {

            if (position === ScrollableContainer._TOP) 
              this._onScrollUpOverflowCB(
                this._scrollableParent.scrollTop, 
                scrolledPane.scrollLimit,
                scrolledPane.DOMRoot.children,
                entry,
              );

            if (position === ScrollableContainer._BOTTOM) 
              this._onScrollDownOverflowCB(
                this._scrollableParent.scrollTop, 
                scrolledPane.scrollLimit,
                scrolledPane.DOMRoot.children,
                entry,
              );
          }
          else {

            if (position === ScrollableContainer._TOP) 
              this._onScrollUpOverscanCB(
                this._scrollableParent.scrollTop, 
                scrolledPane.scrollLimit,
                scrolledPane.DOMRoot.children,
                entry,
              );

            if (position === ScrollableContainer._BOTTOM) 
              this._onScrollDownOverscanCB(
                this._scrollableParent.scrollTop, 
                scrolledPane.scrollLimit,
                scrolledPane.DOMRoot.children,
                entry,
              );
          }
        }
        
    }, {
      root: this._scrollableParent,
      rootMargin: rootMargin,
      threshold: [
        0.001, 
        ...Array.from({ length: 100 }, (_, idx) => (idx + 1) * (maxThreshold / 100)),
      ],
    });

    return observer;
  }

  constructor(scrollableParent: HTMLElement) {
    this._scrollableParent = scrollableParent;    
    this._fillerTop = new Filler(scrollableParent);
    this._scrolledPane = new ScrolledPane(scrollableParent);
    this._fillerBottom = new Filler(scrollableParent);

    this._scrollableParent.classList.add('class__ScrollableContainer');

    this._resizeObserver = new ResizeObserver(() => { 
      this.setScrollHeight(this._scrollHeight); 
    });

    this._resizeObserver.observe(this._scrollableParent);

    this._scrollableParent.addEventListener('scroll', () => {
      this._observerTop?.disconnect();
      this._observerBottom?.disconnect();

      this._observerTop?.observe(this._scrolledPane.DOMRoot);
      this._observerBottom?.observe(this._scrolledPane.DOMRoot);
    });
  }

  onScrollDownLimit(cb: OnScrollCallback) {
    this._onScrollDownLimitCB = cb;
  }
  
  onScrollUpLimit(cb: OnScrollCallback) {
    this._onScrollUpLimitCB = cb;
  }
  
  onScrollDownOverscan(cb: OnScrollCallback) {
    this._onScrollDownOverscanCB = cb;
  }
  
  onScrollUpOverscan(cb: OnScrollCallback) {
    this._onScrollUpOverscanCB = cb;
  }

  onScrollDownOverflow(cb: OnScrollCallback) {
    this._onScrollDownOverflowCB = cb;
  }
  
  onScrollUpOverflow(cb: OnScrollCallback) {
    this._onScrollUpOverflowCB = cb;
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

    this._observerTop?.disconnect();
    this._observerBottom?.disconnect();
    
    this._observerTop = this._createObserver(
      ScrollableContainer._TOP, height, maxThreshold,
    );
    this._observerBottom = this._createObserver(
      ScrollableContainer._BOTTOM, height, maxThreshold,
    );

    this._observerTop.observe(this._scrolledPane.DOMRoot);
    this._observerBottom.observe(this._scrolledPane.DOMRoot);

  }

  setScrollHeight(scrollHeight: number) {
    const { scrollTop } = this._scrollableParent;
    const { offsetHeight: scrolledPaneHeight } = this._scrolledPane;

    this._fillerTop.offsetHeight = Math.round(scrollTop);
    this._fillerBottom.offsetHeight = Math.round(scrollHeight - scrollTop - scrolledPaneHeight);
    
    this._scrollHeight = scrollHeight;
  }

  getScrollHeight(): number {
    return this._scrollHeight;
  }

  scroll(position: number) {
    const { offsetHeight: scrolledPaneHeight } = this._scrolledPane;
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
