/**
 * @fileoverview All types used in the library are declared here.
 * @license MIT
 * @author Alexandr Kalabin
 */

export interface IItem<T = unknown> {
  data: T;
  render: (data: T) => HTMLElement;
  recycle?: (data: T, element: HTMLElement) => void;
  height?: number;
  marginTop?: number;
  marginBottom?: number;
  offset?: number;
  next?: IItem<T>;
  previous?: IItem<T>;
}

export interface IItemStore {
  insertAt: (index: number, item: IItem) => void; 
  deleteAt: (index: number) => void;
  getByIndex: (index: number) => IItem | undefined;
  getByOffset: (offset: number) => IItem;
  getNext: (item: IItem) => IItem | undefined;
  getPrevious: (item: IItem) => IItem | undefined;
  readonly size: number;
}

export interface IVirtualizedListHooks {
  onInsert(index: number, items: IItem[]): void;
  onDelete(index: number, count: number): void;
  onResize(width: number, height: number): void;
  onScroll(position: number, direction: 'up' | 'down'): void;
}

export interface IMeasurerEvents {
  onMeasureStart(cb: () => void): void;
  onPortionMeasured(cb: (portion: IItem[]) => void): void;
  onMeasureEnd(cb: () => void): void;
}

export interface IRenderer {
  getRenderedElements(position: number, count: number, range: number): HTMLElement[];
}

export interface ILayout {
  attach(hooks: IVirtualizedListHooks, store: IItemStore): IRenderer;
  detach(): void;
}

export interface IAsyncLayout extends ILayout, IMeasurerEvents {}