/**
 * @fileoverview VirtualizedList class implementation. Accepts different Layout and ItemsStore types.
 * @license MIT
 * @author Alexandr Kalabin
 */

import type { 
  IEventMap, 
  IFixedItem, 
  IItem, 
  IItemStore, 
  IVirtualizedDynamicListOptions, 
  IVirtualizedFixedListOptions 
} from "../types/types";
import EventBus from "../EventBus/EventBus";

export default class VirtualizedList {
  private _store: IItemStore<IFixedItem<unknown>> & IItemStore<IItem<unknown>>;
  private _eventBus = new EventBus<IEventMap>();

  constructor({ layout, store }: IVirtualizedFixedListOptions & IVirtualizedDynamicListOptions) {
    this._store = store;
    layout.attach(this._eventBus, this._store);
  }

  insert(item: IItem, index: number) {
    this._store.insertAt(index, item);
    this._eventBus.emit('onInsert', index, item);
  }

  delete(index: number) {
    this._store.deleteAt(index);
    this._eventBus.emit('onDelete', index, 1);
  }

  // setItems(items: IItem[]) {
  //   this._store.setItems(items: IItem[]);
  //   this._hooks.emit('onInsert', 0, item);
  // }
}
