/**
 * @fileoverview All types used in the library are declared here.
 * @license MIT
 * @author Alexandr Kalabin
 */

export interface IItem<T = unknown> {
  data: T;
  render: (data: T) => HTMLElement;
  recycle?: (data: T, element: HTMLElement) => void;
  width?: number;
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
  readonly size: number;
}