import RangeTree from './RangeTree';
import './style.css';
import type { ItemRangeData } from './typings';

const reSpaces = /[\s]+/;

type RAFLoopCtx = {
  stopDelay: number;
}

type Node<T> = {
  value: T;
  next: Node<T> | undefined;
}

class Queue<T> {
  private _head: Node<T> | undefined;
  private _tail: Node<T> | undefined;

  enqueue(data:T) {
    if (!this._head) {
      this._head = { value: data, next: undefined };
      this._tail = this._head;
    }
    else {
      const node = { value: data, next: undefined };
      if (this._tail) {
        this._tail.next = node;
        this._tail = node;
      }
    }
  }

  dequeue():T | undefined {
    if (this._head) {
      const node = this._head;
      this._head = node.next;
      return node.value;
    }
  }

  last():T | undefined {
    return this._tail?.value;
  }

  clear() {
    this._head = undefined;
    this._tail = undefined;
  }
}

function splitInterval(interval_1: number, interval_2: number, count: number): number[] {
  const result: number[] = [];

  if (count <= 0) return [interval_1]; // Nothing to split
  if (interval_1 === interval_2) return [interval_1]; // Nothing to split

  const step = (interval_2 - interval_1) / count;

  for (let i = 0; i <= count; i++) {
    result.push(interval_1 + i * step);
  }

  return result;
}

export default class VirtualizedList extends HTMLElement {
  // dependency
  static RangeTree = RangeTree;

  private _tree: RangeTree;
  private _observer: IntersectionObserver;
  private _spaceFiller: HTMLElement;
  private _itemsContainer: HTMLElement;
  private _insertionPromises: Map<HTMLElement, { resolve: (index: number | null) => void, index: number }>;
  private _offsetHeight = 0;
  private _rAF = 0;
  private _itemsToRender = '';
  private _currentOffset = 0;
  private _firstVisibleItemSize = 0;
  
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

  private _scrollHandler() {
    const { scrollTop } = this;
    const data = this._tree.findByOffset(scrollTop)?.data;
    // const followingItems: Array<HTMLElement> = [];
    let followingItems = '';
    const firstItem = data?.item;

    // if (firstItem) followingItems.push(firstItem);
    let itemsHeight = 0;
    if (firstItem) {
      followingItems += firstItem;
      // itemsHeight += data.size;
    }
    const containerHeight = this.offsetHeight;
    let nextData: ItemRangeData | null | undefined = data;
    while (itemsHeight <= containerHeight && nextData) {
      nextData = nextData?.next;
      const nextItem = nextData?.item;
      // if (nextItem) followingItems.push(nextItem);
      if (nextItem) {
        followingItems += nextItem;
        itemsHeight += nextData?.size || 0;
      }
    }

    // render one extra element
    nextData = nextData?.next;
    const nextItem = nextData?.item;
    // if (nextItem) followingItems.push(nextItem);
    if (nextItem) {
      followingItems += nextItem;
      itemsHeight += nextData?.size || 0;
    }

    cancelAnimationFrame(this._rAF);
    this._itemsToRender = followingItems;
    this._firstVisibleItemSize = data?.size || 0;
    this._currentOffset = data?.currentOffset || 0;
    this._rAF = requestAnimationFrame(this._renderVisibleItems);
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
