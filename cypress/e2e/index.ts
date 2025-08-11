import VirtualizedList from "../../src";

// --------- virtualized list test

const search = new URLSearchParams(location.search);
const itemsCount = parseInt(search.get('itemsCount') || '100');

const insertionPromises: Array<Promise<number | null>> = [];
const list = new VirtualizedList();
document.body.appendChild(list); // !!! in the current implementation must be mounted before inserting items

for (let i = 0; i < itemsCount; i++) {
  const item = document.createElement('div');
  item.textContent = `Item ${i}.`;
  insertionPromises.push(list.insertItem(item, i));
}


Promise.all(insertionPromises).then(results => {
  console.log(results);
  console.log(list.length)
})