export default class DOMConstructor {
  private _parentContainer: HTMLElement;
  private _DOMRoot: HTMLElement;

  constructor(parentContainer: HTMLElement, classList: string[]) {
    this._parentContainer = parentContainer;    
    this._DOMRoot = document.createElement('div');
    this._DOMRoot.classList.add(...classList);
    this._parentContainer.appendChild(this._DOMRoot);
  }

  get DOMRoot(): HTMLElement {
    return this._DOMRoot;
  }
}
