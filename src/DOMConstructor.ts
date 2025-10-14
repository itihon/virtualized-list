type LifecycleCallback = (element: DOMDivElement) => void;

export class DOMDivElement extends HTMLDivElement {
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

customElements.define('domconstructor-div', DOMDivElement, { extends: 'div' });

export default class DOMConstructor {
  private _parentContainer: HTMLElement;
  private _DOMRoot: DOMDivElement;

  constructor(parentContainer: HTMLElement, classList: string[]) {
    this._parentContainer = parentContainer;    
    this._DOMRoot = new DOMDivElement();
    this._DOMRoot.classList.add(...classList);
    requestAnimationFrame(() => {
      this._parentContainer.appendChild(this._DOMRoot);
    });
  }

  get DOMRoot(): DOMDivElement {
    return this._DOMRoot;
  }

  get parentContainer(): HTMLElement {
    return this._parentContainer;
  }
}
