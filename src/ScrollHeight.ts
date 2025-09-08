import DOMConstructor from "./DOMConstructor";

export default class ScrollHeight extends DOMConstructor {
  private _scrollHeightElement: HTMLElement;

  constructor(scrollableParent: HTMLElement) {
    super(scrollableParent, ['class__ScrollHeight']);
    this._scrollHeightElement = super.DOMRoot;
  }

  setScrollHeight(value: number) {
    this._scrollHeightElement.style.height = `${value}px`;
  }
}
