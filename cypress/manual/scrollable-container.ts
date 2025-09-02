import ScrollableContainer from "../../src/ScrollableContainer";

const nonVirtual = new URLSearchParams(window.location.search).get('nonVirtual');


const INITIAL_ITEMS_NUMBER = 23;
const itemsHeight = 40;
const container = document.createElement('div');

if (nonVirtual) {

  for (let i = 0; i < 1000; i++) {
    const item = createItem(i);
    container.append(item);
  }

  container.classList.add('class__ScrollableContainer');
}
else {
  const scrollableContainer = new ScrollableContainer(container);
  
  scrollableContainer.setScrollHeight(40000);
  
  for (let i = 0; i < INITIAL_ITEMS_NUMBER; i++) {
    const item = createItem(i);
    scrollableContainer.append(item);
  }

  let i = 0;
  scrollableContainer.onScrollDownOverscan((scrollTop, previousScrollTop, scrollLimit, offsetTop, padding, items, entry, notIntersectedEntries) => {
    console.log('onScrollDownOverscan', items.length);

    let addedItemsSize = 0;
    let removedItemsSize = 0;

    // const halfScrollLimit = scrollLimit / 2;
    const freeSpace = entry.rootBounds!.bottom - entry.boundingClientRect.bottom;
    // const scrollableContainerHeight = 300;
    // const exceededSpace = entry.rootBounds!.top - entry.boundingClientRect.top;

    // while (removedItemsSize < freeSpace) {
    //   const item = items.item(0) as HTMLElement;
    //   removedItemsSize += 40;
    //   item.remove();
    // }

    for (const entry of notIntersectedEntries) {
      removedItemsSize += entry.boundingClientRect.height;
      entry.target.remove();
    }

    while (addedItemsSize < freeSpace) {
      const item = createItem(i++);
      scrollableContainer.append(item);
      addedItemsSize += 40;
    }

    // console.log('scrolledPaneOffsetTop:', scrolledPaneOffsetTop, 'removedItemsSize:', removedItemsSize, 'addedItemsSize:', addedItemsSize, 'freeSpace', freeSpace, 'exceededSpace', exceededSpace);
    // scrollableContainer.scroll(scrollTop - halfScrollLimit - (halfScrollLimit - removedItemsSize)); // 40:130+8 50:200+46 60:270+86 
    // scrollableContainer.scroll(scrollTop - halfScrollLimit + removedItemsSize + (exceededSpace - removedItemsSize)); // 40:130+8 50:200+46 60:270+86 
    scrollableContainer.scroll(offsetTop + removedItemsSize - padding, removedItemsSize - addedItemsSize);
  });
  // 
  scrollableContainer.onScrollUpOverscan((scrollTop, previousScrollTop, scrollLimit, offsetTop, padding, items, entry, notIntersectedEntries) => {
    console.log('onScrollUpOverscan', items.length);

    let addedItemsSize = 0;
    let removedItemsSize = 0;

    // const halfScrollLimit = scrollLimit / 2;
    const freeSpace = entry.boundingClientRect.top - entry.rootBounds!.top;
    // const scrollableContainerHeight = 300;
    // const exceededSpace = entry.rootBounds!.top - entry.boundingClientRect.top;
    // console.log('freeSpace', freeSpace, 'exceeded space', exceededSpace)
    
    // while (removedItemsSize < freeSpace) {
    //   const item = items.item(items.length - 1) as HTMLElement;
    //   removedItemsSize += 40;
    //   item.remove();
    // }

    for (const entry of notIntersectedEntries) {
      removedItemsSize += entry.boundingClientRect.height;
      entry.target.remove();
    }

    while (addedItemsSize < freeSpace) {
      const item = createItem(i++);
      scrollableContainer.prepend(item);
      addedItemsSize += 40;
    }

    // console.log('scrolledPaneOffsetTop:', scrolledPaneOffsetTop, 'removedItemsSize:', removedItemsSize, 'addedItemsSize:', addedItemsSize, 'freeSpace', freeSpace, 'exceededSpace', exceededSpace);
    // scrollableContainer.scroll(scrollTop - halfScrollLimit - (halfScrollLimit - removedItemsSize)); // 40:130+8 50:200+46 60:270+86 
    // scrollableContainer.scroll(scrollTop - halfScrollLimit + removedItemsSize + (exceededSpace - removedItemsSize)); // 40:130+8 50:200+46 60:270+86 
    scrollableContainer.scroll(offsetTop - removedItemsSize - padding, removedItemsSize - addedItemsSize);
  });
  // 
  // scrollableContainer.onScrollDownOverflow((scrollTop, scrollLimit, items) => {
  //   console.log('onScrollDownOverflow');
  // });
  // 
  // scrollableContainer.onScrollUpOverflow((scrollTop, scrollLimit, items, entry) => {
  //   console.log('onScrollUpOverflow');
  //   
  //   let removedItemsSize = 0;
  //   const halfScrollLimit = scrollLimit / 2;
  //   const scrollableContainerHeight = 300;
  //   const exceededSpace = entry.boundingClientRect.height - (scrollableContainerHeight + entry.rootBounds!.height * 2);
  //  
  //   // while (removedItemsSize < exceededSpace) {
  //   //   const item = items.item(0) as HTMLElement;
  // 
  //   //   if (item) {
  //   //     removedItemsSize += item.offsetHeight;
  //   //     item.remove();
  //   //   }
  //   // }
  // 
  //   // scrollableContainer.scroll(scrollTop - halfScrollLimit - removedItemsSize); // 40:130+8 50:200+46 60:270+86 
  // });
  // 
  // // scrollableContainer.setOverscanHeight('300px');
  scrollableContainer.setOverscanHeight('100%');
}

document.body.appendChild(container);

function createItem(i: number) {
  const item = document.createElement('div');
  item.classList.add('list-item');
  item.style.height = `${itemsHeight}px`;
  item.textContent = `Item #${i}.`;
  return item;
}

