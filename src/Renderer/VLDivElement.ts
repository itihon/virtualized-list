/**
 * @fileoverview VLDivElement.
 * @license MIT
 * @author Alexandr Kalabin
 */

type LifecycleCallback = (element: VLDivElement) => void;

export default class VLDivElement extends HTMLElement {
  private _onMountedCB: LifecycleCallback = () => {};
  private _onUnmountedCB: LifecycleCallback = () => {};

  connectedCallback() {
    this._onMountedCB(this);
  }

  disconnectedCallback() {
    this._onUnmountedCB(this)
  }

  onUnmounted(cb: LifecycleCallback) {
    this._onUnmountedCB = cb;
  }

  onMounted(cb: LifecycleCallback) {
    this._onMountedCB = cb;
  }
}

customElements.define('vl-div', VLDivElement);
