import DOMConstructor, { DOMDivElement } from "./DOMConstructor";
import ScrolledPane from "./ScrolledPane";

export default class ScrolledPaneBuffer extends ScrolledPane {
  private _bufferElement: HTMLElement;
  private _markerElement: DOMDivElement;

  private _preventMarkerUnmount = (markerElement: DOMDivElement) => {
    const bufferElement = this._bufferElement;

    if (markerElement.parentElement !== bufferElement) {
      console.warn('An attempt to unmount marker element was prevented.');
      bufferElement.prepend(markerElement); // ensure that marker is always at the top
    }
  };

  constructor(scrollableParent: HTMLElement) {
    super(scrollableParent, ['class__ScrolledPaneBuffer']);
    this._bufferElement = super.DOMRoot;
    this._markerElement = new DOMConstructor(
      this._bufferElement, ['ScrolledPaneBuffer__Marker'],
    ).DOMRoot;

    this._bufferElement.append(this._markerElement);
    this._markerElement.onMounted(this._preventMarkerUnmount);
  }

  clear() {
    const bufferElement = this._bufferElement;
    const bufferContent = bufferElement.children;

    while (bufferContent.length > 1) { // first child is marker
      bufferElement.lastElementChild!.remove();
    }
  }

  getMarkerElement(): HTMLElement {
    return this._markerElement;
  }
  
  get length(): number {
    return this._bufferElement.children.length - 1;
  }
}
