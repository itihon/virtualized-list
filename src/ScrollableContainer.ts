import ScrolledPane from './ScrolledPane';
import Filler from './Filler';
import './ScrollableContainer.css';

export type OnScrollLimitCallback = (scrolledPane: ScrolledPane, scrollTop: number) => void;

const topSymbol: unique symbol = Symbol('top');
const bottomSymbol: unique symbol = Symbol('bottom');

type TopSymbol = typeof topSymbol;
type BottomSymbol = typeof bottomSymbol;

export default class ScrollableContainer {
  private static readonly _TOP: TopSymbol = topSymbol;
  private static readonly _BOTTOM: BottomSymbol = bottomSymbol;

  private _scrollableParent: HTMLElement;
  private _fillerTop: Filler;
  private _fillerBottom: Filler;
  private _scrolledPane: ScrolledPane;
  private _onScrollDownLimitCB: OnScrollLimitCallback = () => {};
  private _onScrollUpLimitCB: OnScrollLimitCallback = () => {};
  private _resizeObserver: ResizeObserver;
  private _scrollHeight: number = 0;
  private _observerTop: IntersectionObserver;
  private _observerBottom: IntersectionObserver;
  private _isScrolling: boolean = false;

  private _createObserver(position: TopSymbol | BottomSymbol): IntersectionObserver {

    const rootMargin = position === ScrollableContainer._TOP 
      ? '25% 0px -101% 0px' 
      : position === ScrollableContainer._BOTTOM 
        ? '-101% 0px 25% 0px' 
        : '';

    const observer = new IntersectionObserver((entries) => {
      const entry = entries[entries.length - 1];
      const scrolledPane = this._scrolledPane;

      this._scrolledPane.scrollLimit = 
        entry.boundingClientRect.height - this._scrollableParent.offsetHeight;

      if (this._isScrolling) {
        if (!entry.isIntersecting) {

          if (position === ScrollableContainer._TOP) 
            this._onScrollUpLimitCB(
              scrolledPane, this._scrollableParent.scrollTop,
            );

          if (position === ScrollableContainer._BOTTOM) 
            this._onScrollDownLimitCB(
              scrolledPane, this._scrollableParent.scrollTop,
            );

          observer.disconnect();
          observer.observe(scrolledPane.DOMRoot);
          this._isScrolling = false;
        }
      }
    }, {
      root: this._scrollableParent,
      rootMargin: rootMargin,
      threshold: [0.001],
    });

    return observer;
  }

  constructor(scrollableParent: HTMLElement) {
    this._scrollableParent = scrollableParent;    
    this._fillerTop = new Filler(scrollableParent);
    this._scrolledPane = new ScrolledPane(scrollableParent);
    this._fillerBottom = new Filler(scrollableParent);

    this._scrollableParent.classList.add('class__ScrollableContainer');

    this._resizeObserver = new ResizeObserver(
      // () => this.setScrollHeight(this._scrollHeight),
      () => { 
        console.log('resize observer'); 
        this.setScrollHeight(this._scrollHeight); 
      },
    );

    this._resizeObserver.observe(this._scrollableParent);

    this._observerTop = this._createObserver(ScrollableContainer._TOP);
    this._observerBottom = this._createObserver(ScrollableContainer._BOTTOM);

    this._observerTop.observe(this._scrolledPane.DOMRoot);
    this._observerBottom.observe(this._scrolledPane.DOMRoot);

    this._scrollableParent.addEventListener('scroll', () => {
      this._isScrolling = true;
    });
  }

  onScrollDownLimit(cb: OnScrollLimitCallback) {
    this._onScrollDownLimitCB = cb;
  }
  
  onScrollUpLimit(cb: OnScrollLimitCallback) {
    this._onScrollUpLimitCB = cb;
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
