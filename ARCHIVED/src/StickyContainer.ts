import DOMConstructor from "./DOMConstructor";

export default class StickyContainer extends DOMConstructor {
  private _containerElement: HTMLElement;

  constructor(scrollableParent: HTMLElement, classList: string[] = []) {
    super(scrollableParent, ['class__StickyContainer', ...classList]);
    this._containerElement = super.DOMRoot;
  }

  setScrollLimit(limit: number) {
    const roundLimit = Math.round(limit);
    this._containerElement.style.setProperty('--scroll-limit', `${roundLimit}px`);
  }
}
