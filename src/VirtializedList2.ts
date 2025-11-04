import ScrollableContainer, { type OnOverscanCallback, type OnScrollLimitCallback, type OverscanHeight } from "./ScrollableContainer";
import OffsetTree, { type OffsetTreeNodeData } from "./OffsetTree";
import FlexItemsMeasurer from "./FlexItemsMeasurer";
import { createItemsHeightReducer } from "./reducers";
import type ScrolledPane from "./ScrolledPane";

export interface ListItem<DataType> {
  data: DataType,
  toHTMLElement: (data: DataType) => HTMLElement,
  fromHTMLElement: (element: HTMLElement) => DataType,
}

function isRangeIntersecting(top1: number, bottom1: number, top2: number, bottom2: number): boolean {
  return (top1 < bottom1) && (top2 < bottom2) && !(bottom1 < top2 || bottom2 < top1);
}

export default class VirtualizedList {
  private _flexItemsMeasurer: FlexItemsMeasurer;
  private _scrollableContainer: ScrollableContainer;
  private _tree: OffsetTree;
  private _itemDataRegistry: Map<HTMLElement | null, OffsetTreeNodeData<ListItem<unknown>>> = new Map();
  private _overscanRowCount: number = 10;
  private _fastScrollShift: number = 1;
  private _portionToBeMeasured: Map<HTMLElement, ListItem<unknown>> = new Map();
  private _flexRowHeightReducer = createItemsHeightReducer();
  private _flexRowHeightAcc = this._flexRowHeightReducer.getAccumulator();

  private _onScrollLimitCB: OnScrollLimitCallback = (
    scrolledPane,
    scrollTop, 
  ) => {
    console.log('on scroll limit');
    console.warn('will render by offset');

    const scrollableContainer = this._scrollableContainer;
    const isScrollingDown = scrollableContainer.isScrollingDown();
    const scrolledPaneHeight = scrolledPane.getBorderBoxHeight();
    const firstItemInRange = this._tree.findByOffset<ListItem<unknown>>(scrollTop);
    const minRowCount = 1;
    const includeFirst = true;

    if (firstItemInRange) {
      scrollableContainer.scheduleClear();
      this._itemDataRegistry.clear();

      const overscanHeight = scrollableContainer.getOverscanHeight();

      const renderedHeight = this._renderFromData(
        scrollableContainer, 
        firstItemInRange.data, 
        'next', 
        scrolledPaneHeight + overscanHeight,
        minRowCount,
        includeFirst,
      ); 

      const firstItemHeight = firstItemInRange.data.height;
      const overscanOffset = isScrollingDown ? firstItemHeight : overscanHeight;

      scrollableContainer.scheduleScrolledPaneAdjustment(
        scrollTop - overscanOffset,
        renderedHeight,
        renderedHeight - scrolledPaneHeight * 2,
      );

      const sign = isScrollingDown ? -1 : 1;
      const scrolledPaneShift = firstItemInRange.data.offset - scrollTop;

      scrolledPane.scheduleShiftY(scrolledPaneShift * sign * this._fastScrollShift);
    }

  };

  private _onScrollOverscanCB: OnOverscanCallback = (
    scrolledPane,
  ) => {
    console.log('on overscan')
    console.log('will render one by one');

    const itemDataRegistry = this._itemDataRegistry;
    const scrollableContainer = this._scrollableContainer;
    const isScrollingDown = scrollableContainer.isScrollingDown();
    const isScrollingUp = scrollableContainer.isScrollingUp();
    const minOverscanRowCount = this._overscanRowCount;
    const includeFirst = false;

    const edgeItem = isScrollingDown 
      ? scrolledPane.getLastItem() || scrollableContainer.getLastItem()
      : isScrollingUp
        ? scrolledPane.getFirstItem() || scrollableContainer.getFirstItem()
        : null;

    const edgeItemData = itemDataRegistry.get(edgeItem);
    const renderDirection = isScrollingDown ? 'next' : isScrollingUp ? 'previous' : '';

    if (!edgeItemData || !renderDirection) return;

    const renderedHeight = this._renderFromData(
      scrolledPane, 
      edgeItemData,
      renderDirection,
      scrollableContainer.getOverscanHeight(),
      minOverscanRowCount,
      includeFirst,
    );

    scrollableContainer.setInsertionAdjustment(renderedHeight);
    scrolledPane.scheduleShiftY(0);
  };

  /**
    Case 1:           Case 2:              Case 3: 
    ───────           ───────              ───────
    ↓ ┌──┐            ┬ ┌──┐               ┬ ┌──┐
    ┬ └──┘            │ └──┘               │ └──┘
    │ ┌──┐            │ ┌──┐               │ ┌──┐
    │ └──┘            │ └──┘               │ └──┘
    │ ┌──┐            │ ┌──┐               │ ┌──┐
    │ └──┘            │ └──┘               │ └──┘
    │ ┌──┐            │ ┌──┐               │ ┌──┐
    │ └──┘            │ └──┘               │ └──┘
    │ ┌──┐            ┴ ┌──┐               │ ┌──┐
    ┴ └──┘            ↑ └──┘               ┴ └──┘

    Rendered height calculation:
      Case 1: next, exclude the first row
      Case 2: previous, exclude the first row
      Case 3: include the first row
 */
  private _renderFromData(
    where: ScrolledPane | ScrollableContainer, 
    fromData: OffsetTreeNodeData<ListItem<unknown>>, 
    direction: 'next' | 'previous',
    stretch: number, 
    minItemsCount = this._overscanRowCount,
    includeFirst = false,
  ): number {
    const itemDataRegistry = this._itemDataRegistry;
    const isNext = direction === 'next';
    const isPrevious = direction === 'previous';

    let itemData = includeFirst ? fromData : fromData[direction]; 
    let offsetStart = 0;

    if (isNext) {
      if (includeFirst) {
        offsetStart = fromData.offset;
      } else{
        offsetStart = fromData.offset + fromData.height;
      }
    }
    else if (isPrevious) {
      if (includeFirst) {
        offsetStart = fromData.offset + fromData.height;
      } else{
        offsetStart = fromData.offset;
      }
    }

    let renderedHeight = 0;
    let renderedItemsCount = 0;

    while(itemData && (renderedHeight < stretch || renderedItemsCount < minItemsCount)) {
      const { items } = itemData;
      const { length } = items;

      for (let i = 0; i < length; i++) {
        const item = items[i];
        const element = item.toHTMLElement(item.data);

        if (isNext) {
          where.scheduleAppendItem(element);
        }
        else if (isPrevious) {
          where.schedulePrependItem(element);
        }

        itemDataRegistry.set(element, itemData)
      }

      renderedHeight = Math.abs(offsetStart - (itemData.offset + (isNext ? itemData.height : 0)));

      itemData = itemData[direction];

      renderedItemsCount++;
    }

    return renderedHeight;
  }

  private _renderRange(from: number, to: number) {
    const firstItemInRange = this._tree.findByOffset<ListItem<unknown>>(from);
    const minRowCount = this._overscanRowCount;
    const includeFirst = true;

    if (firstItemInRange) {
      this._scrollableContainer.clear();
      this._itemDataRegistry.clear();

      this._renderFromData(
        this._scrollableContainer, 
        firstItemInRange.data, 
        'next', 
        to - from,
        minRowCount,
        includeFirst,
      ); 
    }
  }

  constructor(container: HTMLElement, overscanHeight: OverscanHeight = '100%') {
    this._scrollableContainer = new ScrollableContainer(container);
    this._flexItemsMeasurer = new FlexItemsMeasurer(container);
    this._tree = new OffsetTree();

    // this._scrollableContainer.onScrollDownEmptyBuffer(this._onScrollOverscanCB);
    // this._scrollableContainer.onScrollUpEmptyBuffer(this._onScrollOverscanCB);
    // this._scrollableContainer.onScrollDownReadBuffer(this._onScrollOverscanCB);
    // this._scrollableContainer.onScrollUpReadBuffer(this._onScrollOverscanCB);
    this._scrollableContainer.onScrollDownScrollLimit(this._onScrollLimitCB);
    this._scrollableContainer.onScrollUpScrollLimit(this._onScrollLimitCB);
    this._scrollableContainer.onScrollDownOverscan(this._onScrollOverscanCB);
    this._scrollableContainer.onScrollUpOverscan(this._onScrollOverscanCB);
    this._scrollableContainer.setOverscanHeight(overscanHeight);

    this._scrollableContainer.onResize((inlineSize, blockSize) => {
      this._flexItemsMeasurer.offsetWidth = inlineSize;
      this._flexItemsMeasurer.offsetHeight = blockSize;
    });

    this._flexItemsMeasurer.setPortionSize(400);

    this._flexItemsMeasurer.onPortionMeasured((flexRows, fromRowNumber, _, rowsOffset) => {
      const flexRowHeightReducer = this._flexRowHeightReducer;
      const flexRowHeightAcc = this._flexRowHeightAcc;
      const rows = flexRows.rows;
      const rowsTotal = rows.length;
      const markerHeight = this._flexItemsMeasurer.getMarkerElement().offsetHeight;

      for (let rowNumber = 0; rowNumber < rowsTotal; rowNumber++) {

        const row = rows[rowNumber];
        const itemsTotal = row.length;
        const rowData = [];

        flexRowHeightReducer.init();

        for (let itemNumber = 0; itemNumber < itemsTotal; itemNumber++) {
          const entry = row[itemNumber];
          const htmlElement = entry.target as HTMLElement;
          const listItem = this._portionToBeMeasured.get(htmlElement) as ListItem<unknown> | undefined;

          flexRowHeightReducer.exec(entry, row);

          if (listItem) {
            rowData.push(listItem);
          }
        }

        const rowIndex = fromRowNumber + rowNumber;
        const offset = rowsOffset + rowIndex > 0 ? rowsOffset + flexRowHeightAcc.top - markerHeight : 0;
        const height = flexRowHeightAcc.height;
        
        this._tree.insert(rowIndex, { items: rowData, height, offset });
      }

      const scrollableContainer = this._scrollableContainer;
      const scrollableContainerTop = scrollableContainer.getScrolledPaneOffsetTop();
      const scrollableContainerBottom = scrollableContainerTop + scrollableContainer.getScrolledPaneScrollHeight();
      const rowsTop = rowsOffset; 
      const rowsBottom = rowsOffset + flexRows.rowsHeight;

      const shouldBeRendered = isRangeIntersecting(
        scrollableContainerTop, scrollableContainerBottom, rowsTop, rowsBottom,
      );

      requestAnimationFrame(() => {
        this._scrollableContainer.setScrollHeight(rowsBottom);
      });

      if (shouldBeRendered) {
        this._renderRange(scrollableContainerTop, scrollableContainerBottom + scrollableContainer.getOverscanHeight());
      }
    });
  }
  
  insertItem<DataType>(item: ListItem<DataType>, index: number = this._tree.size, height: number | undefined = undefined): Promise<void> {
    const scrollableContainer = this._scrollableContainer;

    // const itemData = this._tree.insert(index, { item: item.textContent, size: height || 0 })!.data!;

    // this._itemDataRegistry.set(item, itemData);

    // scrollableContainer.appendItem(item);
    // scrollableContainer.setScrollHeight(scrollableContainer.getScrollHeight() + (height || 0));

    const htmlElement = item.toHTMLElement(item.data);

    this._portionToBeMeasured.set(htmlElement, item as ListItem<unknown>);
    this._flexItemsMeasurer.appendItem(htmlElement);

    return this._flexItemsMeasurer.measure();
  }

  setOverscanHeight(overscanHeight: OverscanHeight) {
    this._scrollableContainer.setOverscanHeight(overscanHeight);
  }

  setFastScrollShift(shift: number) {
    this._fastScrollShift = shift;
  }
}