import RangeTree from './RangeTree';
import './style.css';
import type { ItemRangeData, ItemsToRestore } from './typings';
import RequestAnimationFrameLoop from 'request-animation-frame-loop';
import Queue from './Queue';
import { debounce, splitInterval, throttle } from './utils';

const reSpaces = /[\s]+/;

const INERTIA = 5;
const MIN_SCROLL_STEP = 2;
const SCROLL_MULTIPLIER = 8;

type RAFLoopCtx = {
  stopDelay: number;
}

export default class VirtualizedList extends HTMLElement {
  // dependencies
  static RangeTree = RangeTree;
  static RequestAnimationFrameLoop = RequestAnimationFrameLoop;
  static Queue = Queue;

  private static readonly _SCROLL_DIRECTION_UP = Symbol('up');
  private static readonly _SCROLL_DIRECTION_DOWN = Symbol('down');

  private _scrolling: symbol | null = null;
  private _tree: RangeTree;
  private _observer: IntersectionObserver;
  private _spaceFiller: HTMLElement;
  private _itemsContainer: HTMLElement;
  private _insertionPromises: Map<HTMLElement, { resolve: (index: number | null) => void, index: number }>;
  private _offsetHeight = 0;
  private _rAFLoop: RequestAnimationFrameLoop;
  private _intervalsToRender: Queue<number>;
  private _previousScrollTop = 0;
  private _itemsToRestore: ItemsToRestore;
  private _itemsContainerOffsetY = 0;

  private _setScrollingState(interval: number | undefined, previousInterval: number) {
    if (interval !== undefined) {
      if (interval > previousInterval) { 
        this._scrolling = VirtualizedList._SCROLL_DIRECTION_DOWN;
      }
      else if (interval < previousInterval) {
        this._scrolling = VirtualizedList._SCROLL_DIRECTION_UP;
      }
    }
    else {
      this._scrolling = null;
    }
  }

  private _isScrolling(): boolean {
    return this._scrolling !== null;
  }

  private _isScrollingDown(): boolean {
    return this._scrolling === VirtualizedList._SCROLL_DIRECTION_DOWN;
  }
  
  private _isScrollingUp(): boolean {
    return this._scrolling === VirtualizedList._SCROLL_DIRECTION_UP;
  }

  private _observeItemsVisiblity() {
    for (const child of this._itemsContainer.children) {
      this._observer.observe(child);
    }
  }
  
  private _handleEntry(entry: IntersectionObserverEntry) {
    const item = entry.target as HTMLElement;
    const { height } = entry.boundingClientRect;
    const resolver = this._insertionPromises.get(item);

    if (resolver) {
      this._tree.setNodeSize(resolver.index, height);
      this._offsetHeight += height;
      this._spaceFiller.style.height = `${this._offsetHeight}px`;
      
      resolver.resolve(resolver.index);
      this._insertionPromises.delete(item);
    }

    // remove the item from the list if it is not visible
    if (!entry.isIntersecting) {
      item.remove();
    }
  };

  private _removeScrolledOutItem(entry: IntersectionObserverEntry) {
    const item = entry.target as HTMLElement;
    const { height } = entry.boundingClientRect;

    if (!entry.isIntersecting) {
      if (this._isScrollingDown()) {
        this._itemsContainerOffsetY -= height;
        this._itemsContainer.style.transform = `translateY(-${this._itemsContainerOffsetY}px)`;
      }
      item.remove();
    }
  }
  
  private _renderVisibleItems = (ctx: RAFLoopCtx, loop: RequestAnimationFrameLoop) => {
    const { scrollTop } = this;
    const previousInterval = this._previousScrollTop;
    let interval;

    if (scrollTop === this._previousScrollTop) {
      ctx.stopDelay++;
      if (ctx.stopDelay > INERTIA) {
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

    this._setScrollingState(interval, previousInterval);

    if (interval !== undefined) {
      const segmentHeight = Math.abs(interval - previousInterval);

      if (false /*segmentHeight < this.offsetHeight*/) {
        console.log('render one by one', interval, previousInterval, scrollTop);
        
        if (this._isScrollingDown()) {
          const items = this._getItemsByOffset(interval + (segmentHeight + this._itemsContainer.offsetHeight), segmentHeight);
          const { 
            firstVisibleItemOffset, 
            firstVisibleItemsSize, 
            itemsHTML,
            offset,
            changed,
          } = items;
          this._itemsContainerOffsetY = offset - (firstVisibleItemOffset - firstVisibleItemsSize);
          this._itemsContainer.style.transform = `translateY(-${this._itemsContainerOffsetY}px)`;
          if (changed) {
            this._itemsContainer.insertAdjacentHTML('beforeend', itemsHTML);
            this._observeItemsVisiblity();
          }
          console.log(items.itemsHTML, interval, this.scrollTop)
        }
        else if (this._isScrollingUp()) {
          const items = this._getItemsByOffset(interval - (this._itemsContainer.offsetHeight - this.offsetHeight) - this._itemsToRestore.firstVisibleItemsSize, segmentHeight);
          console.log(items.itemsHTML, interval)
        }
      }
      else {
        console.log('render by offset');
        const items = this._getItemsByOffset(interval);
        console.log(items.itemsHTML, interval)
        const { 
          firstVisibleItemOffset, 
          firstVisibleItemsSize, 
          itemsHTML,
          offset,
          changed,
        } = items;
        this._itemsContainerOffsetY = offset - (firstVisibleItemOffset - firstVisibleItemsSize);
        this._itemsContainer.style.transform = `translateY(-${this._itemsContainerOffsetY}px)`;
        if (changed) {
          this._itemsContainer.innerHTML = itemsHTML;
          // this._observeItemsVisiblity();
        }
      }

      this._previousScrollTop = interval;
    }
    else {
      loop.stop();
    }
  }

  private _loadInsertedItems: IntersectionObserverCallback = (entries) => {
    if (!this._isScrolling()) {
      for (const entry of entries) {
        this._handleEntry(entry);
      }
      this._insertionPromises.forEach(({ resolve }) => resolve(null)); // resolve with null remained after _handleEntry promises whose item was not discovered by IntersectionObserver
    }
    else {
      for (const entry of entries) {
        this._removeScrolledOutItem(entry);
      }
    }
    this._observer.disconnect();
  }

  private _getItemsByOffset(offset: number, containerHeight = this.offsetHeight): ItemsToRestore {
    const itemsToRestore = this._itemsToRestore;

    // previously returned item falls in the current range, needless to find it and all subsequent items again
    if (
      itemsToRestore.firstVisibleItemOffset < offset && 
      offset < itemsToRestore.secondVisibleItemOffset
    ) {
      itemsToRestore.changed = false;
      return itemsToRestore;
    }

    const data = this._tree.findByOffset(offset)?.data;
    const firstVisibleItemsSize = data?.size || 0;
    const firstVisibleItemOffset = data?.currentOffset || 0;
    const secondVisibleItemOffset = firstVisibleItemOffset + (data?.next?.size || 0);
    const firstItem = data!.item;

    let nextData: ItemRangeData | null | undefined = data;
    let itemsHTML = '';
    let itemsHeight = 0;

    itemsHTML += firstItem;

    while (nextData && itemsHeight <= containerHeight + nextData.size) {
      nextData = nextData.next;

      if (nextData) {
        const nextItem = nextData.item;

        itemsHTML += nextItem;
        itemsHeight += nextData.size || 0;
      }
    }

    // keep one object between calls and mutate it to avoid creating each time new one in order to save some execution time
    itemsToRestore.itemsHTML = itemsHTML;
    itemsToRestore.firstVisibleItemsSize = firstVisibleItemsSize;
    itemsToRestore.firstVisibleItemOffset = firstVisibleItemOffset;
    itemsToRestore.secondVisibleItemOffset = secondVisibleItemOffset;
    itemsToRestore.offset = offset;
    itemsToRestore.changed = true;

    return itemsToRestore;
  }

  private _scrollHandler() {
    const { scrollTop, offsetHeight, _intervalsToRender } = this;
    const firstInterval = _intervalsToRender.first();
    const previousInterval = (firstInterval || this._previousScrollTop);
    const scrollDelta = Math.abs(scrollTop - previousInterval);
    const scrollStep = Math.max(Math.min(scrollDelta / offsetHeight * SCROLL_MULTIPLIER, INERTIA), MIN_SCROLL_STEP);
    const intervals = splitInterval(previousInterval, scrollTop, scrollStep);

    _intervalsToRender.clear();

    for (const interval of intervals) {
      _intervalsToRender.enqueue(interval);
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
    this._itemsToRestore = {
      itemsHTML: '',
      offset: 0,
      firstVisibleItemOffset: 0,
      firstVisibleItemsSize: 0,
      secondVisibleItemOffset: 0,
      changed: false,
    };
  }

  connectedCallback() {
    const stickyContainer = document.createElement('div');

    stickyContainer.classList.add('sticky-container');
    this._spaceFiller.classList.add('space-filler');
    this._itemsContainer.classList.add('visible-items');

    this._spaceFiller.appendChild(this._itemsContainer)
    stickyContainer.appendChild(this._spaceFiller);
    this.appendChild(stickyContainer);
    // this.addEventListener('scroll', throttle(this._scrollHandler.bind(this), 520));
    this.addEventListener('scroll', this._scrollHandler.bind(this));
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
