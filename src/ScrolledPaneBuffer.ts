import DOMConstructor from "./DOMConstructor";
import ScrolledPane from "./ScrolledPane";

export default class ScrolledPaneBuffer extends ScrolledPane {
  private _bufferElement: HTMLElement;

  constructor(scrollableParent: HTMLElement) {
    super(scrollableParent, ['class__ScrolledPaneBuffer']);
    this._bufferElement = super.DOMRoot;
    this._bufferElement.append(
      new DOMConstructor(
        this._bufferElement, 
        ['ScrolledPaneBuffer__Marker'],
      ).DOMRoot,
    );
  }
  
  get length(): number {
    return this._bufferElement.children.length - 1;
  }
}
