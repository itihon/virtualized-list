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
  onInsert: (index: number, item: IItem) => void;
  onDelete: (index: number, count: number) => void;
  onResize: (width: number, height: number) => void;
  onScroll: (position: number, direction: 'up' | 'down') => void;
}

export interface IMeasurerHooks {
  onMeasureStart: (startIndex: number) => void;
  onPortionMeasured: (startIndex: number, endIndex: number, total: number) => void;
  onMeasureEnd: (endIndex: number) => void;
}

export interface IVirtualizeListEventEmitter<T extends { [K in keyof T]: (...args: any[]) => void }> {
  on<K extends keyof T>(event: K, cb: T[K]): void;
  off<K extends keyof T>(event: K, cb: T[K]): void;
  emit<K extends keyof T>(event: K, ...args: Parameters<T[K]>): void;
}

export type LayoutHooks = {
  [K in keyof IMeasurerHooks]: (cb: IMeasurerHooks[K]) => void;
}

export interface IRenderer {
  getRenderedElements: (position: number, count: number, range: number) => HTMLElement[];
}

export type ILifecycleHooks = IVirtualizeListEventEmitter<IVirtualizedListHooks>;

export interface ILayout {
  attach: (hooks: ILifecycleHooks, store: IItemStore) => IRenderer;
  detach: (hooks: ILifecycleHooks) => void;
}

export interface IAsyncLayout extends ILayout, LayoutHooks {}

export interface IVirtualizedListOptions {
  layout: IAsyncLayout;
  store: IItemStore;
  container: HTMLElement;
}
