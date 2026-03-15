import VirtualizedList from '../../../src/VirtualizedList/VirtualizedList';
import FixedListLayout from '../../../src/Layout/FixedListLayout';
import ArrayItemStore from '../../../src/ItemStore/ArrayItemStore';

function render(data: { i: number } | unknown) {
  const item = document.createElement('div');
  item.textContent = `Item ${(data as { i: number }).i}.`
  return item;
}

const store = new ArrayItemStore();
const layout = new FixedListLayout({ overscanHeight: 100 });
const container = document.createElement('div');
container.style.width = '200px';
container.style.height = '300px';
container.style.overflow = 'auto';

document.body.appendChild(container);
const list = new VirtualizedList({ layout, store, container });

for (let i = 0; i < 1000; i++) {
  list.insert({
    data: { i: i },
    render,
    height: 40,
  }, i);
}