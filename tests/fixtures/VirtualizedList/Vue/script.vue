<script setup lang="ts">
import VirtualizedListVue from '../../../../src/VirtualizedList/VirtualizedListVue.vue';

const auto = new URLSearchParams(window.location.search).get('auto');
const itemsCount = Number(new URLSearchParams(window.location.search).get('itemsCount')) || 1000;
const container = document.createElement('div');

// container.id = 'virtualized-list';
// container.style.width = '200px';
// container.style.height = '300px';
// container.style.overflow = 'auto';
// document.body.appendChild(container);

type Data = { i: number };

const data = Array.from({ length: itemsCount }, (_, i): Data => ({ i }));

function extraLines(i: number) {
  return i % 5 === 0 ? ['Second line.', 'Third line.', 'Fourth line.'] :
         i % 3 === 0 ? ['Second line.', 'Third line.'] :
         i % 2 === 0 ? ['Second line.'] :
         [];
}

</script>

<template>
  <VirtualizedListVue :data="data" :overscan-height="100">
    <template #renderItem="{ data, index, elRef }">
      <div :ref="elRef" class="list-item" :id="`item-${data.i}`" :data-index="index">
        Item {{ data.i }}.
        <div v-for="(text, idx) in extraLines(data.i)" :key="idx">{{ text }}</div>
      </div>
    </template>
  </VirtualizedListVue>
</template>
