import VirtualizedList from '../../../../src/VirtualizedList/VirtualizedList';
import DynamicListLayout from '../../../../src/Layout/DynamicListLayout';
import ArrayItemStore from '../../../../src/ItemStore/ArrayItemStore';

const auto = new URLSearchParams(window.location.search).get('auto');
const itemsCount = Number(new URLSearchParams(window.location.search).get('itemsCount')) || 1000;

function render(data: { i: number } | unknown) {
  const item = document.createElement('div');
  const { i } = (data as { i: number });

  item.classList.add('list-item');
  item.id = `item-${i}`;
  item.textContent = `Item ${i}.`

  if (i % 2 === 0) {
    const div2 = document.createElement('div');
    div2.textContent = 'Second line.';
    item.appendChild(div2);
  }
  else if (i % 3 === 0) {
    const div2 = document.createElement('div');
    div2.textContent = 'Second line.';
    item.appendChild(div2);

    const div3 = document.createElement('div');
    div3.textContent = 'Third line.';
    item.appendChild(div3);
  }
  else if (i % 5 === 0) {
    const div2 = document.createElement('div');
    div2.textContent = 'Second line.';
    item.appendChild(div2);

    const div3 = document.createElement('div');
    div3.textContent = 'Third line.';
    item.appendChild(div3);

    const div4 = document.createElement('div');
    div4.textContent = 'Fourth line.';
    item.appendChild(div4);
  }

  return item;
}

const container = document.createElement('div');
const store = new ArrayItemStore();
const layout = new DynamicListLayout({ overscanHeight: 100, container });
const list = new VirtualizedList({ layout, store });

container.id = 'virtualized-list';
container.style.width = '200px';
container.style.height = '300px';
container.style.overflow = 'auto';

document.body.appendChild(container);

for (let i = 0; i < itemsCount; i++) {
  list.insert({
    data: { i: i },
    render,
  }, i);
}

// ------------- Test conditions for manual testing and Playwright -------------------

const assignTestConditions = (container: HTMLElement) => {
  const contentLayer = container.querySelector('.contentLayer')!;
  const overscanHeight = 100;

  const contentLayerIsNotEmpty = () => {
    if (contentLayer.children.length === 0) {
      throw new Error('Content layer is empty.');
    }
  }

  const renderedRangeFullyIntersectsVisibleRange: IntersectionObserverCallback = (entries) => {
    const { top, bottom, rootBoundsTop, rootBoundsBottom } = entries.reduce((acc, entry) => {
      const { top, bottom } = entry.boundingClientRect;
      const scaleFactor = container.clientHeight / entry.rootBounds!.height; // WebKit gives unscaled coordinates of rootBounds

      acc.top = Math.min(acc.top, top);
      acc.bottom = Math.max(acc.bottom, bottom);
      acc.rootBoundsTop = entry.rootBounds!.top * scaleFactor + 1;
      acc.rootBoundsBottom = entry.rootBounds!.bottom * scaleFactor - 1;

      return acc;
    }, { top: 0, bottom: 0, rootBoundsTop: 0, rootBoundsBottom: 0 });

    if (!((top <= rootBoundsTop) && (bottom >= rootBoundsBottom))) {
      throw new Error(`
        Rendered range has to fully intersect visible range.
        top: ${top};
        rootBoundsTop: ${rootBoundsTop};
        bottom: ${bottom};
        rootBoundsBottom: ${rootBoundsBottom};
        `);
    }
  };

  const renderedItemsAreConsecutive = (items: HTMLCollection) => {
    [...items].reduce((curr, next) => {
      const currItemIdx = parseInt(curr.id.split('-')[1]);
      const nextItemIdx = parseInt(next.id.split('-')[1]);

      if (nextItemIdx - currItemIdx !== 1) {
        console.log('scrollTop:', container.scrollTop);
        console.log(JSON.stringify([...items].map(item => item.id), undefined, 3))
        throw new Error(`Rendered items must be consecutive. ${curr.id} - ${next.id}`);
      }
      return next;
    });
  };

  const renderedItemsHeightIsInRange: IntersectionObserverCallback = (entries) => {
    const { top, bottom, itemHeight } = entries.reduce((acc, entry) => {
      const { top, bottom, height } = entry.boundingClientRect;

      acc.top = Math.min(acc.top, top);
      acc.bottom = Math.max(acc.bottom, bottom);
      acc.itemHeight = Math.max(acc.itemHeight, height);

      return acc;
    }, { top: 0, bottom: 0, itemHeight: 0 });

    const renderedItemsHeight = bottom - top;

    if (
      renderedItemsHeight > (container.clientHeight + overscanHeight) * 2
        || renderedItemsHeight < container.clientHeight
    ) {
      throw new Error(`
        Rendered items' height should not be greater than (viewport height + overscan height) * 2 and smaller than viewport height.
        Rendered items height: ${renderedItemsHeight}.
        Viewport height: ${container.clientHeight}.
        Overscan height: ${overscanHeight}.
        Item height: ${itemHeight}.
      `);
    }
  };

  let previousScrollTop = 0;

  const firstAndLasItemsAreRenderedAtStartAndEnd = () => {
    const { scrollTop, scrollHeight, clientHeight } = container;
    const isScrollingDown = scrollTop > previousScrollTop;
    const isScrollingUp = scrollTop < previousScrollTop;

    previousScrollTop = scrollTop;

    if (isScrollingUp && scrollTop < overscanHeight) {
      const firstElementIdx = contentLayer.firstElementChild!.id.split('-')[1];

      if (firstElementIdx !== '0') {
        throw new Error(`First rendered item index must be 0. Received: ${firstElementIdx}. scrollTop: ${scrollTop}.`);
      }
    } 
    else if (isScrollingDown && scrollTop > (scrollHeight - clientHeight) - overscanHeight) {
      const lastElementIdx = contentLayer.lastElementChild!.id.split('-')[1];

      if (lastElementIdx !== '999') {
        throw new Error(`Last rendered item index must be 999. Received: ${lastElementIdx}. scrollTop: ${scrollTop}.`);
      }
    }
  };

  const renderedItemsCorrespondToScrollTop = () => {
    const { scrollTop, clientHeight } = container;
    const itemHeight = 40;
    const renderedItems = contentLayer.children;
    const itemsScrolledUp = Math.floor(scrollTop / itemHeight);
    const visibleItemsCount = Math.ceil(clientHeight / itemHeight) + 1;

    for (let item of renderedItems) {
      const itemIdx = Number(item.id.split('-')[1]);
      
      if (itemIdx === itemsScrolledUp) {
        let currentItem: Element | null = item;
        for (let visibleItemIdx = 0; visibleItemIdx < visibleItemsCount && currentItem; visibleItemIdx++) {
          if (Number(currentItem.id.split('-')[1]) !== itemIdx + visibleItemIdx) {
            throw new Error(`Visible items must correspond to scrollTop. Rendered items: ${[...renderedItems].map(item => item.id)}`);
          }
          currentItem = currentItem.nextElementSibling;
        }
      }
    }
  };

  const scheduleScrollTest = () => {
    scrollObserver.disconnect();
    Array.prototype.forEach.call(
      contentLayer.children, 
      (item) => scrollObserver.observe(item),
    );
  };

  const scrollObserver = new IntersectionObserver((entries, observer) => {
    // filter out unmounted elements
    const filteredEntries = entries.filter(entry => (entry.target as HTMLElement).offsetParent !== null);

    contentLayerIsNotEmpty();
    renderedRangeFullyIntersectsVisibleRange(filteredEntries, observer);
    renderedItemsAreConsecutive(contentLayer.children);
    renderedItemsHeightIsInRange(filteredEntries, observer);
    renderedItemsCorrespondToScrollTop();

    scheduleScrollTest();
  }, { root: container });

  const renderedItemsObserver = new MutationObserver((mutations) => {
    for (let mutation of mutations) {
      if (mutation.addedNodes.length) {
        if (!auto) firstAndLasItemsAreRenderedAtStartAndEnd();
        return;
      }
    }
  });

  renderedItemsObserver.observe(contentLayer, { childList: true });

  container.addEventListener('scroll', scheduleScrollTest);

  // signals to Playwright when conditions are set
  container.classList.add('test-conditions-set');
};

addEventListener('DOMContentLoaded', () => {
  const ignoreTests = new URLSearchParams(window.location.search).get('ignoreTests');

  if (ignoreTests) {
    console.warn('Tests are being ignored.');
    return;
  }

  setTimeout(() => {
    assignTestConditions(container);

    if (!auto) {
      /**
       * some conditions to be checked in manual mode
       */
      const positions1 = [
        { top: 248.19512939453125 },
        { top: 164.42276000976562 },
        { top: 81.17073059082031 },
        { top: 0 },
      ];

      const scroll = (container: HTMLElement, scrollOptions: ScrollToOptions[]) => new Promise<void>(resolve => {
        const positions = scrollOptions.slice();
        let timeout: NodeJS.Timeout;

        function animateScroll() {
          const position = positions.shift();

          if (position) {
            container.scroll(position);
            requestAnimationFrame(animateScroll);
          }
          else {
            clearTimeout(timeout);
            timeout = setTimeout(resolve, 64);
          }
        }

        requestAnimationFrame(animateScroll);
      });

      scroll(container, positions1);
    }
  }, 1000)
});

