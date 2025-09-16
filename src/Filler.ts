import DOMConstructor from "./DOMConstructor";

export default class Filler extends DOMConstructor {
  private _fillerElement: HTMLElement;
  private _offsetHeight: number = 0;

  constructor(scrollableParent: HTMLElement, classList: string[] = []) {
    super(scrollableParent, ['class__Filler', ...classList]);
    this._fillerElement = super.DOMRoot;
  }

  set offsetHeight(height: number) {
    const roundHeight = Math.round(height)
    this._fillerElement.style.height = `${roundHeight}px`;
    this._offsetHeight = roundHeight;
  }

  get offsetHeight(): number {
    return this._offsetHeight;
  }
}
