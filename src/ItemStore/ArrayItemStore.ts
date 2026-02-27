/**
 * @fileoverview This ItemStore implementation keeps list items in an array, implements binary search by offset, interlinks (modifies) items into a double linked list.
 * @license MIT
 * @author Alexandr Kalabin
 */

import type { IItem, IItemStore } from '../types/types';

export default class ArrayItemStore implements IItemStore {
  private _store: IItem[] = [];

  insertAt(index: number, item: IItem) {
    const maxIdx = this._store.length;
    const idx = index < 0 ? 0 : index > maxIdx ? maxIdx : index;
    this._store.splice(idx, 0, item);

    const previouItem = this._store[idx - 1];
    const currentItem = this._store[idx];
    const nextItem = this._store[idx + 1];

    if (previouItem) {
      previouItem.next = currentItem;
      currentItem.previous = previouItem;
    }

    if (nextItem) {
      nextItem.previous = currentItem;
      currentItem.next = nextItem;
    }
  }

  deleteAt(index: number) {
    const removedItem = this._store[index];

    if (removedItem) {
      const previouItem = removedItem.previous;
      const nextItem = removedItem.next;

      this._store.splice(index, 1);

      removedItem.previous = undefined;
      removedItem.next = undefined;

      if (previouItem) {
        previouItem.next = nextItem;
      }

      if (nextItem) {
        nextItem.previous = previouItem;
      }
    }
  }

  getByIndex(index: number): IItem | undefined {
    return this._store[index];
  }

  getByOffset(offset: number): IItem {
    let startIndex = 0;
    let endIndex = this._store.length - 1;
    let closestItem = this._store[startIndex];

    while (startIndex <= endIndex) {
      const middleIndex = (startIndex + endIndex) >>> 1;
      const item = this._store[middleIndex];
      const itemOffset = item.offset || 0;

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

  getPrevious(item: IItem): IItem | undefined {
    return item.previous;
  }

  getNext(item: IItem): IItem | undefined {
    return item.next;
  }

  get size(): number {
    return this._store.length;
  }
}