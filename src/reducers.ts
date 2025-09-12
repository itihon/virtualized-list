type ReducerFunction<A, I, K> = (acc: A, item: I, arr: K) => A;
type InitCallback<A, V> = (acc: A, value: V | undefined) => void;

export default class Reducer<A, I, V = undefined> {
  private _acc: A;
  private _reducerFn: ReducerFunction<A, I, Array<I>>;
  private _initCb: InitCallback<A, V>;

  constructor(fn: ReducerFunction<A, I, Array<I>>, acc: A, cb: InitCallback<A, V>) {
    this._acc = acc;
    this._reducerFn = fn;
    this._initCb = cb;
  }

  run(item: I, items: Array<I>) {
    this._acc = this._reducerFn(this._acc, item, items);
  }

  init(value?: V) {
    this._initCb(this._acc, value);
  }

  getAccumulator(): A {
    return this._acc;
  }
}

export type ItemsHeightAccumulator = {
  top: number;
  bottom: number;
  height: number;
};

export const createItemsHeightReducer = () => new Reducer<ItemsHeightAccumulator, IntersectionObserverEntry>(
  (acc, entry) => {
    const { top: entryTop, bottom: entryBottom } = entry.boundingClientRect;
    const { top, bottom } = acc;

    acc.top = Math.min(top, entryTop);
    acc.bottom = Math.max(bottom, entryBottom);
    acc.height = acc.bottom - acc.top;

    return acc;
  },
  {
    top: Infinity,
    bottom: -Infinity,
    height: 0,
  },
  (acc) => {
    acc.top = Infinity;
    acc.bottom = -Infinity;
    acc.height = 0;
  },
)

export type NotIntersectedRowsAccumulator = {
  rows: Array<Array<IntersectionObserverEntry>>;
  rowsTop: number;
  rowsBottom: number;
  rowsHeight: number;
  currentRow: Array<IntersectionObserverEntry>;
  isRowNotIntersected: boolean;
  itemsHeightReducer: ReturnType<typeof createItemsHeightReducer>;
  flexboxWidth: number;
  flexboxColumnGap: number;
  currentRowWidth: number;
}

/**
 * To calculate flexbox rows we have to take into consideration:
 *  - parent container's left and right `padding`, better use (content box size of ResizeObserverEntry)
 *  - parent container's `gap`
 *  - left and right `margin` of each item
 *  - width of each item
 */

export const createNotIntersectedFlexItemsReducer = (flexbox: HTMLElement) => new Reducer<NotIntersectedRowsAccumulator, IntersectionObserverEntry, number>(
  (acc, entry, entries) => {
    const { width } = entry.boundingClientRect;
    const itemStyle = getComputedStyle(entry.target);
    const marginLeft = parseInt(itemStyle.marginLeft) || 0;
    const marginRight = parseInt(itemStyle.marginRight) || 0;
    const itemOccupiedSpace = marginLeft + width + marginRight;
    const resultingRowWidth = acc.currentRowWidth + itemOccupiedSpace;
    const isLastItem = entry === entries[entries.length - 1];

    if (resultingRowWidth > acc.flexboxWidth) {
      const { top, bottom, height } = acc.itemsHeightReducer.getAccumulator();

      if (acc.isRowNotIntersected) {
        acc.rows.push(acc.currentRow);
        acc.rowsTop += top;
        acc.rowsBottom += bottom
        acc.rowsHeight += height;
      } 

      acc.currentRow = [];
      acc.isRowNotIntersected = true;
      acc.currentRowWidth = 0;
      acc.itemsHeightReducer.init();
    }
    
    acc.isRowNotIntersected = acc.isRowNotIntersected && !entry.isIntersecting;

    acc.currentRow.push(entry);
    acc.itemsHeightReducer.run(entry, entries);
    acc.currentRowWidth += (itemOccupiedSpace + acc.flexboxColumnGap);

    if (isLastItem) {
      const { top, bottom, height } = acc.itemsHeightReducer.getAccumulator();

      if (acc.isRowNotIntersected) {
        acc.rows.push(acc.currentRow);
        acc.rowsTop += top;
        acc.rowsBottom += bottom
        acc.rowsHeight += height;
      }
    }

    return acc;
  },
  {
    rows: [],
    rowsTop: 0,
    rowsBottom: 0,
    rowsHeight: 0,
    currentRow: [],
    isRowNotIntersected: true,
    itemsHeightReducer: createItemsHeightReducer(),
    flexboxWidth: 0,
    currentRowWidth: 0,
    flexboxColumnGap: 0,
  },
  (acc, contentBoxInlineSize) => {
    const flexboxStyle = getComputedStyle(flexbox);
    const columnGap = parseInt(flexboxStyle.columnGap) || 0;

    if (!contentBoxInlineSize) {
      throw new Error(
        'Flexbox content box inline size is needed to be pased' + 
        ' in the init() method for reducer to work.'
      );
    }

    acc.rows = [];
    acc.rowsTop = 0;
    acc.rowsBottom = 0;
    acc.rowsHeight = 0;
    acc.currentRow = [];
    acc.isRowNotIntersected = true;
    acc.itemsHeightReducer.init();
    acc.flexboxWidth = contentBoxInlineSize;
    acc.currentRowWidth = 0;
    acc.flexboxColumnGap = columnGap;
  },
);
