# virtualized-list
[![License][]](https://opensource.org/licenses/MIT)
[![Build Status]](https://github.com/itihon/virtualized-list/actions/workflows/code-quality-and-test.yml)
[![NPM Package]](https://npmjs.org/package/@itihon/virtualized-list)
[![Code Coverage]](https://codecov.io/gh/itihon/virtualized-list)
[![semantic-release]](https://github.com/semantic-release/semantic-release)

[License]: https://img.shields.io/badge/License-MIT-blue.svg
[Build Status]: https://github.com/itihon/virtualized-list/actions/workflows/code-quality-and-test.yml/badge.svg
[NPM Package]: https://img.shields.io/npm/v/@itihon/virtualized-list.svg
[Code Coverage]: https://codecov.io/gh/itihon/virtualized-list/branch/master/graph/badge.svg
[semantic-release]: https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg

Virtualized list web component. 

## 🕑 Developing...

## Install

``` shell
npm install @itihon/virtualized-list
```

## Use

``` typescript
import virtList from 'virtualized-list'
// TODO: describe usage
```

### In HTML

``` html
<script type="module" src="/path/to/virtualized-list.js"></script>

<virtualized-list>
  <div>item 1</div>
  <div>item 2</div>
  <div>item 3</div>
</virtualized-list>

```

### In JS or TS

#### Create an instance and add to DOM:

``` js
import VirtualizedList from "@itihon/virtualized-list";

const virtList = new VirtualizedList();

document.body.append(virtList);
```

#### or get a reference to an existing instance:

``` js
const virtList = document.getElementById('virtualized-list-1');
```

#### API 

```ts
class virtList extends HTMLElement {

}
```

#### Events

```ts 

```

```js
import virtList from "@itihon/virtualized-list";

const virtList = new virtList();

document.body.append(virtList);

virtList.addEventListener('statechange', event => {
  const { oldState, newState, kind } = event.detail;
  // ...
  // ...
});

```

## Related

TODO

## Acknowledgments

TODO


- [ ] Treat changing scroll direction the same as scroll stop. Get the last data, and clear the queue.

- [ ] VirtualizedList().length does not update since the insertItem() method is acynchronous

- [ ] Selection of invisible lines

## Bugs

- [ ] Buffers and ScrolledPane have different heights when the parent container has paddings