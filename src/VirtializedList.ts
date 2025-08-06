import RangeTree from './RangeTree';
import './style.css';
import type { ItemRangeData } from './typings';

const reSpaces = /[\s]+/;

export default class VirtualizedList extends HTMLElement {
  // dependency
  static RangeTree = RangeTree;

  private _tree: RangeTree;
  private _observer: IntersectionObserver;
  private _spaceFiller: HTMLElement;
  private _itemsContainer: HTMLElement;
  private _insertionPromises: Map<HTMLElement, { resolve: (index: number | null) => void, index: number }>;
  
  private _handleEntry(entry: IntersectionObserverEntry) {
    const item = entry.target as HTMLElement;
    const { height } = entry.boundingClientRect;
    const resolver = this._insertionPromises.get(item);

    if (resolver) {
      // this._tree.insert(resolver.index, { item, size: height });
      this._tree.insert(resolver.index, { 
        item: item.outerHTML.replace(reSpaces, ' '), 
        size: height,
      });
      this._offsetHeight += height;
      
      // remove the item from the list if it is not visible
      if (!entry.isIntersecting) {
        this._spaceFiller.style.height = `${this._offsetHeight}px`;
        item.remove();
      }

      resolver.resolve(resolver.index);
      this._insertionPromises.delete(item);
    }
  };
  
  private _renderVisibleItems = () => {
    const { scrollTop } = this;
    const offsetY = scrollTop - (this._currentOffset - this._firstVisibleItemSize);
    this._itemsContainer.style.transform = `translateY(-${offsetY}px)`;
    this._itemsContainer.innerHTML = this._itemsToRender;
  }

  private _loadInsertedItems: IntersectionObserverCallback = (entries) => {
    entries.forEach(this._handleEntry.bind(this));
    this._insertionPromises.forEach(({ resolve }) => resolve(null)); // resolve with null remained after _handleEntry promises whose item was not discovered by IntersectionObserver
    this._observer.disconnect();
  }

  constructor() {
    super();

    this._tree = new VirtualizedList.RangeTree();
    this._spaceFiller = document.createElement('div');
    this._itemsContainer = document.createElement('div');
    this._insertionPromises = new Map();
    this._observer = new IntersectionObserver(
      this._loadInsertedItems, 
      { root: this },
    );
  }

  connectedCallback() {
    const stickyContainer = document.createElement('div');

    stickyContainer.classList.add('sticky-container');
    this._spaceFiller.classList.add('space-filler');
    this._itemsContainer.classList.add('visible-items');

    this._spaceFiller.appendChild(this._itemsContainer)
    stickyContainer.appendChild(this._spaceFiller);
    this.appendChild(stickyContainer);
    this.addEventListener('scroll', this._scrollHandler);
  }

  insertItem(item: HTMLElement, index: number):Promise<number | null> {
    this._itemsContainer.appendChild(item);
    this._observer.observe(item);

    return new Promise(resolve => {
      this._insertionPromises.set(item, { resolve, index });
    });
  }

  removeItem(index: number): number | null {
    const key = this._tree.at(index)?.key;

    if (key) {
      return this._tree.remove(key);
    }

    return null;
  }

  getItem(index: number): HTMLElement | undefined {
    return this._tree.at(index)?.data?.item;
  }

  getAllItems(): Array<ItemRangeData> {
    return this._tree.values();
  }

  get length(): number {
    return this._tree.size;
  }
}

customElements.define('virtualized-list', VirtualizedList);
