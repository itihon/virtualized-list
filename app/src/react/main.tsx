import { createRoot } from 'react-dom/client';
import VirtualizedListReact, { type ListItemProps } from 'react-layout-virtual';

const itemsCount = Number(new URLSearchParams(window.location.search).get('itemsCount')) || 1000;

type Data = { i: number };

function ListItem({ data, ref, index }: ListItemProps<Data>) {
  const i = data.i;

  const extraLines =
    i % 5 === 0 ? ['Second line.', 'Third line.', 'Fourth line.'] :
    i % 3 === 0 ? ['Second line.', 'Third line.'] :
    i % 2 === 0 ? ['Second line.'] :
    [];

  return (
    <div ref={ref} className="list-item" id={`item-${i}`} data-index={index}>
      {`Item ${i}.`}
      {extraLines.map((text, idx) => <div key={idx}>{text}</div>)}
    </div>
  );
};

function App() {
  const data = Array.from({ length: itemsCount }, (_, i) => ({ i }));

  return (
    <VirtualizedListReact<Data> overscanHeight={100} data={data} renderItem={ListItem} />
  );
}

const root = createRoot(document.getElementById('app')!);
root.render(<App />);