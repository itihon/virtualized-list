import RangeTree from './RangeTree';
import './style.css';
import type { ItemRangeData, ItemsToRestore } from './typings';
import RequestAnimationFrameLoop from 'request-animation-frame-loop';

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
  // dependencies
  static RangeTree = RangeTree;
  static RequestAnimationFrameLoop = RequestAnimationFrameLoop;
  static Queue = Queue;

  private _tree: RangeTree;
  private _observer: IntersectionObserver;
  private _spaceFiller: HTMLElement;
  private _itemsContainer: HTMLElement;
  private _insertionPromises: Map<HTMLElement, { resolve: (index: number | null) => void, index: number }>;
  private _offsetHeight = 0;
  private _rAFLoop: RequestAnimationFrameLoop;
  private _itemsToRender: Queue<ItemsToRestore>;
  private _previousScrollTop = 0;
  
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
  
  private _renderVisibleItems = (ctx: RAFLoopCtx, loop: RequestAnimationFrameLoop) => {
    const { scrollTop } = this;
    let items;

    if (scrollTop === this._previousScrollTop) {
      ctx.stopDelay++;
      if (ctx.stopDelay > 20) {
        ctx.stopDelay = 0;
        items = this._itemsToRender.last();
        this._itemsToRender.clear();
      }
      else {
        items = this._itemsToRender.dequeue();
      }
    }
    else {
      items = this._itemsToRender.dequeue();
    }

    if (items) {
      const { 
        firstVisibleItemOffset, 
        firstVisibleItemsSize, 
        itemsHTML,
        offset,
      } = items;
      const offsetY = offset - (firstVisibleItemOffset - firstVisibleItemsSize);
      this._itemsContainer.style.transform = `translateY(-${offsetY}px)`;
      this._itemsContainer.innerHTML = itemsHTML;
    }
    else {
      loop.stop();
    }
  }

  private _loadInsertedItems: IntersectionObserverCallback = (entries) => {
    entries.forEach(this._handleEntry.bind(this));
    this._insertionPromises.forEach(({ resolve }) => resolve(null)); // resolve with null remained after _handleEntry promises whose item was not discovered by IntersectionObserver
    this._observer.disconnect();
  }

  private _getItemsByOffset(offset: number): ItemsToRestore {
    const data = this._tree.findByOffset(offset)?.data;
    let itemsHTML = '';
    const firstItem = data?.item;

    let itemsHeight = 0;
    if (firstItem) {
      itemsHTML += firstItem;
    }
    const containerHeight = this.offsetHeight;
    let nextData: ItemRangeData | null | undefined = data;
    while (itemsHeight <= containerHeight && nextData) {
      nextData = nextData?.next;
      const nextItem = nextData?.item;
      if (nextItem) {
        itemsHTML += nextItem;
        itemsHeight += nextData?.size || 0;
      }
    }

    // render one extra element
    nextData = nextData?.next;
    const nextItem = nextData?.item;
    if (nextItem) {
      itemsHTML += nextItem;
      itemsHeight += nextData?.size || 0;
    }
   
    return { 
      itemsHTML, 
      firstVisibleItemsSize: data?.size || 0,
      firstVisibleItemOffset: data?.currentOffset || 0,
      offset,
    };
  }

  private _scrollHandler() {
    const { scrollTop } = this;
    const scrollDelta = Math.abs(scrollTop - this._previousScrollTop);
    const scrollStep = scrollDelta / 64;
    const intervals = splitInterval(this._previousScrollTop, scrollTop, scrollStep);

    this._previousScrollTop = scrollTop;

    intervals.forEach((interval) => {
      // if (interval === this._previousScrollTop) return; // previous scrollTop
      this._itemsToRender.enqueue(this._getItemsByOffset(interval));
    });
    this._rAFLoop.start();
  }
  
  constructor() {
    super();

    this._tree = new VirtualizedList.RangeTree();
    this._itemsToRender = new VirtualizedList.Queue<ItemsToRestore>();
    this._rAFLoop = new VirtualizedList.RequestAnimationFrameLoop({ stopDelay: 0 });
    this._rAFLoop.each(this._renderVisibleItems);
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
