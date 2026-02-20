type LifecycleCallback = (element: VLDivElement) => void;

export class VLDivElement extends HTMLElement {
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

export default class DOMConstructor {
  private _parentContainer: HTMLElement;
  private _DOMRoot: VLDivElement;

  constructor(parentContainer: HTMLElement, classList: string[]) {
    this._parentContainer = parentContainer;    
    // this._DOMRoot = new DOMDivElement();
    this._DOMRoot = document.createElement('vl-div') as VLDivElement;
    this._DOMRoot.classList.add(...classList);
    requestAnimationFrame(() => {
      this._parentContainer.appendChild(this._DOMRoot);
    });
  }

  get DOMRoot(): VLDivElement {
    return this._DOMRoot;
  }

  get parentContainer(): HTMLElement {
    return this._parentContainer;
  }
}
