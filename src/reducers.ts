type ReducerFunction<A, I> = (acc: A, item: I, arr: Array<I>) => A;
type InitCallback<A, V extends unknown[]> = (acc: A, ...value: V) => A;

export default class Reducer<A, I, V extends unknown[] = undefined[]> {
  private _acc: A;
  private _reducerFn: ReducerFunction<A, I>;
  private _initCb: InitCallback<A, V>;

  constructor(fn: ReducerFunction<A, I>, acc: A, cb: InitCallback<A, V>) {
    this._acc = acc;
    this._reducerFn = fn;
    this._initCb = cb;
  }

  exec(item: I, items: Array<I>) {
    this._acc = this._reducerFn(this._acc, item, items);
  }

  init(...value: V) {
    this._acc = this._initCb(this._acc, ...value);
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

export type FlexRowsAccumulator = {
  rows: Array<Array<IntersectionObserverEntry>>;
  rowsTop: number;
  rowsBottom: number;
  rowsHeight: number;
  currentRow: Array<IntersectionObserverEntry>;
  isRowNotIntersected: boolean;
  itemsHeightReducer: ReturnType<typeof createItemsHeightReducer>;
  itemsHeightAcc: ItemsHeightAccumulator | undefined;
  flexboxWidth: number;
  flexboxColumnGap: number;
  currentRowWidth: number;
  readonly ignoreLastRow: boolean;
  readonly ignoreRowIntersection: boolean;
}

type ItemsHeightReducer = ReducerFunction<ItemsHeightAccumulator, IntersectionObserverEntry>;
type InitItemsHeightAcc = InitCallback<ItemsHeightAccumulator, [number | undefined, number | undefined] | []>;

type FlexRowsReducer = ReducerFunction<FlexRowsAccumulator, IntersectionObserverEntry>;
type InitFlexRowsAcc = InitCallback<FlexRowsAccumulator, [HTMLElement, number]>;

const itemsHeightReducer: ItemsHeightReducer = (acc, entry) => {
  const { top: entryTop, bottom: entryBottom } = entry.boundingClientRect;
  const { top, bottom } = acc;

  acc.top = Math.min(top, entryTop);
  acc.bottom = Math.max(bottom, entryBottom);
  acc.height = acc.bottom - acc.top;

  return acc;
};

const itemsHeightAcc: ItemsHeightAccumulator = {
  top: Infinity,
  bottom: -Infinity,
  height: 0,
};

const initItemsHeightAcc: InitItemsHeightAcc = (acc, top = Infinity, bottom = -Infinity) => {
  acc.top = top;
  acc.bottom = bottom;
  acc.height = 0;
  return acc;
};

export const createItemsHeightReducer = () => 
  new Reducer<ItemsHeightAccumulator, IntersectionObserverEntry, [number | undefined, number | undefined] | []>(
    itemsHeightReducer, itemsHeightAcc, initItemsHeightAcc,
  );

/**
 * To calculate flexbox rows we have to take into consideration:
 *  - parent container's left and right `padding`, better use (content box size of ResizeObserverEntry)
 *  - parent container's `gap`
 *  - left and right `margin` of each item
 *  - width of each item
 */

const flexRowsReducer: FlexRowsReducer = (acc, entry, entries) => {
  const { width } = entry.boundingClientRect;
  const itemStyle = getComputedStyle(entry.target);
  const marginLeft = parseFloat(itemStyle.marginLeft) || 0;
  const marginRight = parseFloat(itemStyle.marginRight) || 0;
  const itemOccupiedSpace = marginLeft + width + marginRight;
  const resultingRowWidth = acc.currentRowWidth + itemOccupiedSpace;
  const isLastItem = entry === entries[entries.length - 1];

  if (resultingRowWidth > acc.flexboxWidth) {
    const { top, bottom, height } = acc.itemsHeightAcc!;

    if (acc.isRowNotIntersected || acc.ignoreRowIntersection) {
      acc.rows.push(acc.currentRow);
      acc.rowsTop = top;
      acc.rowsBottom = bottom
      acc.rowsHeight = height;
      acc.itemsHeightReducer.init(top, bottom);
    } 
    else {
      acc.itemsHeightReducer.init();
    }

    acc.currentRow = [];
    acc.isRowNotIntersected = true;
    acc.currentRowWidth = 0;
  }
  
  acc.isRowNotIntersected = acc.isRowNotIntersected && !entry.isIntersecting;

  acc.currentRow.push(entry);
  acc.itemsHeightReducer.exec(entry, entries);
  acc.currentRowWidth += (itemOccupiedSpace + acc.flexboxColumnGap);

  if (isLastItem && !acc.ignoreLastRow) {
    const { top, bottom, height } = acc.itemsHeightAcc!;

    if (acc.isRowNotIntersected || acc.ignoreRowIntersection) {
      acc.rows.push(acc.currentRow);
      acc.rowsTop = top;
      acc.rowsBottom = bottom
      acc.rowsHeight = height;
    }
  }

  return acc;
};

const notIntersectedflexRowsAcc: FlexRowsAccumulator = {
  rows: [],
  rowsTop: 0,
  rowsBottom: 0,
  rowsHeight: 0,
  currentRow: [],
  isRowNotIntersected: true,
  itemsHeightReducer: createItemsHeightReducer(),
  itemsHeightAcc: undefined,
  flexboxWidth: 0,
  currentRowWidth: 0,
  flexboxColumnGap: 0,
  ignoreLastRow: false,
  ignoreRowIntersection: false,
};

const skippedLastFlexRowsAcc: FlexRowsAccumulator = {
  rows: [],
  rowsTop: 0,
  rowsBottom: 0,
  rowsHeight: 0,
  currentRow: [],
  isRowNotIntersected: true,
  itemsHeightReducer: createItemsHeightReducer(),
  itemsHeightAcc: undefined,
  flexboxWidth: 0,
  currentRowWidth: 0,
  flexboxColumnGap: 0,
  ignoreLastRow: true,
  ignoreRowIntersection: true,
};

const initFlexRowsAcc: InitFlexRowsAcc = (acc, flexbox, contentBoxInlineSize) => {
  const flexboxStyle = getComputedStyle(flexbox);
  const columnGap = parseFloat(flexboxStyle.columnGap) || 0;

  acc.rows = [];
  acc.rowsTop = 0;
  acc.rowsBottom = 0;
  acc.rowsHeight = 0;
  acc.currentRow = [];
  acc.isRowNotIntersected = true;
  acc.itemsHeightReducer.init();
  acc.itemsHeightAcc = acc.itemsHeightReducer.getAccumulator();
  acc.flexboxWidth = contentBoxInlineSize;
  acc.currentRowWidth = 0;
  acc.flexboxColumnGap = columnGap;
  return acc;
};

export const createNotIntersectedFlexRowsReducer = () => 
  new Reducer<FlexRowsAccumulator, IntersectionObserverEntry, [HTMLElement, number]>(
    flexRowsReducer, notIntersectedflexRowsAcc, initFlexRowsAcc,
  );

export const createSkippedLastFlexRowsReducer = () => 
  new Reducer<FlexRowsAccumulator, IntersectionObserverEntry, [HTMLElement, number]>(
    flexRowsReducer, skippedLastFlexRowsAcc, initFlexRowsAcc,
  );