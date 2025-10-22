import VirtualizedList, { type ListItem } from "../../src/VirtializedList2";
import '../../src/style.css';

// // --------- virtualized list test

// (() => {
//   const container = document.createElement('div');
//   container.style.cssText = `
//     display: flex;
//     flex-wrap: wrap;
//     width: 800px;
//     height: 600px;
//     border: 1px solid #ccc;
//     visibility: hidden;
//   `;
//   document.body.appendChild(container);
// 
//   const start = performance.now();
// 
//   for (let i = 0; i < 1000; i++) {
//     const el = document.createElement('div');
//     el.textContent = i;
//     el.style.cssText = `
//       width: 50px;
//       height: 20px;
//       margin: 2px;
//       background: hsl(${i % 360}, 70%, 70%);
//     `;
//     container.appendChild(el);
//   }
// 
//   // Force layout flush so browser actually performs reflow
//   container.offsetHeight;
// 
//   const end = performance.now();
//   console.log(`Regular document: ${(end - start).toFixed(2)} ms`);
// 
//   container.remove(); // cleanup
// })();


// (async () => {
//   const N = 10000;
// 
//   function makeStyles(i) {
//     return `
//       width: 50px;
//       height: 20px;
//       margin: 2px;
//       background: hsl(${i % 360}, 70%, 70%);
//     `;
//   }
// 
//   // Utility: create and fill a container
//   function fillContainer(doc, container, N) {
//     for (let i = 0; i < N; i++) {
//       const el = doc.createElement('div');
//       const icon = doc.createElement('img');
//       const text = doc.createElement('span');
//       const num = doc.createElement('span');
// 
//       text.textContent = 'Item ';
//       num.textContent = i;
// 
//       el.style.cssText = makeStyles(i);
// 
//       el.append(icon, text, num, '.');
//       container.appendChild(el);
//     }
//   }
// 
//   // Force layout flush to ensure browser performs layout work
//   function forceLayout(el) {
//     return el.offsetHeight;
//   }
// 
// 
//   // ========== 3️⃣ Hidden iframe ==========
//   const iframe = document.createElement('iframe');
//   iframe.style.cssText = 'position:absolute; width:0; height:0; visibility:hidden;';
//   document.body.appendChild(iframe);
//   const doc3 = iframe.contentDocument;
// 
//   const container3 = doc3.createElement('div');
//   container3.style.cssText = `
//     display: flex;
//     flex-wrap: wrap;
//     width: 800px;
//     height: 600px;
//     border: 1px solid #ccc;
//     visibility: hidden;
//   `;
//   doc3.body.appendChild(container3);
// 
//   const t5 = performance.now();
//   fillContainer(doc3, container3, N);
//   forceLayout(container3);
//   const t6 = performance.now();
//   const timeIframe = t6 - t5;
// 
//   // ========== 🧾 Results ==========
// 
//   document.body.append(`⚙️ DOM insertion benchmark (${N} elements):`);
//   document.body.append(`  Hidden iframe: ${timeIframe.toFixed(2)} ms`);
// 
// })();

type ItemData = {
  name: string;
  number: string;
}

const search = new URLSearchParams(location.search);
const itemsCount = parseInt(search.get('itemsCount') || '100');

const container = document.createElement('div');
const list = new VirtualizedList(container);

document.body.appendChild(container);
container.classList.add('virtualized-list');

const startTime = performance.now();
let insertionDone: Promise<void> = Promise.resolve();

function toHTMLElement(data: ItemData): HTMLElement {
  const item = document.createElement('div');
  const itemName = document.createElement('span');
  const itemNumber = document.createElement('span');

  itemName.textContent = data.name;
  itemNumber.textContent = `${data.number}`;
  item.append(itemName, itemNumber, '.');

  item.style.cssText = `
    display: flex;
    align-items: center;
    padding-left: 8px;
    height: 45px;
    border: 1px solid lightslategray;
    color: whitesmoke;
    background-color: #2e2e2e;
  `;

  return item;
}

function fromHTMLElement(item: HTMLElement): ItemData {
  const itemName = item.firstElementChild;
  const itemNumber = itemName?.nextElementSibling;

  if (!itemNumber) throw new Error('Item name and item number must be present.');

  return {
    name: itemName.textContent,
    number: itemNumber.textContent,
  };
}

for (let itemNum = 0; itemNum < itemsCount; itemNum++) {
  const itemData: ItemData = {
    name: 'Item ',
    number: itemNum.toString(),
  };

  const item: ListItem<ItemData> = {
    data: itemData,
    toHTMLElement,
    fromHTMLElement,
  };

  insertionDone = list.insertItem(item, itemNum);
  if (itemNum < 10) console.log(item.fromHTMLElement(item.toHTMLElement(item.data)))
}

let done = false;
insertionDone.then(() => {
  done = true;
  document.body.append(`Adding of ${Intl.NumberFormat('en-US').format(itemsCount)} items took ${Math.round((performance.now() - startTime) / 1000)} seconds.`);
});

let offsetY = 0;
const shiftVertically = () => {
  if (!done) {
    container.style.transform = `translateY(${offsetY++}px)`;
    requestAnimationFrame(shiftVertically);
  }
};

container.style.willChange = 'transform';

requestAnimationFrame(shiftVertically);