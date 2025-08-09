import RangeTree from './RangeTree';
import './style.css';
import type { ItemRangeData, ItemsToRestore } from './typings';
import RequestAnimationFrameLoop from 'request-animation-frame-loop';
import Queue from './Queue';

const reSpaces = /[\s]+/;

type RAFLoopCtx = {
  stopDelay: number;
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

function debounce(fn: (...args: unknown[]) => void, delay: number): typeof fn {
  let timeout:NodeJS.Timeout | undefined;

  const delayedFn = (...args: unknown[]) => {
    timeout = undefined; 
    fn(...args);
  };

  return (...args) => {
    if (!timeout) fn(...args);
    clearTimeout(timeout);
    timeout = setTimeout(delayedFn, delay, ...args);
  };
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
  private _intervalsToRender: Queue<number>;
  private _previousScrollTop = 0;
  
  private _handleEntry(entry: IntersectionObserverEntry) {
    const item = entry.target as HTMLElement;
    const { height } = entry.boundingClientRect;
    const resolver = this._insertionPromises.get(item);

    if (resolver) {
      this._tree.setNodeSize(resolver.index, height);
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
    let interval;

    if (scrollTop === this._previousScrollTop) {
      ctx.stopDelay++;
      if (ctx.stopDelay > 15) {
        ctx.stopDelay = 0;
        interval = this._intervalsToRender.last();
        this._intervalsToRender.clear();
      }
      else {
        interval = this._intervalsToRender.dequeue();
      }
    }
    else {
      interval = this._intervalsToRender.dequeue();
    }

    if (interval) {
      const items = this._getItemsByOffset(interval);
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
    const scrollStep = Math.max(scrollDelta / this.offsetHeight * 8, 3);
    const intervals = splitInterval(this._previousScrollTop, scrollTop, scrollStep);

    this._previousScrollTop = scrollTop;

    const lastAddedInterval = this._intervalsToRender.last();

    for (const interval of intervals) {
      if (interval === lastAddedInterval) continue; // do not add repeated intervals to render
      
      this._intervalsToRender.enqueue(interval);
    }
    this._rAFLoop.start();
  }
  
  constructor() {
    super();

    this._tree = new VirtualizedList.RangeTree();
    this._intervalsToRender = new VirtualizedList.Queue<number>();
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
    this.addEventListener('scroll', debounce(this._scrollHandler.bind(this), 16));
  }

  insertItem(item: HTMLElement, index: number = this._tree.size):Promise<number | null> {
    this._itemsContainer.appendChild(item);
    this._observer.observe(item);
    this._tree.insert(index, { 
      item: item.outerHTML.replace(reSpaces, ' '), 
      size: 0,
    });

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
    const tempContainer = document.createElement('div');
    tempContainer.innerHTML = this._tree.at(index)?.data?.item || '';
    return tempContainer.firstChild as HTMLElement;
  }

  getAllItems(): Array<ItemRangeData> {
    return this._tree.values();
  }

  get length(): number {
    return this._tree.size;
  }
}

customElements.define('virtualized-list', VirtualizedList);
