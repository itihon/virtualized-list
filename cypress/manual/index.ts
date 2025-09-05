import VirtualizedList from "../../src/VirtializedList2";
import '../../src/style.css';

// --------- virtualized list test

const search = new URLSearchParams(location.search);
const itemsCount = parseInt(search.get('itemsCount') || '100');

const insertionPromises: Array<Promise<number | null>> = [];
const container = document.createElement('div');
const list = new VirtualizedList(container);

document.body.appendChild(container);
container.classList.add('virtualized-list');

for (let i = 0; i < itemsCount; i++) {
  const item = document.createElement('div');
  item.textContent = `Item ${i}.`;
  insertionPromises.push(list.insertItem(item, i));
}

