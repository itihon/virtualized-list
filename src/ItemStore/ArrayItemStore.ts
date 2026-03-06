/**
 * @fileoverview This ItemStore implementation keeps list items in an array, implements binary search by offset.
 * @license MIT
 * @author Alexandr Kalabin
 */

import type { IItemStore, MeasuredItem } from '../types/types';

export default class ArrayItemStore<ItemType> implements IItemStore<ItemType> {
  private _store: MeasuredItem<ItemType>[] = [];

  private _assignIndex(item?: MeasuredItem<ItemType>, index?: number): MeasuredItem<ItemType> | undefined {
    if (item && index !== undefined) {
      item.index = index;
      return item;
    }
  }

  insertAt(index: number, item: ItemType) {
    const maxIdx = this._store.length;
    const idx = index < 0 ? 0 : index > maxIdx ? maxIdx : index;
    this._store.splice(idx, 0, item as MeasuredItem<ItemType>);
  }

  deleteAt(index: number) {
    const removedItem = this._store[index];

    if (removedItem) {
      this._store.splice(index, 1);
    }
  }

  getByIndex(index: number) {
    return this._assignIndex(this._store[index], index);
  }

  getByOffset(offset: number) {
    let startIndex = 0;
    let endIndex = this._store.length - 1;
    let closestItem = this._assignIndex(this._store[startIndex], startIndex);

    while (startIndex <= endIndex) {
      const middleIndex = (startIndex + endIndex) >>> 1;
      const item = this._assignIndex(this._store[middleIndex], middleIndex);
      const itemOffset = item?.offsetTop || 0;

      if (offset === itemOffset) {
        return item;
      }

      if (offset < itemOffset) {
        endIndex = middleIndex - 1;
      } 
      else {
        closestItem = item;
        startIndex = middleIndex + 1;
      }
    }

    return closestItem; 
  }

  getPrevious(item: MeasuredItem<ItemType>) {
    const index = item.index - 1;
    return this._assignIndex(this._store[index], index);
  }

  getNext(item: MeasuredItem<ItemType>) {
    const index = item.index + 1;
    return this._assignIndex(this._store[index], index);
  }

  get size() {
    return this._store.length;
  }
}