export default class ScrollHeight {
  private _scrollableParent: HTMLElement;
  private _scrollHeightElement: HTMLElement;

  constructor(scrollableParent: HTMLElement) {
    this._scrollableParent = scrollableParent;    
    this._scrollHeightElement = document.createElement('div');
    this._scrollHeightElement.classList.add('class__ScrollHeight');
    this._scrollableParent.appendChild(this._scrollHeightElement);
  }

  setScrollHeight(value: number) {
    this._scrollHeightElement.style.height = `${value}px`;
  }
}
