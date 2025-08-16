import './ScrollableContainer.css';

export type OnScrollLimitCallback = (scrolledPane: ScrolledPane, scrollTop: number) => void;

class BooleanToggle {
  private _value = false;

  constructor(initialValue: boolean = false) {
    this._value = initialValue;
  }

  /**
   * - value: false -> true, rising: true => true;
   * - value: true -> false, rising: false => true;
   * - otherwise returns false;
   */
  set(value: boolean, rising: boolean = false): boolean {
    let result;

    if (rising) {
      if (!this._value && value) {
        result = true;
      }
      else {
        result = false;
      }
    }
    else {
      if (this._value && !value) {
        result = true;
      }
      else {
        result = false;
      }
    }

    this._value = value;

    return result;
  }
}

class Filler {
  private _scrollableParent: HTMLElement;
  private _fillerElement: HTMLElement;
  private _offsetHeight: number = 0;

  constructor(scrollableParent: HTMLElement) {
    this._scrollableParent = scrollableParent;    
    this._fillerElement = document.createElement('div');
    this._fillerElement.classList.add('class__Filler');
    this._scrollableParent.appendChild(this._fillerElement);
  }

  set offsetHeight(height: number) {
    const roundHeight = Math.round(height)
    this._fillerElement.style.height = `${roundHeight}px`;
    this._offsetHeight = roundHeight;
  }

  get offsetHeight(): number {
    return this._offsetHeight;
  }
  
  get offsetTop(): number {
    return this._fillerElement.offsetTop;
  }
}

class ScrolledPane {
  private _scrollableParent: HTMLElement;
  private _paneElement: HTMLElement;
  private _scrollDownLimit = 0;
  private _scrollUpLimit = 0;

  constructor(scrollableParent: HTMLElement) {
    this._scrollableParent = scrollableParent;    
    this._paneElement = document.createElement('div');
    this._paneElement.classList.add('class__ScrolledPane');
    this._scrollableParent.appendChild(this._paneElement);
  }
  
  get offsetHeight(): number {
    return this._paneElement.offsetHeight;
  }
  
  get offsetTop(): number {
    return this._paneElement.offsetTop;
  }

  set scrollDownLimit(limit: number) {
    const roundLimit = Math.round(limit);
    this._paneElement.style.setProperty('--scroll-down-limit', `${roundLimit}px`);
    this._scrollDownLimit = roundLimit;
  }
  
  set scrollUpLimit(limit: number) {
    const roundLimit = Math.round(limit);
    this._paneElement.style.setProperty('--scroll-up-limit', `${roundLimit}px`);
    this._scrollUpLimit = roundLimit;
  }

  get scrollDownLimit(): number {
    return this._scrollDownLimit;
  }
  
  get scrollUpLimit(): number {
    return this._scrollUpLimit;
  }
}

export default class ScrollableContainer {
  private _scrollableParent: HTMLElement;
  private _fillerTop: Filler;
  private _fillerBottom: Filler;
  private _scrolledPane: ScrolledPane;
  private _onScrollDownLimitCB: OnScrollLimitCallback = () => {};
  private _onScrollUpLimitCB: OnScrollLimitCallback = () => {};
  private _resizeObserver: ResizeObserver;
  private _scrollHeight: number = 0;
  private _isScrollDownLimit: BooleanToggle;
  private _isScrollUpLimit: BooleanToggle;

  constructor(scrollableParent: HTMLElement) {
    this._scrollableParent = scrollableParent;    
    this._fillerTop = new Filler(scrollableParent);
    this._scrolledPane = new ScrolledPane(scrollableParent);
    this._fillerBottom = new Filler(scrollableParent);
    this._isScrollDownLimit = new BooleanToggle();
    this._isScrollUpLimit = new BooleanToggle();

    this._scrollableParent.classList.add('class__ScrollableContainer');

    this._resizeObserver = new ResizeObserver(
      // () => this.setScrollHeight(this._scrollHeight),
      () => { 
        console.log('resize observer'); 
        this.setScrollHeight(this._scrollHeight); 
      },
    );

    this._resizeObserver.observe(this._scrollableParent);

    this._scrollableParent.addEventListener('scroll', () => {
      const { scrollTop } = this._scrollableParent;
      const { offsetTop: scrolledPaneTop, offsetHeight: scrolledPaneHeight } = this._scrolledPane;

      if (scrollTop === 0) {
        console.log('scrollTop');
        return;
      }

      if (
        this._isScrollDownLimit.set(
          scrolledPaneTop + scrolledPaneHeight <= scrollTop + this._scrollableParent.offsetHeight,
          true,
        )
      ) {
        this._onScrollDownLimitCB(this._scrolledPane, scrollTop);
        console.log('scrollDownLimit');
        return;
      }

      if (
        this._isScrollUpLimit.set(
          scrolledPaneTop >= scrollTop,
          true,
        )
      ) {
        this._onScrollUpLimitCB(this._scrolledPane, scrollTop);
        console.log('scrollUpLimit');
        return;
      }

      if (Math.round(scrollTop) === this._scrollHeight) {
        console.log('scrollBottom');
        return;
      }
    });
  }

  onScrollDownLimit(cb: OnScrollLimitCallback) {
    this._onScrollDownLimitCB = cb;
  }
  
  onScrollUpLimit(cb: OnScrollLimitCallback) {
    this._onScrollUpLimitCB = cb;
  }

  prepend() {

  }

  append(item: HTMLElement) {
    // this._scrolledPane.appendChild(item);
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
