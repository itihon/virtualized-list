import DOMConstructor from "./DOMConstructor";
import ScrolledPane from "./ScrolledPane";

export default class ScrolledPaneBuffer extends ScrolledPane {
  private _bufferElement: HTMLElement;
  private _markerElement: HTMLElement;

  constructor(scrollableParent: HTMLElement) {
    super(scrollableParent, ['class__ScrolledPaneBuffer']);
    this._bufferElement = super.DOMRoot;
    this._markerElement = new DOMConstructor(
      this._bufferElement, ['ScrolledPaneBuffer__Marker'],
    ).DOMRoot;

    this._bufferElement.append(this._markerElement);
  }

  getMarkerElement(): HTMLElement {
    return this._markerElement;
  }
  
  get length(): number {
    return this._bufferElement.children.length - 1;
  }
}
