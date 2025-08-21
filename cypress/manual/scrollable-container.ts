import ScrollableContainer from "../../src/ScrollableContainer";

const INITIAL_ITEMS_NUMBER = 10;
const container = document.createElement('div');
const scrollableContainer = new ScrollableContainer(container);

document.body.appendChild(container);
scrollableContainer.setScrollHeight(20000);

function createItem(i: number) {
  const item = document.createElement('div');
  item.classList.add('list-item');
  item.style.height = '40px';
  item.textContent = `Item #${i}.`;
  return item;
}

// for (let i = 0; i < INITIAL_ITEMS_NUMBER; i++) {
//   const item = createItem(i);
//   scrollableContainer.append(item);
// }
// 
// let i = 0;
// scrollableContainer.onScrollDownLimit((scrolledPane, scrollTop) => {
//   scrolledPane.firstElementChild!.remove();
//   scrolledPane.firstElementChild!.remove();
//   const item1 = createItem(i++);
//   const item2 = createItem(i++);
//   scrollableContainer.append(item1);
//   scrollableContainer.append(item2);
// });
// 

scrollableContainer.onScrollDownLimit((scrolledPane, scrollTop) => {
  scrollableContainer.scroll(scrollTop - 80);
});

scrollableContainer.onScrollUpLimit((scrolledPane, scrollTop) => {
  scrollableContainer.scroll(scrollTop - 80);
});