import ScrollableContainer, { type OnNewItemsCallback, type OnOverscanCallback, type OverscanHeight } from "./ScrollableContainer";
import RangeTree from "./RangeTree";
import FlexItemsMeasurer from "./FlexItemsMeasurer";
import RequestAnimationFrameLoop from "request-animation-frame-loop";
import Queue from "./Queue";
import type { ItemRangeData } from "./typings";

function fromHTMLString(html: string): HTMLElement {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.firstElementChild as HTMLElement;
}

export default class VirtualizedList {
  private _container: HTMLElement;
  private _flexItemsMeasurer: FlexItemsMeasurer;
  private _scrollableContainer: ScrollableContainer;
  private _tree: RangeTree;
  private _itemDataRegistry: Map<HTMLElement | null, ItemRangeData> = new Map();
  private _enableOnNewItemsCB: boolean = true;
  private _overscanRowCount: number = 10;

  private _onScrollOverscanCB: OnOverscanCallback = (
    scrollTop, 
    previousScrollTop, 
    scrollLimit,
    offsetTop,
    paddingTop, 
    items, 
    scrolledPaneEntry, 
    notIntersectedEntries,
  ) => {
    const scrollDelta = Math.abs(scrollTop - previousScrollTop);

    if (scrollDelta > this._container.offsetHeight) {
      console.warn('will render by offset');
    }
    else {
      console.log('will render one by one');

      let addedItemsSize = 0;
      let removedItemsSize = 0;

      const itemDataRegistry = this._itemDataRegistry;
      const scrollableContainer = this._scrollableContainer;
      const isScrollingDown = previousScrollTop < scrollTop;
      const isScrollingUp = previousScrollTop > scrollTop;

      console.log(isScrollingDown ? 'scroll down' : isScrollingUp ? 'scroll up' : 'not scrolling')

      const edgeItem = isScrollingDown 
        ? scrollableContainer.getLastItem()
        : isScrollingUp
          ? scrollableContainer.getFirstItem()
          : null;

      const edgeItemData = itemDataRegistry.get(edgeItem);

      let followingData = isScrollingDown
        ? edgeItemData?.next
        : isScrollingUp
          ? edgeItemData?.previous
          : null;

      // for (const entry of notIntersectedEntries) {
      //   removedItemsSize += entry.boundingClientRect.height;
      //   this._itemDataRegistry.delete(entry.target as HTMLElement);
      //   entry.target.remove();
      // }
      
      // const freeSpace = isScrollingDown 
      //   ? scrolledPaneEntry.rootBounds!.bottom - scrolledPaneEntry.boundingClientRect.bottom
      //   : isScrollingUp
      //     ? scrolledPaneEntry.boundingClientRect.top - scrolledPaneEntry.rootBounds!.top
      //     : 0;

      // while (addedItemsSize < freeSpace && followingData) {
      const overscanRowCount = this._overscanRowCount;
      for (let i = 0; i < overscanRowCount; i++) {
        if (isScrollingDown) {
          if (followingData) {
            const followingItem = fromHTMLString(followingData.item);
            scrollableContainer.appendItem(followingItem);
            itemDataRegistry.set(followingItem, followingData);
            followingData = followingData.next;
          }
        }

        if (isScrollingUp) {
          if (followingData) {
            const followingItem = fromHTMLString(followingData.item);
            scrollableContainer.prependItem(followingItem);
            itemDataRegistry.set(followingItem, followingData);
            followingData = followingData.previous;
          }
        }

        if (followingData) {
          addedItemsSize += followingData?.size;
        }
      }

      // scrollableContainer.scroll(
      //   offsetTop + (isScrollingUp ? 0 - removedItemsSize : removedItemsSize) - paddingTop, 
      //   addedItemsSize - removedItemsSize,
      // );
    }

  };

  private _onNewItemsCB: OnNewItemsCallback = (newEntries) => {
    if (this._enableOnNewItemsCB) {
      console.log('onNewItem')

      const itemDataRegistry = this._itemDataRegistry;
      const scrollableContainer = this._scrollableContainer;
      let scrollHeight = scrollableContainer.getScrollHeight();

      for (const entry of newEntries) {
        const { height } = entry.boundingClientRect;
        const item = entry.target as HTMLElement;
        const itemData = itemDataRegistry.get(item);
        console.log(item.textContent, height)

        if (itemData) {
          itemData.size = height;
        }

        scrollHeight += height;

        if (!entry.isIntersecting) {
          entry.target.remove();
          itemDataRegistry.delete(entry.target as HTMLElement);
        }
      }

      scrollableContainer.setScrollHeight(scrollHeight);
      this._enableOnNewItemsCB = false;
    }
  };

  constructor(container: HTMLElement, overscanHeight: OverscanHeight = '100%') {
    this._container = container;
    this._scrollableContainer = new ScrollableContainer(container);
    this._flexItemsMeasurer = new FlexItemsMeasurer(container);
    this._tree = new RangeTree();

    this._scrollableContainer.onScrollDownOverscan(this._onScrollOverscanCB);
    this._scrollableContainer.onScrollUpOverscan(this._onScrollOverscanCB);
    this._scrollableContainer.onNewItems(this._onNewItemsCB);
    this._scrollableContainer.setOverscanHeight(overscanHeight);

    this._scrollableContainer.onResize((inlineSize, blockSize) => {
      this._flexItemsMeasurer.offsetWidth = inlineSize;
      this._flexItemsMeasurer.offsetHeight = blockSize;
    });

    this._flexItemsMeasurer.setPortionSize(1000);

    this._flexItemsMeasurer.onPortionMeasured((rows) => {
      // console.log(
        rows.rows.map(row => row.map(entry => entry.target.textContent))
      // );
    });
  }
  
  insertItem(item: HTMLElement, index: number = this._tree.size, height: number | undefined = undefined): Promise<void> {
    const scrollableContainer = this._scrollableContainer;

    const itemData = this._tree.insert(index, { item: item.outerHTML, size: height || 0 })!.data!;

    this._itemDataRegistry.set(item, itemData);

    scrollableContainer.appendItem(item);
    scrollableContainer.setScrollHeight(scrollableContainer.getScrollHeight() + (height || 0));

    this._enableOnNewItemsCB = true;
    this._flexItemsMeasurer.appendItem(item);

    return this._flexItemsMeasurer.measure();
  }
}