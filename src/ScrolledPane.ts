export default class ScrolledPane {
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