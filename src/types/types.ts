/**
 * @fileoverview All types used in the library are declared here.
 * @license MIT
 * @author Alexandr Kalabin
 */

/**
 * A list item with unknown height.
 */
export interface IItem<T = unknown> {
  data: T;
  render: (data: T) => HTMLElement;
}

/**
 * A list item with specified height and vertical spacing.
 */
export interface IFixedItem<T = unknown> extends IItem<T> {
  height: number;
  marginTop?: number;
  marginBottom?: number;
}

/**
 * A list item with the recycling capability is to be used in responsive list.
 * NOT IMPLEMENTED
 */
// export interface IRecyclableItem<T> extends IItem<T> {
//   recycle?: (data: T, element: HTMLElement) => void;
// }

type StoredItem = IItem | IFixedItem | unknown;

/**
 * This type is used in layout and item store methods.
 */
export type MeasuredItem<BaseItem extends StoredItem> = BaseItem & {
  index: number;
  offsetTop?: number;
  offsetLeft?: number;
  width?: number;
  height?: number;
}

export interface IItemStore<ItemType extends StoredItem = unknown> {
  insertAt: (index: number, item: ItemType) => void; 
  deleteAt: (index: number) => void;
  getByIndex: (index: number) => MeasuredItem<ItemType> | undefined;
  getByOffset: (offset: number) => MeasuredItem<ItemType> | undefined;
  getNext: (item: MeasuredItem<ItemType>) => MeasuredItem<ItemType> | undefined;
  getPrevious: (item: MeasuredItem<ItemType>) => MeasuredItem<ItemType> | undefined;
  readonly size: number;
}

export interface IVirtualizedListEvents {
  onInsert: (index: number, item: IItem) => void;
  onDelete: (index: number, count: number) => void;
}

export interface IScrollableContainerEvents {
  onResize: (width: number, height: number) => void;
  onScroll: (position: number, direction: 'up' | 'down', speed: 'slow' | 'fast') => void;
  onItemsOutOfView: (items: HTMLElement[]) => void;
}

export type MeasurementRange = {
  startOffset: number;
  endOffset: number;
  startIndex: number; 
  endIndex: number; 
  total: number;
}

export interface IMeasurerEvents {
  onMeasureStart: (range: MeasurementRange) => void;
  onPortionMeasured: (range: MeasurementRange) => void;
  onMeasureEnd: (range: MeasurementRange) => void;
}

export type IEventMap = IVirtualizedListEvents & IScrollableContainerEvents & IMeasurerEvents;

export interface IEventEmitter<T extends { [K in keyof T]: (...args: any[]) => void }> {
  on<K extends keyof T>(event: K, cb: T[K]): void;
  off<K extends keyof T>(event: K, cb: T[K]): void;
  emit<K extends keyof T>(event: K, ...args: Parameters<T[K]>): void;
}

export type LayoutHooks = {
  [K in keyof IMeasurerEvents]: (cb: IMeasurerEvents[K]) => void;
}

export interface IRenderer {
  getRenderedElements: () => HTMLElement[];
  getContentPosition: () => { offset: number, from?: number };
}

export interface ILayout<ItemType> {
  attach: (eventBus: IEventEmitter<IEventMap>, store: IItemStore<ItemType>) => IRenderer;
  detach: () => void;
}

export interface IFixedListLayout extends ILayout<IFixedItem>, LayoutHooks {}

export interface IDynamicListLayout extends ILayout<IItem>, LayoutHooks {}

export interface IVirtualizedListOptions {
  layout: IFixedListLayout | IDynamicListLayout;
  store: IItemStore;
  container: HTMLElement;
}
