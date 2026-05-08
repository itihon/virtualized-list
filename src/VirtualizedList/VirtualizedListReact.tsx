/**
 * @fileoverview VirtualizedList React component.
 * @license MIT
 * @author Alexandr Kalabin
 */

import React, { useRef, useLayoutEffect, useState, useEffect } from 'react';
import VirtualizedList from './VirtualizedList';
import ReactRenderer from '../Renderer/ReactRenderer';
import DynamicListLayout from '../Layout/DynamicListLayout';
import ArrayItemStore from '../ItemStore/ArrayItemStore';
import type { IItem } from '../types/types';

export interface VirtualizedListReactProps {
  overscanHeight?: number; 
  items: IItem<{ i: number }>[];
}

const VirtualizedListReact: React.FC<VirtualizedListReactProps> = ({ overscanHeight = 200, items }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollHeightFillerRef = useRef<HTMLDivElement>(null);
  const viewportContainerRef = useRef<HTMLDivElement>(null);
  const scrollCanvasRef = useRef<HTMLDivElement>(null);
  const topSpacerRef = useRef<HTMLDivElement>(null);
  const contentLayerRef = useRef<HTMLDivElement>(null);
  const bottomSpacerRef = useRef<HTMLDivElement>(null);
  const [listItems, setListItems] = useState<React.ReactNode[]>([]);
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
      itemsSetter: setListItems,
    });

    const store = new ArrayItemStore();
    const layout = new DynamicListLayout({ overscanHeight, renderer: renderer.current });
    const list = new VirtualizedList({ store, layout });

    for (let idx = 0; idx < items.length; idx++) {
      list.insert(items[idx], idx);
    }
  }, []);

  useEffect(() => {
    renderer.current?.commit();
  }, [listItems]);

  return (
    <div ref={containerRef} id="virtualized-list">
      <div ref={scrollHeightFillerRef}></div>
      <div ref={viewportContainerRef}>
        <div ref={scrollCanvasRef}>
          <div ref={topSpacerRef}></div>
          <div ref={contentLayerRef}>{ listItems }</div>
          <div ref={bottomSpacerRef}></div>
        </div>
      </div>
    </div>
  );
};

export default VirtualizedListReact;