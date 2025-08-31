export default class Filler {
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
