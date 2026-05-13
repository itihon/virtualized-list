/**
 * @fileoverview VirtualizedList Vue component.
 * @license MIT
 * @author Alexandr Kalabin
 */

<script setup lang="ts" generic="T">
import { type Ref } from 'vue';
import { onMounted, onUpdated, ref, useSlots } from 'vue';
import VirtualizedList from './VirtualizedList';
import VueRenderer, { type ListItemProps } from '../Renderer/VueRenderer';
import DynamicListLayout from '../Layout/DynamicListLayout';
import ArrayItemStore from '../ItemStore/ArrayItemStore';

export interface VirtualizedListVueProps<T> {
  scrollerRef?: Ref<HTMLDivElement>;
  overscanHeight?: number; 
  data: T[];
}

// const slots = defineSlots<{ renderItem(props: ListItemProps<T>): any; }>();
const props = defineProps<VirtualizedListVueProps<T>>();
const { overscanHeight = 200, data, scrollerRef } = props;
const containerRef = scrollerRef || ref<HTMLDivElement>();
const scrollHeightFillerRef = ref<HTMLDivElement>();
const viewportContainerRef = ref<HTMLDivElement>();
const scrollCanvasRef = ref<HTMLDivElement>();
const topSpacerRef = ref<HTMLDivElement>();
const contentLayerRef = ref<HTMLDivElement>();
const bottomSpacerRef = ref<HTMLDivElement>();
const visibleItems = ref<ListItemProps<T>[]>();
const renderedRangeRefPool = new Map<number, Ref<HTMLElement | undefined>>();
// const renderer = ref<VueRenderer | undefined>();
let renderer: VueRenderer<T> | undefined;
const setVisibleItems = (items: ListItemProps<T>[]) => { console.log('setVisibleItems:', items); visibleItems.value = items; };
const getRef = (index: number) => renderedRangeRefPool.get(index) || renderedRangeRefPool.set(index, ref()).get(index);

// It is not necessary to keep render function per item, remove it later !!!
const ListItem = useSlots().item;

onMounted(() => {
  // renderer.value = new VueRenderer({
  renderer = new VueRenderer({
    container: containerRef.value!,
    scrollHeightFiller: scrollHeightFillerRef.value!,
    viewportContainer: viewportContainerRef.value!,
    scrollCanvas: scrollCanvasRef.value!,
    topSpacer: topSpacerRef.value!,
    contentLayer: contentLayerRef.value!,
    bottomSpacer: bottomSpacerRef.value!,
    itemsSetter: setVisibleItems,
  });

  const store = new ArrayItemStore();
  const layout = new DynamicListLayout({ overscanHeight, renderer });
  const list = new VirtualizedList({ store, layout });

  for (let idx = 0; idx < data.length; idx++) {
    list.insert({ data: data[idx], render: ListItem }, idx);
  }
});

onUpdated(() => {
  renderer?.commit(renderedRangeRefPool);
});

</script>

<template>
  <Teleport v-if="scrollerRef" to="scrollerRef">
    <div ref="scrollHeightFillerRef"></div>
    <div ref="viewportContainerRef">
      <div ref="scrollCanvasRef">
        <div ref="topSpacerRef"></div>
        <div ref="contentLayerRef">
          <template v-for="item in visibleItems" :key="item.index" >
            <slot name="renderItem" :data="item.data" :index="item.index" :elRef="getRef(item.index)" />
          </template>
        </div>
        <div ref="bottomSpacerRef"></div>
      </div>
    </div>
  </Teleport>

  <div v-else ref="containerRef">
    <div ref="scrollHeightFillerRef"></div>
    <div ref="viewportContainerRef">
      <div ref="scrollCanvasRef">
        <div ref="topSpacerRef"></div>
        <div ref="contentLayerRef">
          <template v-for="item in visibleItems" :key="item.index" >
            <slot name="renderItem" :data="item.data" :index="item.index" :elRef="getRef(item.index)" />
          </template>
        </div>
        <div ref="bottomSpacerRef"></div>
      </div>
    </div>
  </div>
</template>

