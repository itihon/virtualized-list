/**
 * @fileoverview VirtualizedList React component.
 * @license MIT
 * @author Alexandr Kalabin
 */

import React, { useRef, useLayoutEffect, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import VirtualizedList from './VirtualizedList';
import ReactRenderer from '../Renderer/ReactRenderer';
import DynamicListLayout from '../Layout/DynamicListLayout';
import ArrayItemStore from '../ItemStore/ArrayItemStore';

export interface ListItemProps<T = unknown> {
  data: T;
  ref: React.Ref<HTMLDivElement> | undefined;
  index: number;
}

export interface VirtualizedListReactProps<T> {
  scrollerRef?: React.RefObject<HTMLDivElement>;
  overscanHeight?: number; 
  data: T[];
  renderItem: (props: ListItemProps<T>) => React.ReactNode;
}

export default function VirtualizedListReact<T>(props: VirtualizedListReactProps<T>) {
  const { overscanHeight = 200, data, renderItem, scrollerRef } = props;
  const containerRef = scrollerRef || useRef<HTMLDivElement>(null);
  const scrollHeightFillerRef = useRef<HTMLDivElement>(null);
  const viewportContainerRef = useRef<HTMLDivElement>(null);
  const scrollCanvasRef = useRef<HTMLDivElement>(null);
  const topSpacerRef = useRef<HTMLDivElement>(null);
  const contentLayerRef = useRef<HTMLDivElement>(null);
  const bottomSpacerRef = useRef<HTMLDivElement>(null);
  const [visibleItems, setVisibleItems] = useState<React.ReactNode[]>([]);
  const renderer = useRef<ReactRenderer | undefined>(undefined);

  useLayoutEffect(() => {
    renderer.current = new ReactRenderer({
      container: containerRef.current!,
      scrollHeightFiller: scrollHeightFillerRef.current!,
      viewportContainer: viewportContainerRef.current!,
      scrollCanvas: scrollCanvasRef.current!,
      topSpacer: topSpacerRef.current!,
      contentLayer: contentLayerRef.current!,
      bottomSpacer: bottomSpacerRef.current!,
      itemsSetter: setVisibleItems,
    });

    const store = new ArrayItemStore();
    const layout = new DynamicListLayout({ overscanHeight, renderer: renderer.current });
    const list = new VirtualizedList({ store, layout });

    for (let idx = 0; idx < data.length; idx++) {
      list.insert({ data: data[idx], render: renderItem }, idx);
    }
  }, []);

  useEffect(() => {
    renderer.current?.commit();
  }, [visibleItems]);

  const scrollerContent = <>
    <div ref={scrollHeightFillerRef}></div>
    <div ref={viewportContainerRef}>
      <div ref={scrollCanvasRef}>
        <div ref={topSpacerRef}></div>
        <div ref={contentLayerRef}>{ visibleItems }</div>
        <div ref={bottomSpacerRef}></div>
      </div>
    </div>
  </>;

  return (
    scrollerRef && scrollerRef.current 
      ? createPortal(scrollerContent, scrollerRef.current)
      : <div ref={containerRef}>{ scrollerContent }</div>
  );
};
