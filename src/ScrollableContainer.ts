import ScrolledPane from './ScrolledPane';
import Filler from './Filler';
import './ScrollableContainer.css';

export type OnScrollLimitCallback = (scrolledPane: ScrolledPane, scrollTop: number) => void;

export default class ScrollableContainer {
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

    this._observerTop = new IntersectionObserver((entries) => {
      const entry = entries[entries.length - 1];
      const { scrollTop } = this._scrollableParent;

      if (!entry.isIntersecting && scrollTop > 0) {
        console.log('top', scrollTop, entry);
        this._observerTop.disconnect();
        this._onScrollUpLimitCB(this._scrolledPane, scrollTop);
        this._observerTop.observe(this._scrolledPane.DOMRoot);
      }
    }, {
      root: scrollableParent,
      rootMargin: '25% 0px -101% 0px',
      // threshold: Array.from({ length: 101 }, (_, idx) => idx * 0.01),
      threshold: [0.001],
    });
    
    this._observerBottom = new IntersectionObserver((entries) => {
      const entry = entries[entries.length - 1];
      const { scrollTop, offsetHeight } = this._scrollableParent;

      if (!entry.isIntersecting && Math.round(scrollTop + offsetHeight) < this._scrollHeight && scrollTop > 0) {
        console.log('bottom', scrollTop, entry);
        this._observerBottom.disconnect();
        this._onScrollDownLimitCB(this._scrolledPane, scrollTop);
        this._observerBottom.observe(this._scrolledPane.DOMRoot);
      }
    }, {
      root: scrollableParent,
      rootMargin: '-101% 0px 25% 0px',
      // threshold: Array.from({ length: 101 }, (_, idx) => idx * 0.01),
      threshold: [0.001],
    });

    this._observerTop.observe(this._scrolledPane.DOMRoot);
    this._observerBottom.observe(this._scrolledPane.DOMRoot);
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

  setScrollDownLimit(scrollLimit: number) {
    this._scrolledPane.scrollDownLimit = scrollLimit;
  }
  
  setScrollUpLimit(scrollLimit: number) {
    this._scrolledPane.scrollUpLimit = scrollLimit;
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
