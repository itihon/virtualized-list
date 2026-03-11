import { describe, test, expect, vi, beforeEach } from 'vitest';
import FixedListLayout from '../../../src/Layout/FixedListLayout';
import ArrayItemStore from '../../../src/ItemStore/ArrayItemStore';
import EventBus from '../../../src/EventBus/EventBus';
import { IEventMap, IFixedItem } from '../../../src/types/types';

// mock animate method
if (!HTMLElement.prototype.animate) {
  HTMLElement.prototype.animate = () => ({} as Animation);
}

// mock appendChild method
HTMLElement.prototype.appendChild = () => ({} as any);

// mock render function
const render = () => ({} as HTMLElement);

const wait = (ms = 0) => new Promise(res => setTimeout(res, ms));

const expectOffsetToBeCalculatedUpToIndex = (index: number) => {
  if (index < store.size) {
    for(let i = 0; i < store.size; i++) {
      if (i <= index) {
        if (i === 0) {
          expect(store.getByIndex(i)?.offsetTop).toBeGreaterThanOrEqual(0);
        }
        else {
          expect(store.getByIndex(i)?.offsetTop).toBeGreaterThan(0);
        }
      }
      else {
        expect(store.getByIndex(i)?.offsetTop).toBe(0);
      }
    }
  }
  else {
    throw new Error('Index must be less than store size.');
  }
};

type Item = IFixedItem & { offsetTop?: number };

let itemsWithMargins: Item[] = [];
let itemsWithoutMargins: Item[] = [];
let layout: FixedListLayout;
let store: ArrayItemStore<IFixedItem>;
let eventBus: EventBus<IEventMap>;

const height = 40;
const marginTop = 10;
const marginBottom = 20;

describe('FixedListLayout', () => {
  beforeEach(() => {
    itemsWithMargins = [
      { offsetTop: 0, height, marginTop, marginBottom, data: 0, render },
      { offsetTop: 0, height, marginTop, marginBottom, data: 1, render },
      { offsetTop: 0, height, marginTop, marginBottom, data: 2, render },
      { offsetTop: 0, height, marginTop, marginBottom, data: 3, render },
      { offsetTop: 0, height, marginTop, marginBottom, data: 4, render },
      { offsetTop: 0, height, marginTop, marginBottom, data: 5, render },
      { offsetTop: 0, height, marginTop, marginBottom, data: 6, render },
      { offsetTop: 0, height, marginTop, marginBottom, data: 7, render },
      { offsetTop: 0, height, marginTop, marginBottom, data: 8, render },
      { offsetTop: 0, height, marginTop, marginBottom, data: 9, render },
    ];

    itemsWithoutMargins = [
      { offsetTop: 0, height, data: 0, render },
      { offsetTop: 0, height, data: 1, render },
      { offsetTop: 0, height, data: 2, render },
      { offsetTop: 0, height, data: 3, render },
      { offsetTop: 0, height, data: 4, render },
      { offsetTop: 0, height, data: 5, render },
      { offsetTop: 0, height, data: 6, render },
      { offsetTop: 0, height, data: 7, render },
      { offsetTop: 0, height, data: 8, render },
      { offsetTop: 0, height, data: 9, render },
    ];

    layout = new FixedListLayout();
    store = new ArrayItemStore();
    eventBus = new EventBus<IEventMap>();

    layout.attach(document.createElement('div'), eventBus, store);
  });

  test('calculates offset on sequential insertion in the beginning', async () => {

    // with margins
    itemsWithMargins.forEach((item, idx) => {
      store.insertAt(idx, item);
      eventBus.emit('onInsert', idx, item);
    });

    await wait(16);

    const offsetsWithMargins = [
      { calculatedOffset: 10 },
      { calculatedOffset: 80 },
      { calculatedOffset: 150 },
      { calculatedOffset: 220 },
      { calculatedOffset: 290 },
      { calculatedOffset: 360 },
      { calculatedOffset: 430 },
      { calculatedOffset: 500 },
      { calculatedOffset: 570 },
      { calculatedOffset: 640 },
    ];

    itemsWithMargins.forEach((item, idx) => {
      expect(item.offsetTop).toBe(offsetsWithMargins[idx].calculatedOffset);
    });

    // without margins
    itemsWithoutMargins.forEach((item, idx) => {
      store.insertAt(idx, item);
      eventBus.emit('onInsert', idx, item);
    });

    await wait(16);

    const offsetsWithoutMargins = [
      { calculatedOffset: 0 },
      { calculatedOffset: 40 },
      { calculatedOffset: 80 },
      { calculatedOffset: 120 },
      { calculatedOffset: 160 },
      { calculatedOffset: 200 },
      { calculatedOffset: 240 },
      { calculatedOffset: 280 },
      { calculatedOffset: 320 },
      { calculatedOffset: 360 },
    ];

    itemsWithoutMargins.forEach((item, idx) => {
      expect(item.offsetTop).toBe(offsetsWithoutMargins[idx].calculatedOffset);
    });

    const combinedOffsets = [
      // 10 without margins
      { calculatedOffset: 0 },
      { calculatedOffset: 40 },
      { calculatedOffset: 80 },
      { calculatedOffset: 120 },
      { calculatedOffset: 160 },
      { calculatedOffset: 200 },
      { calculatedOffset: 240 },
      { calculatedOffset: 280 },
      { calculatedOffset: 320 },
      { calculatedOffset: 360 },

      // 10 with margins
      { calculatedOffset: 410 },
      { calculatedOffset: 480 },
      { calculatedOffset: 550 },
      { calculatedOffset: 620 },
      { calculatedOffset: 690 },
      { calculatedOffset: 760 },
      { calculatedOffset: 830 },
      { calculatedOffset: 900 },
      { calculatedOffset: 970 },
      { calculatedOffset: 1040 },
    ];

    itemsWithoutMargins.concat(itemsWithMargins).forEach((item, idx) => {
      expect(item.offsetTop).toBe(combinedOffsets[idx].calculatedOffset);
    });

  });

  test('calculates offset on sequential deletion from the beginning', async () => {

    itemsWithMargins.forEach((item, idx) => {
      store.insertAt(idx, item);
      eventBus.emit('onInsert', idx, item);
    });

    itemsWithoutMargins.forEach((item, idx) => {
      store.insertAt(idx, item);
      eventBus.emit('onInsert', idx, item);
    });

    store.deleteAt(0);
    eventBus.emit('onDelete', 0, 1);

    await wait(16);

    const combinedOffsets = [
      // 9 items without margins
      { calculatedOffset: 0 },
      { calculatedOffset: 40 },
      { calculatedOffset: 80 },
      { calculatedOffset: 120 },
      { calculatedOffset: 160 },
      { calculatedOffset: 200 },
      { calculatedOffset: 240 },
      { calculatedOffset: 280 },
      { calculatedOffset: 320 },

      // 10 items with margins
      { calculatedOffset: 370 },
      { calculatedOffset: 440 },
      { calculatedOffset: 510 },
      { calculatedOffset: 580 },
      { calculatedOffset: 650 },
      { calculatedOffset: 720 },
      { calculatedOffset: 790 },
      { calculatedOffset: 860 },
      { calculatedOffset: 930 },
      { calculatedOffset: 1000 },
    ];

    itemsWithoutMargins.concat(itemsWithMargins).slice(1).forEach((item, idx) => {
      expect(item.offsetTop).toBe(combinedOffsets[idx].calculatedOffset);
    });

    for (let i = 0; i < 9; i++) {
      store.deleteAt(0);
      eventBus.emit('onDelete', 0, 1);
    }

    await wait(16);

    const offsetsWithMargins = [
      { calculatedOffset: 10 },
      { calculatedOffset: 80 },
      { calculatedOffset: 150 },
      { calculatedOffset: 220 },
      { calculatedOffset: 290 },
      { calculatedOffset: 360 },
      { calculatedOffset: 430 },
      { calculatedOffset: 500 },
      { calculatedOffset: 570 },
      { calculatedOffset: 640 },
    ];

    itemsWithMargins.forEach((item, idx) => {
      expect(item.offsetTop).toBe(offsetsWithMargins[idx].calculatedOffset);
    });
  });

  test('insert/delete in the middle', async () => {
    itemsWithMargins.forEach((item, idx) => {
      store.insertAt(idx, item);
      eventBus.emit('onInsert', idx, item);
    });

    itemsWithoutMargins.forEach((item, idx) => {
      store.insertAt(idx, item);
      eventBus.emit('onInsert', idx, item);
    });

    const newItemWithMargins = { data: .4, height, marginTop, marginBottom, render };
    const newItemWithoutMargins = { data: .14, height, render };

    store.insertAt(4, newItemWithMargins);
    eventBus.emit('onInsert', 4, newItemWithMargins);

    store.insertAt(14, newItemWithoutMargins);
    eventBus.emit('onInsert', 14, newItemWithoutMargins);

    store.deleteAt(6);
    eventBus.emit('onDelete', 6, 1);

    store.deleteAt(16);
    eventBus.emit('onDelete', 16, 1);

    await wait(16);

    const combinedOffsets = [
      { calculatedOffset: 0 },
      { calculatedOffset: 40 },
      { calculatedOffset: 80 },
      { calculatedOffset: 120 },
      { calculatedOffset: 170 },
      { calculatedOffset: 230 },
      { calculatedOffset: 270 },
      { calculatedOffset: 310 },
      { calculatedOffset: 350 },
      { calculatedOffset: 390 },
      { calculatedOffset: 440 },
      { calculatedOffset: 510 },
      { calculatedOffset: 580 },
      { calculatedOffset: 640 },
      { calculatedOffset: 690 },
      { calculatedOffset: 760 },
      { calculatedOffset: 830 },
      { calculatedOffset: 900 },
      { calculatedOffset: 970 },
      { calculatedOffset: 1040 },
    ];

    const combinedItems = itemsWithoutMargins.concat(itemsWithMargins);

    combinedItems.splice(4, 0, newItemWithMargins);
    combinedItems.splice(14, 0, newItemWithoutMargins);
    combinedItems.splice(6, 1);
    combinedItems.splice(16, 1);

    combinedItems.forEach((item, idx) => {
      expect(item.offsetTop).toBe(combinedOffsets[idx].calculatedOffset);
    });
  });

  test('insert/delete in the end', async () => {
    itemsWithMargins.forEach((item, idx) => {
      store.insertAt(idx, item);
      eventBus.emit('onInsert', idx, item);
    });

    store.deleteAt(9);
    eventBus.emit('onDelete', 9, 1);

    const newItem = { data: .99, height, render };
    store.insertAt(9, newItem);
    eventBus.emit('onInsert', 9, newItem);

    await wait(16);

    const offsetsWithMargins = [
      { calculatedOffset: 10 },
      { calculatedOffset: 80 },
      { calculatedOffset: 150 },
      { calculatedOffset: 220 },
      { calculatedOffset: 290 },
      { calculatedOffset: 360 },
      { calculatedOffset: 430 },
      { calculatedOffset: 500 },
      { calculatedOffset: 570 },
      // { calculatedOffset: 640 },
      { calculatedOffset: 630 },
    ];

    itemsWithMargins.slice(0, -1).concat(newItem).forEach((item, idx) => {
      expect(item.offsetTop).toBe(offsetsWithMargins[idx].calculatedOffset);
    });
  });

  test('maxMeasuredPortionSize option (spread evenly) and measurer hooks', async () => {
    const onMeasureStartCB = vi.fn();
    const onPortionMeasuredCB = vi.fn();
    const onMeasureEndCB = vi.fn();

    layout.detach();
    layout = new FixedListLayout({ maxMeasuredPortionSize: 5 });
    layout.attach(document.createElement('div'), eventBus, store);

    layout.onMeasureStart(range => onMeasureStartCB(range.startIndex));
    layout.onPortionMeasured(range => onPortionMeasuredCB(range.startIndex, range.endIndex, range.total, range.startOffset, range.endOffset));
    layout.onMeasureEnd(range => onMeasureEndCB(range.endIndex));

    itemsWithMargins.forEach((item, idx) => {
      store.insertAt(idx, item);
      eventBus.emit('onInsert', idx, item);
    });

    itemsWithoutMargins.forEach((item, idx) => {
      store.insertAt(idx, item);
      eventBus.emit('onInsert', idx, item);
    });

    expect(onMeasureStartCB).not.toHaveBeenCalled();
    expect(onPortionMeasuredCB).not.toHaveBeenCalled();
    expect(onMeasureEndCB).not.toHaveBeenCalled();

    await wait();

    expect(onMeasureStartCB).toHaveBeenCalledTimes(1);
    expect(onPortionMeasuredCB).toHaveBeenCalledTimes(1);

    expect(onMeasureStartCB).toHaveBeenLastCalledWith(0);
    expect(onPortionMeasuredCB).toHaveBeenLastCalledWith(0, 4, 20, 0, 160);
    expect(onMeasureEndCB).not.toHaveBeenCalled();

    expectOffsetToBeCalculatedUpToIndex(4);

    await wait();

    expect(onMeasureStartCB).toHaveBeenCalledTimes(1);
    expect(onPortionMeasuredCB).toHaveBeenCalledTimes(2);

    expect(onMeasureStartCB).toHaveBeenLastCalledWith(0);
    expect(onPortionMeasuredCB).toHaveBeenLastCalledWith(5, 9, 20, 160, 360);
    expect(onMeasureEndCB).not.toHaveBeenCalled();

    expectOffsetToBeCalculatedUpToIndex(9);

    await wait();

    expect(onMeasureStartCB).toHaveBeenCalledTimes(1);
    expect(onPortionMeasuredCB).toHaveBeenCalledTimes(3);

    expect(onMeasureStartCB).toHaveBeenLastCalledWith(0);
    expect(onPortionMeasuredCB).toHaveBeenLastCalledWith(10, 14, 20, 360, 690);
    expect(onMeasureEndCB).not.toHaveBeenCalled();

    expectOffsetToBeCalculatedUpToIndex(14);

    await wait();

    expect(onMeasureStartCB).toHaveBeenCalledTimes(1);
    expect(onPortionMeasuredCB).toHaveBeenCalledTimes(4);
    expect(onMeasureEndCB).toHaveBeenCalledTimes(1);

    expect(onMeasureStartCB).toHaveBeenLastCalledWith(0);
    expect(onPortionMeasuredCB).toHaveBeenLastCalledWith(15, 19, 20, 690, 1040);
    expect(onMeasureEndCB).toHaveBeenLastCalledWith(19);

    expectOffsetToBeCalculatedUpToIndex(19);
  });

  test('maxMeasuredPortionSize option (spread unevenly) and measurer hooks', async () => {
    const onMeasureStartCB = vi.fn();
    const onPortionMeasuredCB = vi.fn();
    const onMeasureEndCB = vi.fn();

    layout.detach();
    layout = new FixedListLayout({ maxMeasuredPortionSize: 9 });
    layout.attach(document.createElement('div'), eventBus, store);

    layout.onMeasureStart(range => onMeasureStartCB(range.startIndex));
    layout.onPortionMeasured(range => onPortionMeasuredCB(range.startIndex, range.endIndex, range.total, range.startOffset, range.endOffset));
    layout.onMeasureEnd(range => onMeasureEndCB(range.endIndex));

    itemsWithMargins.forEach((item, idx) => {
      store.insertAt(idx, item);
      eventBus.emit('onInsert', idx, item);
    });

    itemsWithoutMargins.forEach((item, idx) => {
      store.insertAt(idx, item);
      eventBus.emit('onInsert', idx, item);
    });

    expect(onMeasureStartCB).not.toHaveBeenCalled();
    expect(onPortionMeasuredCB).not.toHaveBeenCalled();
    expect(onMeasureEndCB).not.toHaveBeenCalled();

    await wait();

    expect(onMeasureStartCB).toHaveBeenCalledTimes(1);
    expect(onPortionMeasuredCB).toHaveBeenCalledTimes(1);

    expect(onMeasureStartCB).toHaveBeenLastCalledWith(0);
    expect(onPortionMeasuredCB).toHaveBeenLastCalledWith(0, 8, 20, 0, 320);
    expect(onMeasureEndCB).not.toHaveBeenCalled();

    expectOffsetToBeCalculatedUpToIndex(8);

    await wait();

    expect(onMeasureStartCB).toHaveBeenCalledTimes(1);
    expect(onPortionMeasuredCB).toHaveBeenCalledTimes(2);

    expect(onMeasureStartCB).toHaveBeenLastCalledWith(0);
    expect(onPortionMeasuredCB).toHaveBeenLastCalledWith(9, 17, 20, 320, 900);
    expect(onMeasureEndCB).not.toHaveBeenCalled();

    expectOffsetToBeCalculatedUpToIndex(17);

    await wait();

    expect(onMeasureStartCB).toHaveBeenCalledTimes(1);
    expect(onPortionMeasuredCB).toHaveBeenCalledTimes(3);
    expect(onMeasureEndCB).toHaveBeenCalledTimes(1);

    expect(onMeasureStartCB).toHaveBeenLastCalledWith(0);
    expect(onPortionMeasuredCB).toHaveBeenLastCalledWith(18, 19, 20, 900, 1040);
    expect(onMeasureEndCB).toHaveBeenLastCalledWith(19);

    expectOffsetToBeCalculatedUpToIndex(19);
  });

  test('maxMeasuredPortionSize option (equal to store size) and measurer hooks', async () => {
    const onMeasureStartCB = vi.fn();
    const onPortionMeasuredCB = vi.fn();
    const onMeasureEndCB = vi.fn();

    layout.detach();
    layout = new FixedListLayout({ maxMeasuredPortionSize: 20 });
    layout.attach(document.createElement('div'), eventBus, store);

    layout.onMeasureStart(range => onMeasureStartCB(range.startIndex));
    layout.onPortionMeasured(range => onPortionMeasuredCB(range.startIndex, range.endIndex, range.total, range.startOffset, range.endOffset));
    layout.onMeasureEnd(range => onMeasureEndCB(range.endIndex));

    itemsWithMargins.forEach((item, idx) => {
      store.insertAt(idx, item);
      eventBus.emit('onInsert', idx, item);
    });

    itemsWithoutMargins.forEach((item, idx) => {
      store.insertAt(idx, item);
      eventBus.emit('onInsert', idx, item);
    });

    expect(onMeasureStartCB).not.toHaveBeenCalled();
    expect(onPortionMeasuredCB).not.toHaveBeenCalled();
    expect(onMeasureEndCB).not.toHaveBeenCalled();

    await wait();

    expect(onMeasureStartCB).toHaveBeenCalledTimes(1);
    expect(onPortionMeasuredCB).toHaveBeenCalledTimes(1);
    expect(onMeasureEndCB).toHaveBeenCalledTimes(1);

    expect(onMeasureStartCB).toHaveBeenLastCalledWith(0);
    expect(onPortionMeasuredCB).toHaveBeenLastCalledWith(0, 19, 20, 0, 1040);
    expect(onMeasureEndCB).toHaveBeenLastCalledWith(19);

    expectOffsetToBeCalculatedUpToIndex(19);
  });

});