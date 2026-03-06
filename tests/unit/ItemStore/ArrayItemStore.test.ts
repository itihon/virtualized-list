import {describe, expect, test} from 'vitest';
import ArrayItemStore from '../../../src/ItemStore/ArrayItemStore';
import type { IItem } from '../../../src/types/types';

// mock render function
const render = () => ({} as HTMLElement);

describe('ArrayItemStore', () => {
  test('insertAt() inserts and links items', () => {
    const itemStore = new ArrayItemStore<IItem>();

    // insert in order
    itemStore.insertAt(0, { data: '0', render });
    itemStore.insertAt(1, { data: '1', render });
    itemStore.insertAt(2, { data: '2', render });

    // [0, 1, 2]
    expect(itemStore.size).toBe(3);
    expect(itemStore.getByIndex(0)?.data).toBe('0');
    expect(itemStore.getByIndex(1)?.data).toBe('1');
    expect(itemStore.getByIndex(2)?.data).toBe('2');

    expect(itemStore.getPrevious(itemStore.getByIndex(0)!)).toBe(undefined);
    expect(itemStore.getNext(itemStore.getByIndex(0)!)).toBe(itemStore.getByIndex(1));
    expect(itemStore.getPrevious(itemStore.getByIndex(1)!)).toBe(itemStore.getByIndex(0));
    expect(itemStore.getNext(itemStore.getByIndex(1)!)).toBe(itemStore.getByIndex(2));
    expect(itemStore.getPrevious(itemStore.getByIndex(2)!)).toBe(itemStore.getByIndex(1));
    expect(itemStore.getNext(itemStore.getByIndex(2)!)).toBe(undefined);

    // insert at index < 0
    itemStore.insertAt(-2, { data: '-2', render });
    itemStore.insertAt(-1, { data: '-1', render });

    // [-1, -2, 0, 1, 2]
    expect(itemStore.size).toBe(5);
    expect(itemStore.getByIndex(0)?.data).toBe('-1');
    expect(itemStore.getByIndex(1)?.data).toBe('-2');
    expect(itemStore.getByIndex(2)?.data).toBe('0');

    expect(itemStore.getPrevious(itemStore.getByIndex(0)!)).toBe(undefined);
    expect(itemStore.getNext(itemStore.getByIndex(0)!)).toBe(itemStore.getByIndex(1));
    expect(itemStore.getPrevious(itemStore.getByIndex(1)!)).toBe(itemStore.getByIndex(0));
    expect(itemStore.getNext(itemStore.getByIndex(1)!)).toBe(itemStore.getByIndex(2));
    expect(itemStore.getPrevious(itemStore.getByIndex(2)!)).toBe(itemStore.getByIndex(1));
    expect(itemStore.getNext(itemStore.getByIndex(2)!)).toBe(itemStore.getByIndex(3));

    // insert in the beginning
    itemStore.insertAt(0, { data: '0', render });

    // [0, -1, -2, 0, 1, 2]
    expect(itemStore.size).toBe(6);
    expect(itemStore.getByIndex(0)?.data).toBe('0');
    expect(itemStore.getByIndex(1)?.data).toBe('-1');
    expect(itemStore.getByIndex(2)?.data).toBe('-2');

    expect(itemStore.getPrevious(itemStore.getByIndex(0)!)).toBe(undefined);
    expect(itemStore.getNext(itemStore.getByIndex(0)!)).toBe(itemStore.getByIndex(1));
    expect(itemStore.getPrevious(itemStore.getByIndex(1)!)).toBe(itemStore.getByIndex(0));
    expect(itemStore.getNext(itemStore.getByIndex(1)!)).toBe(itemStore.getByIndex(2));

    // insert in the middle
    itemStore.insertAt(2, { data: '2', render });

    // [0, -1,  2, -2, 0, 1, 2]
    expect(itemStore.size).toBe(7);
    expect(itemStore.getByIndex(1)?.data).toBe('-1');
    expect(itemStore.getByIndex(2)?.data).toBe('2');
    expect(itemStore.getByIndex(3)?.data).toBe('-2');

    expect(itemStore.getNext(itemStore.getByIndex(1)!)).toBe(itemStore.getByIndex(2));
    expect(itemStore.getPrevious(itemStore.getByIndex(2)!)).toBe(itemStore.getByIndex(1));
    expect(itemStore.getNext(itemStore.getByIndex(2)!)).toBe(itemStore.getByIndex(3));
    expect(itemStore.getPrevious(itemStore.getByIndex(3)!)).toBe(itemStore.getByIndex(2));

    // insert in the end
    itemStore.insertAt(6, { data: '6', render });

    // [0, -1,  2, -2, 0, 1, 6, 2]
    expect(itemStore.size).toBe(8);
    expect(itemStore.getByIndex(5)?.data).toBe('1');
    expect(itemStore.getByIndex(6)?.data).toBe('6');
    expect(itemStore.getByIndex(7)?.data).toBe('2');

    expect(itemStore.getNext(itemStore.getByIndex(5)!)).toBe(itemStore.getByIndex(6));
    expect(itemStore.getPrevious(itemStore.getByIndex(6)!)).toBe(itemStore.getByIndex(5));
    expect(itemStore.getNext(itemStore.getByIndex(6)!)).toBe(itemStore.getByIndex(7));
    expect(itemStore.getPrevious(itemStore.getByIndex(7)!)).toBe(itemStore.getByIndex(6));
    expect(itemStore.getNext(itemStore.getByIndex(7)!)).toBe(undefined);

    // insert at index > size
    itemStore.insertAt(8, { data: '8', render });
    itemStore.insertAt(9, { data: '9', render });

    // [0, -1,  2, -2, 0, 1, 6, 2, 8, 9]
    expect(itemStore.size).toBe(10);
    expect(itemStore.getByIndex(7)?.data).toBe('2');
    expect(itemStore.getByIndex(8)?.data).toBe('8');
    expect(itemStore.getByIndex(9)?.data).toBe('9');

    expect(itemStore.getNext(itemStore.getByIndex(7)!)).toBe(itemStore.getByIndex(8));
    expect(itemStore.getPrevious(itemStore.getByIndex(8)!)).toBe(itemStore.getByIndex(7));
    expect(itemStore.getNext(itemStore.getByIndex(8)!)).toBe(itemStore.getByIndex(9));
    expect(itemStore.getPrevious(itemStore.getByIndex(9)!)).toBe(itemStore.getByIndex(8));
    expect(itemStore.getNext(itemStore.getByIndex(9)!)).toBe(undefined);
  });

  test('deleteAt() deletes and unlinks items', () => {
    const itemStore = new ArrayItemStore<IItem>();

    // [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
    Array
      .from({ length: 10 }, (_, idx) => ({ data: idx.toString(), render }))
      .forEach((item, idx) => itemStore.insertAt(idx, item));

    // delete at index < 0
    itemStore.deleteAt(-2);
    itemStore.deleteAt(-1);

    // [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
    expect(itemStore.size).toBe(10);
    expect(itemStore.getByIndex(0)?.data).toBe('0');
    expect(itemStore.getByIndex(1)?.data).toBe('1');
    expect(itemStore.getByIndex(2)?.data).toBe('2');

    // delete in the beginning
    itemStore.deleteAt(0);

    // [1, 2, 3, 4, 5, 6, 7, 8, 9]
    expect(itemStore.size).toBe(9);
    expect(itemStore.getByIndex(0)?.data).toBe('1');
    expect(itemStore.getByIndex(1)?.data).toBe('2');
    expect(itemStore.getByIndex(2)?.data).toBe('3');

    expect(itemStore.getPrevious(itemStore.getByIndex(0)!)).toBe(undefined);
    expect(itemStore.getNext(itemStore.getByIndex(0)!)).toBe(itemStore.getByIndex(1));
    expect(itemStore.getPrevious(itemStore.getByIndex(1)!)).toBe(itemStore.getByIndex(0));

    // delete in the middle
    itemStore.deleteAt(2);

    // [1, 2, 4, 5, 6, 7, 8, 9]
    expect(itemStore.size).toBe(8);
    expect(itemStore.getByIndex(1)?.data).toBe('2');
    expect(itemStore.getByIndex(2)?.data).toBe('4');
    expect(itemStore.getByIndex(3)?.data).toBe('5');

    expect(itemStore.getNext(itemStore.getByIndex(1)!)).toBe(itemStore.getByIndex(2));
    expect(itemStore.getPrevious(itemStore.getByIndex(2)!)).toBe(itemStore.getByIndex(1));

    // delete in the end
    itemStore.deleteAt(7);

    // [1, 2, 4, 5, 6, 7, 8]
    expect(itemStore.size).toBe(7);
    expect(itemStore.getByIndex(4)?.data).toBe('6');
    expect(itemStore.getByIndex(5)?.data).toBe('7');
    expect(itemStore.getByIndex(6)?.data).toBe('8');

    expect(itemStore.getNext(itemStore.getByIndex(5)!)).toBe(itemStore.getByIndex(6));
    expect(itemStore.getPrevious(itemStore.getByIndex(6)!)).toBe(itemStore.getByIndex(5));
    expect(itemStore.getNext(itemStore.getByIndex(6)!)).toBe(undefined);

    // delete at index > size
    itemStore.deleteAt(8);
    itemStore.deleteAt(9);

    // [1, 2, 4, 5, 6, 7, 8]
    expect(itemStore.size).toBe(7);
    expect(itemStore.getByIndex(4)?.data).toBe('6');
    expect(itemStore.getByIndex(5)?.data).toBe('7');
    expect(itemStore.getByIndex(6)?.data).toBe('8');

    // delete from already empty store
    itemStore.deleteAt(0);
    itemStore.deleteAt(0);
    itemStore.deleteAt(0);
    itemStore.deleteAt(0);
    itemStore.deleteAt(0);
    itemStore.deleteAt(0);
    itemStore.deleteAt(0);

    // []
    expect(itemStore.size).toBe(0);

    itemStore.deleteAt(3);
    itemStore.deleteAt(0);

    expect(itemStore.size).toBe(0);
    expect(itemStore.getByIndex(0)?.data).toBe(undefined);
    expect(itemStore.getByIndex(1)?.data).toBe(undefined);
    expect(itemStore.getByIndex(2)?.data).toBe(undefined);
  });

  test('getByOffset() retreives the closest item by offset', () => {
    const itemStore = new ArrayItemStore<IItem>();

    Array 
      .from({ length: 10 }, (_, idx) => ({ offsetTop: idx * 10, data: idx, render }))
      .forEach((item, idx) => itemStore.insertAt(idx, item));

    expect(itemStore.getByOffset(99)?.data).toBe(9);
    expect(itemStore.getByOffset(99)?.offsetTop).toBe(90);

    expect(itemStore.getByOffset(90)?.data).toBe(9);
    expect(itemStore.getByOffset(90)?.offsetTop).toBe(90);

    expect(itemStore.getByOffset(89)?.data).toBe(8);
    expect(itemStore.getByOffset(89)?.offsetTop).toBe(80);

    expect(itemStore.getByOffset(80)?.data).toBe(8);
    expect(itemStore.getByOffset(80)?.offsetTop).toBe(80);

    expect(itemStore.getByOffset(79)?.data).toBe(7);
    expect(itemStore.getByOffset(79)?.offsetTop).toBe(70);

    expect(itemStore.getByOffset(70)?.data).toBe(7);
    expect(itemStore.getByOffset(70)?.offsetTop).toBe(70);

    expect(itemStore.getByOffset(69)?.data).toBe(6);
    expect(itemStore.getByOffset(69)?.offsetTop).toBe(60);

    expect(itemStore.getByOffset(60)?.data).toBe(6);
    expect(itemStore.getByOffset(60)?.offsetTop).toBe(60);

    expect(itemStore.getByOffset(59)?.data).toBe(5);
    expect(itemStore.getByOffset(59)?.offsetTop).toBe(50);

    expect(itemStore.getByOffset(50)?.data).toBe(5);
    expect(itemStore.getByOffset(50)?.offsetTop).toBe(50);

    expect(itemStore.getByOffset(49)?.data).toBe(4);
    expect(itemStore.getByOffset(49)?.offsetTop).toBe(40);

    expect(itemStore.getByOffset(40)?.data).toBe(4);
    expect(itemStore.getByOffset(40)?.offsetTop).toBe(40);

    expect(itemStore.getByOffset(39)?.data).toBe(3);
    expect(itemStore.getByOffset(39)?.offsetTop).toBe(30);

    expect(itemStore.getByOffset(30)?.data).toBe(3);
    expect(itemStore.getByOffset(30)?.offsetTop).toBe(30);

    expect(itemStore.getByOffset(29)?.data).toBe(2);
    expect(itemStore.getByOffset(29)?.offsetTop).toBe(20);

    expect(itemStore.getByOffset(20)?.data).toBe(2);
    expect(itemStore.getByOffset(20)?.offsetTop).toBe(20);

    expect(itemStore.getByOffset(19)?.data).toBe(1);
    expect(itemStore.getByOffset(19)?.offsetTop).toBe(10);

    expect(itemStore.getByOffset(10)?.data).toBe(1);
    expect(itemStore.getByOffset(10)?.offsetTop).toBe(10);

    expect(itemStore.getByOffset(9)?.data).toBe(0);
    expect(itemStore.getByOffset(9)?.offsetTop).toBe(0);

    expect(itemStore.getByOffset(0)?.data).toBe(0);
    expect(itemStore.getByOffset(0)?.offsetTop).toBe(0);

    expect(itemStore.getByOffset(-9)?.data).toBe(0);
    expect(itemStore.getByOffset(-9)?.offsetTop).toBe(0);
  });
});