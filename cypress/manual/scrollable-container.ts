import ScrollableContainer from "../../src/ScrollableContainer";

const nonVirtual = new URLSearchParams(window.location.search).get('nonVirtual');


const INITIAL_ITEMS_NUMBER = 22;
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
    scrollableContainer.appendItem(item);
  }

  let itemNum = 0;
  scrollableContainer.onScrollDownOverscan(() => {
    console.log('onScrollDownOverscan');

    // let addedItemsSize = 0;
    // let removedItemsSize = 0;

    // const halfScrollLimit = scrollLimit / 2;
    // const freeSpace = entry.rootBounds!.bottom - entry.boundingClientRect.bottom;
    // const overscanRowCount = 10;
    // const scrollableContainerHeight = 300;
    // const exceededSpace = entry.rootBounds!.top - entry.boundingClientRect.top;

    // while (removedItemsSize < freeSpace) {
    //   const item = items.item(0) as HTMLElement;
    //   removedItemsSize += 40;
    //   item.remove();
    // }


    // for (const entry of notIntersectedEntries) {
    //   // removedItemsSize += entry.boundingClientRect.height;
    //   entry.target.remove();
    // }

    // while (addedItemsSize < freeSpace) {
    // for (let i = 0; i < overscanRowCount; i++) {
    //   const item = createItem(itemNum++);
    //   scrollableContainer.append(item);
    //   // addedItemsSize += 40;
    // }

    // console.log('scrolledPaneOffsetTop:', scrolledPaneOffsetTop, 'removedItemsSize:', removedItemsSize, 'addedItemsSize:', addedItemsSize, 'freeSpace', freeSpace, 'exceededSpace', exceededSpace);
    // scrollableContainer.scroll(scrollTop - halfScrollLimit - (halfScrollLimit - removedItemsSize)); // 40:130+8 50:200+46 60:270+86 
    // scrollableContainer.scroll(scrollTop - halfScrollLimit + removedItemsSize + (exceededSpace - removedItemsSize)); // 40:130+8 50:200+46 60:270+86 
    // scrollableContainer.scroll(offsetTop + removedItemsSize - padding,  addedItemsSize - removedItemsSize);
  });
  // 
  scrollableContainer.onScrollDownScrollLimit(() => {
    console.warn('onScrollDownScrollLimit');
  });

  scrollableContainer.onScrollUpScrollLimit(() => {
    console.warn('onScrollUpScrollLimit');
  });

  scrollableContainer.onScrollUpOverscan(() => {
    console.log('onScrollUpOverscan');

    // let addedItemsSize = 0;
    // let removedItemsSize = 0;

    // const halfScrollLimit = scrollLimit / 2;
    // const freeSpace = entry.boundingClientRect.top - entry.rootBounds!.top;
    // const overscanRowCount = 10;
    // const scrollableContainerHeight = 300;
    // const exceededSpace = entry.rootBounds!.top - entry.boundingClientRect.top;
    // console.log('freeSpace', freeSpace, 'exceeded space', exceededSpace)
    
    // while (removedItemsSize < freeSpace) {
    //   const item = items.item(items.length - 1) as HTMLElement;
    //   removedItemsSize += 40;
    //   item.remove();
    // }

    // for (const entry of notIntersectedEntries) {
    //   // removedItemsSize += entry.boundingClientRect.height;
    //   entry.target.remove();
    // }

    // while (addedItemsSize < freeSpace) {
    // for (let i = 0; i < overscanRowCount; i++) {
    //   const item = createItem(itemNum++);
    //   scrollableContainer.prepend(item);
    //   // addedItemsSize += 40;
    // }

    // console.log('scrolledPaneOffsetTop:', scrolledPaneOffsetTop, 'removedItemsSize:', removedItemsSize, 'addedItemsSize:', addedItemsSize, 'freeSpace', freeSpace, 'exceededSpace', exceededSpace);
    // scrollableContainer.scroll(scrollTop - halfScrollLimit - (halfScrollLimit - removedItemsSize)); // 40:130+8 50:200+46 60:270+86 
    // scrollableContainer.scroll(scrollTop - halfScrollLimit + removedItemsSize + (exceededSpace - removedItemsSize)); // 40:130+8 50:200+46 60:270+86 
    // scrollableContainer.scroll(offsetTop - removedItemsSize - padding,  addedItemsSize - removedItemsSize);
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

  scrollableContainer.onScrollDownEmptyBuffer((buffer) => {
    console.log('scroll down empty buffer');

    const overscanRowCount = 10;

    for (let i = 0; i < overscanRowCount; i++) {
      const item = createItem(itemNum++);
      buffer.appendItem(item);
    }
  });
  
  scrollableContainer.onScrollUpEmptyBuffer((buffer) => {
    console.log('scroll up empty buffer');

    const overscanRowCount = 10;

    for (let i = 0; i < overscanRowCount; i++) {
      const item = createItem(itemNum++);
      buffer.appendItem(item);
    }
  });

  scrollableContainer.onScrollDownReadBuffer((buffer) => {
    console.log('scroll down read buffer');

    const overscanRowCount = 10;

    for (let i = 0; i < overscanRowCount; i++) {
      const item = createItem(itemNum++);
      buffer.appendItem(item);
    }
  });
  
  scrollableContainer.onScrollUpReadBuffer((buffer) => {
    console.log('scroll up read buffer');

    const overscanRowCount = 10;

    for (let i = 0; i < overscanRowCount; i++) {
      const item = createItem(itemNum++);
      buffer.appendItem(item);
    }
  });
}


document.body.appendChild(container);

function createItem(i: number) {
  const item = document.createElement('div');
  item.classList.add('list-item');
  item.style.height = `${itemsHeight}px`;
  item.textContent = `Item #${i}.`;
  return item;
}


// fillers' both height should be equal to scrollHeight

setTimeout(() => {
const fillers = document.querySelectorAll('.class__Filler:not(.Filler__ScrollHeight)');
const fillerTop = fillers[0] as HTMLElement;
const fillerBottom = fillers[1] as HTMLElement;
const scrollHeightFiller = document.querySelector('.Filler__ScrollHeight') as HTMLElement;

let scrollTop = 0;
let previousScrollTop = 0;
let isScrollingDown = false;
let isScrollingUp = false;

const setScrollDirection = () => {
  scrollTop = container.scrollTop;

  if (scrollTop > previousScrollTop) {
    isScrollingDown = true;
    isScrollingUp = false;
  }
  else if (scrollTop < previousScrollTop) {
    isScrollingDown = false;
    isScrollingUp = true;
  }
  else {
    isScrollingDown = false;
    isScrollingUp = false;
  }
};

const checkScrollDirection = () => {
  const currentScrollTop = container.scrollTop;

  console.assert(
    (currentScrollTop > previousScrollTop) === isScrollingDown,
    'scroll direction must not change on frame duration.',
    'currentScrollTop:', currentScrollTop,
    'previousScrollTop:', previousScrollTop,
    'isScrollingDown:', isScrollingDown, 
  );

  console.assert(
    (currentScrollTop < previousScrollTop) === isScrollingUp,
    'scroll direction must not change on frame duration.',
    'currentScrollTop:', currentScrollTop,
    'previousScrollTop:', previousScrollTop,
    'isScrollingUp:', isScrollingUp, 
  );

  console.assert(
    scrollTop === currentScrollTop,
    'scrollTop value must not change on frame duration.',
    'scrollTop:', scrollTop,
    'currentScrollTop:', currentScrollTop,
  );

  previousScrollTop = currentScrollTop;
  isScrollingDown = false;
  isScrollingUp = false;
};

const checkScrollHeight = () => {
  const containerStyle = getComputedStyle(container);
  const containerPaddingTop = parseFloat(containerStyle.paddingTop);
  const containerPaddingBottom = parseFloat(containerStyle.paddingBottom);
  const containerScrollHeight = container.scrollHeight;
  const scrollHeight = scrollHeightFiller.offsetHeight + containerPaddingTop + containerPaddingBottom;

  console.assert(
    containerScrollHeight === scrollHeight,
    'container scrollHeight should be equal to filler height plus paddings.',
    'container scrollHeight:', containerScrollHeight,
    'paddingTop:', containerPaddingTop,
    'paddingBottom:', containerPaddingBottom,
    'scrollHeight filler:', scrollHeightFiller.offsetHeight,
    'scrollHeight:', scrollHeight,
  );
};

const checkFillersHeight = () => {
  const fillerTopHeight = fillerTop.offsetHeight;
  const fillerBottomHeight = fillerBottom.offsetHeight;
  const scrollHeight = scrollHeightFiller.offsetHeight;

  const fillersHeight = fillerTopHeight + fillerBottomHeight;
  const isFillersHeightEqScrollHeight = fillersHeight === scrollHeight;

  console.assert(
    isFillersHeightEqScrollHeight, 
    'fillers height should be equal to scrollHeight.',
    'top filler height:', fillerTopHeight,
    'bottom filler height:', fillerBottomHeight,
    'both fillers height:', fillersHeight,
    'scroll height', scrollHeight,
  );
};

const runPostPaintTests = (entries: IntersectionObserverEntry[], observer: IntersectionObserver) => {
  checkFillersHeight();
  checkScrollHeight();
  checkScrollDirection();

  observer.disconnect();
};

const postPaintTestsObserver = new IntersectionObserver(runPostPaintTests);

container.addEventListener('scroll', () => {
  postPaintTestsObserver.disconnect();
  postPaintTestsObserver.observe(container);
  setScrollDirection();
});
}, 1000);