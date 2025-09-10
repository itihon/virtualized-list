type ReducerFunction<A, I, K> = (acc: A, item: I, arr: K) => A;
type ResetterCallback<A> = (acc: A) => void;

export default class Reducer<A, I> {
  private _acc: A;
  private _reducerFn: ReducerFunction<A, I, Array<I>>;
  private _resetterCb: ResetterCallback<A>;

  constructor(fn: ReducerFunction<A, I, Array<I>>, acc: A, cb: ResetterCallback<A>) {
    this._acc = acc;
    this._reducerFn = fn;
    this._resetterCb = cb;
  }

  run(item: I, items: Array<I>) {
    this._acc = this._reducerFn(this._acc, item, items);
  }

  reset() {
    this._resetterCb(this._acc);
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
  currentRight: number;
  itemsHeightReducer: ReturnType<typeof createItemsHeightReducer>;
}

export const createNotIntersectedFlexItemsReducer = () => new Reducer<NotIntersectedRowsAccumulator, IntersectionObserverEntry>(
  (acc, entry, entries) => {
    if (!acc.isRowNotIntersected) return acc;

    const { right } = entry.boundingClientRect;

    if (right < acc.currentRight) {
      const { top, bottom, height } = acc.itemsHeightReducer.getAccumulator();

      acc.rows.push(acc.currentRow);
      acc.rowsTop += top;
      acc.rowsBottom += bottom
      acc.rowsHeight += height;

      acc.currentRow = [];
      acc.isRowNotIntersected = true;
      acc.currentRight = right;
      acc.itemsHeightReducer.reset();
    }

    if (right >= acc.currentRight) {
      acc.isRowNotIntersected = acc.isRowNotIntersected && !entry.isIntersecting;

      if (!acc.isRowNotIntersected) return acc;

      acc.currentRow.push(entry);
      acc.itemsHeightReducer.run(entry, entries);
      acc.currentRight = right;
    }

    if (entry === entries[entries.length - 1]) {
      const { top, bottom, height } = acc.itemsHeightReducer.getAccumulator();

      acc.rows.push(acc.currentRow);
      acc.rowsTop += top;
      acc.rowsBottom += bottom
      acc.rowsHeight += height;
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
    currentRight: 0,
    itemsHeightReducer: createItemsHeightReducer(),
  },
  (acc) => {
    acc.rows = [];
    acc.rowsTop = 0;
    acc.rowsBottom = 0;
    acc.rowsHeight = 0;
    acc.currentRow = [];
    acc.isRowNotIntersected = true;
    acc.currentRight = 0;
    acc.itemsHeightReducer.reset();
  },
);
