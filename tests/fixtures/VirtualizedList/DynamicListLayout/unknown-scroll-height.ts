import ScrollableContainer from '../../../../src/ScrollableContainer/ScrollableContainer.ts';
import EventBus from '../../../../src/EventBus/EventBus.ts';
import type { IEventMap } from '../../../../src/types/types.ts';

const container = document.createElement('div');
const scrollBtn = document.createElement('button');
const scrollIndicator = document.createElement('pre');
const eventBus = new EventBus<IEventMap>();
const scrollableContainer = new ScrollableContainer(container, eventBus);
const itemStore: HTMLElement[] = [];
const totalItems = 1000;

let minItemHeight = Infinity;
let maxItemHeight = 0;
let avgItemHeight = 0;

function createItem(content = '') {
  const item = document.createElement('div');
  const itemHeight = 30 * Math.random() + 20;

  minItemHeight = Math.min(minItemHeight, itemHeight);
  maxItemHeight = Math.max(maxItemHeight, itemHeight);
  avgItemHeight = (minItemHeight + maxItemHeight) / 2;

  item.style.height = `${itemHeight}px`;
  item.style.outline = '1px solid royalblue';
  item.textContent = content;

  return item;
}

container.style.width = '100px';
container.style.height = '150px';
container.style.position = 'relative';

for (let i = 0; i < totalItems; i++) {
  const item = createItem(`Item ${i}.`);
  scrollableContainer.appendItem(item);
  itemStore.push(item);
}

scrollableContainer.setScrollHeight(avgItemHeight * totalItems);

function findRenderedItemByIndex(index: number): HTMLElement {
  return itemStore[index];
}

let _scrollRatio = 0;
let _index = 0;

// The closer the item obtained by scrollTop to the list start, the closer it should be rendered to the visible viewport's top.
// The closer the item obtained by scrollTop to the list end, the closer it should be rendered to the visible viewport's bottom.
function updateContentPosition() {
  const { scrollTop, scrollHeight, clientHeight } = container;
  const scrollRatio = scrollTop / (scrollHeight - clientHeight) || 0;
  const lastIndex = totalItems - 1;
  const fractionalIndex = totalItems * scrollRatio;
  const index1 = Math.min(Math.floor(fractionalIndex), lastIndex);
  const index2 = Math.min(Math.ceil(fractionalIndex), lastIndex);
  const renderedItem1 = findRenderedItemByIndex(index1);
  const renderedItem2 = findRenderedItemByIndex(index2) || renderedItem1;
  const indexFraction = fractionalIndex - index1;

  _scrollRatio = scrollRatio;
  _index = index2;

  if (!renderedItem1) {
    console.error('Missing items for interpolation', index1, index2);
    return 0;
  };

  const itemTop1 = renderedItem1.offsetTop;
  const itemTop2 = renderedItem2.offsetTop;
  const itemHeight1 = renderedItem1.offsetHeight;
  const interpolatedHeight = indexFraction * (itemTop2 - itemTop1) || itemHeight1 * scrollRatio;
  const interpolatedTop = itemTop1 + interpolatedHeight;

  const viewportAnchor = clientHeight * scrollRatio;

  const position = interpolatedTop - viewportAnchor;

  scrollableContainer.updateContentPosition(position);

  return position;
}

let _previousContentPosition = 0;

eventBus.on('onScroll', (position) => {
  const contentPosition = updateContentPosition();
  scrollIndicator.textContent = `
    scrollTop: ${position.toFixed(2)};
    percentage: ${(_scrollRatio * 100).toFixed(2)};
    contentPosition: ${contentPosition.toFixed(2)};
    index: ${_index};
  `;

  if (contentPosition > _previousContentPosition) {
    console.log('DOWN', contentPosition - _previousContentPosition);
  }
  else if (contentPosition < _previousContentPosition) {
    console.log('UP', contentPosition - _previousContentPosition);
  }

  _previousContentPosition = contentPosition;
});

scrollBtn.textContent = 'Scroll to 95%';

scrollBtn.addEventListener('click', () => {
  const { scrollHeight, clientHeight } = container;
  const top = .95 * (scrollHeight - clientHeight);

  container.scroll({ top });
});

document.body.appendChild(container);
document.body.appendChild(scrollIndicator);
document.body.appendChild(scrollBtn);
