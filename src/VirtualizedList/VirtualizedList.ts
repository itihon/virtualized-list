/**
 * @fileoverview VirtualizedList class implementation. Accepts different Layout and ItemsStore types.
 * @license MIT
 * @author Alexandr Kalabin
 */

import ScrollableContainer from "../ScrollableContainer/ScrollableContainer";
import type { 
  IAsyncLayout, 
  IEventMap, 
  IItem, 
  IItemStore, 
  IRenderer, 
  IVirtualizedListOptions 
} from "../types/types";
import EventBus from "../EventBus/EventBus";

export default class VirtualizedList {
  private _layout: IAsyncLayout;
  private _store: IItemStore;
  private _container: HTMLElement;
  private _renderer: IRenderer;
  private _scrollableContainer: ScrollableContainer;
  private _eventBus = new EventBus<IEventMap>();

  constructor({ layout, store, container }: IVirtualizedListOptions) {
    this._layout = layout;
    this._store = store;
    this._container = container;
    this._scrollableContainer = new ScrollableContainer(container);
    this._renderer = this._layout.attach(this._eventBus, this._store);

    this._layout.onPortionMeasured(() => {

      const isVisibleItemsInvolved = true;

      if (isVisibleItemsInvolved) {
        // get by range
        const itemsToRender = this._renderer.getRenderedElements(0, 0, 0);

        this._scrollableContainer.clear();

        itemsToRender.forEach((item) => {
          this._scrollableContainer.appendItem(item);
        });
      }
    });

    this._scrollableContainer.onScroll(() => {
      if (/* slow scroll */) {
        // get by index or get next/previuos
        this._eventBus.emit('onScroll', this._container.scrollTop, 'down', 'slow');
        const itemsToRender = this._renderer.getRenderedElements();
        const { offset, from } = this._renderer.getContentPosition();

        itemsToRender.forEach((item) => {
          this._scrollableContainer.appendItem(item);
        });

        this._scrollableContainer.updateContentPosition(offset, from);
      }

      if (/* fast scroll */) {
        // get by range
        this._eventBus.emit('onScroll', this._container.scrollTop, 'down', 'fast');
        const itemsToRender = this._renderer.getRenderedElements();
        const { offset, from } = this._renderer.getContentPosition();

        this._scrollableContainer.clear();

        itemsToRender.forEach((item) => {
          this._scrollableContainer.appendItem(item);
        });

        this._scrollableContainer.updateContentPosition(offset, from);
      }
    });
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
