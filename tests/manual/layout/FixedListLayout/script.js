const container = document.querySelector('#container');

function createItemWithMargin() {
  const divWithMargin = document.createElement('div');
  divWithMargin.classList.add('with-margin');
  return divWithMargin;
}

function createItemWithoutMargin() {
  const divWithoutMargin = document.createElement('div');
  divWithoutMargin.classList.add('without-margin');
  return divWithoutMargin;
}

for(let i = 0; i < 10; i++) {
  container.appendChild(createItemWithoutMargin());
}

for(let i = 0; i < 10; i++) {
  container.appendChild(createItemWithMargin());
}

container.children[4].insertAdjacentElement('beforebegin', createItemWithMargin());
container.children[14].insertAdjacentElement('beforebegin', createItemWithoutMargin());

container.children[6].remove();
container.children[16].remove();

const calculatedOffsets = [];

[...container.children].forEach((div, idx) => {
  div.textContent = `index: ${idx}, offset: ${div.offsetTop}`;
  calculatedOffsets.push(div.offsetTop);
});

const pre = document.createElement('pre');
document.body.appendChild(pre);

pre.append(`
  const combinedOffsets = {
    ${calculatedOffsets.map(offset => `{ calculatedOffset: ${offset} },`).join('\n')}
  };
`)