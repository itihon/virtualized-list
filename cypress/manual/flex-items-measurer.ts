import FlexItemsMeasurer from '../../src/FlexItemsMeasurer';
import '../../src/ScrollableContainer.css';

const search = new URLSearchParams(location.search);
const itemsCount = parseInt(search.get('itemsCount') || '100');

const container = document.createElement('div');
document.body.appendChild(container);
const fim = new FlexItemsMeasurer(container);

fim.offsetWidth = 200;
fim.offsetHeight = 300;
fim.setPortionSize(30);


fim.onPortionMeasured((flexRowsAcc) => {
  console.log('on portion measured', flexRowsAcc.rows.map(row => row.map(entry => entry.target.textContent)));
  console.log('first item:', fim.getFirstItem(), 'last item:', fim.getLastItem());
});

for (let i = 0; i < itemsCount; i++) {
  const item = document.createElement('div');
  item.textContent = `Item ${i}.`;
  fim.appendItem(item);
  fim.measure();
}


