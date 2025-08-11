import VirtualizedList from "../../src";
import Prism from 'prismjs';
import './prism.css';

Promise.all([
  fetch('https://unpkg.com/@itihon/position-observer@latest/dist/esm/index.js'),
  fetch('https://unpkg.com/isomorphic-validation@latest/dist/esm/index.js'),
])
.then(arr => Promise.all(arr.map(res => res.text())).then(arr => arr.join('')))
.then(code => {
  const codeHtml = Prism.highlight(code, Prism.languages.javascript, 'javascript');
  const list = new VirtualizedList();

  document.querySelector('#code')?.appendChild?.(list);
  list.style.width = '100vw';
  list.style.height = '100vh';

  const lines = codeHtml.split('\n');

  for (let [idx, line] of lines.entries()) {
    const item = document.createElement('div');

    item.dataset.line = String(idx + 1);
    item.classList.add('language-js');
    item.innerHTML = line;
    list.insertItem(item);
  }
});