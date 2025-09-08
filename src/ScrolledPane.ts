import DOMConstructor from "./DOMConstructor";

export default class ScrolledPane extends DOMConstructor {
  private _paneElement: HTMLElement;
  private _offsetHeight: number = 0;
  private _scrollHeight: number = 0;

  constructor(scrollableParent: HTMLElement, classList: string[] = []) {
    super(scrollableParent, ['class__ScrolledPane', ...classList]);
    this._paneElement = super.DOMRoot;
  }

  preserveOffsetHeight(): number {
    return this._offsetHeight = this._paneElement.offsetHeight;
  }
  
  get offsetHeight(): number {
    return this._offsetHeight;
  }

  preserveScrollHeight(): number {
    return this._scrollHeight = this._paneElement.scrollHeight;
  }
  
  get scrollHeight(): number {
    return this._scrollHeight;
  }

  setScrollLimit(limit: number) {
    const roundLimit = Math.round(limit);
    this._paneElement.style.setProperty('--scroll-limit', `${roundLimit}px`);
  }

  append(...items: Node[]) {
    this._paneElement.append(...items);
  }
  
  prepend(...items: Node[]) {
    this._paneElement.prepend(...items);
  }

  removeItem(itemIndex: number): boolean {
    const item = this._paneElement.children.item(itemIndex);

    if (item) {
      item.remove();
      return true;
    }

    return false;
  }

  get length(): number {
    return this._paneElement.children.length;
  }
}