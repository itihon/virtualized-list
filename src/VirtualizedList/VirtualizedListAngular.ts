/**
 * @fileoverview VirtualizedList Angular component.
 * @license MIT
 * @author Alexandr Kalabin
 */

import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  ContentChild,
  ElementRef,
  Input,
  QueryList,
  TemplateRef,
  ViewChild,
  ViewChildren,
  inject,
} from '@angular/core';
import type { AfterViewInit } from '@angular/core';
import type { IItem, IRangeRenderer } from '../types/types';
import VirtualizedList from './VirtualizedList';
import AngularRenderer, {
  type ListItemProps,
} from '../Renderer/AngularRenderer';
import DynamicListLayout from '../Layout/DynamicListLayout';
import ArrayItemStore from '../ItemStore/ArrayItemStore';

export type VirtualizedListItemContext<T> = ListItemProps<T> & {
  $implicit: T;
};

@Component({
  selector: 'virtualized-list-angular',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div #container>
      <div #scrollHeightFiller></div>
      <div #viewportContainer>
        <div #scrollCanvas>
          <div #topSpacer></div>
          <div #contentLayer>
            <ng-container
              *ngFor="let item of visibleItems; trackBy: trackByIndex"
            >
              <div #itemElement [attr.data-index]="item.index">
                <ng-container
                  *ngTemplateOutlet="
                    renderItemTemplate;
                    context: getItemContext(item)
                  "
                ></ng-container>
              </div>
            </ng-container>
          </div>
          <div #bottomSpacer></div>
        </div>
      </div>
    </div>
  `,
})
export class VirtualizedListAngular<T> implements AfterViewInit {
  @Input({ required: true }) data: T[] = [];
  @Input() overscanHeight = 200;

  @ContentChild('renderItem', { read: TemplateRef })
  renderItemTemplate!: TemplateRef<VirtualizedListItemContext<T>>;

  @ViewChild('container', { static: true })
  private containerRef!: ElementRef<HTMLDivElement>;
  @ViewChild('scrollHeightFiller', { static: true })
  private scrollHeightFillerRef!: ElementRef<HTMLDivElement>;
  @ViewChild('viewportContainer', { static: true })
  private viewportContainerRef!: ElementRef<HTMLDivElement>;
  @ViewChild('scrollCanvas', { static: true })
  private scrollCanvasRef!: ElementRef<HTMLDivElement>;
  @ViewChild('topSpacer', { static: true })
  private topSpacerRef!: ElementRef<HTMLDivElement>;
  @ViewChild('contentLayer', { static: true })
  private contentLayerRef!: ElementRef<HTMLDivElement>;
  @ViewChild('bottomSpacer', { static: true })
  private bottomSpacerRef!: ElementRef<HTMLDivElement>;
  @ViewChildren('itemElement', { read: ElementRef })
  private itemRefs!: QueryList<ElementRef<HTMLElement>>;

  visibleItems: ListItemProps<T>[] = [];
  private renderer: AngularRenderer<T> | undefined;
  private readonly changeDetectorRef = inject(ChangeDetectorRef);

  ngAfterViewInit() {
    this.renderer = new AngularRenderer<T>({
      container: this.containerRef.nativeElement,
      scrollHeightFiller: this.scrollHeightFillerRef.nativeElement,
      viewportContainer: this.viewportContainerRef.nativeElement,
      scrollCanvas: this.scrollCanvasRef.nativeElement,
      topSpacer: this.topSpacerRef.nativeElement,
      contentLayer: this.contentLayerRef.nativeElement,
      bottomSpacer: this.bottomSpacerRef.nativeElement,
      itemsSetter: this.setVisibleItems,
      itemsFlusher: this.flushVisibleItems,
    });

    const store = new ArrayItemStore();
    const layout = new DynamicListLayout({
      overscanHeight: this.overscanHeight,
      renderer: this.renderer as unknown as IRangeRenderer,
    });
    const list = new VirtualizedList({
      store,
      layout,
    } as unknown as ConstructorParameters<typeof VirtualizedList>[0]);

    for (let idx = 0; idx < this.data.length; idx++) {
      list.insert(
        {
          data: this.data[idx]!,
          render: this.renderItemTemplate as unknown as (
            data: unknown,
          ) => HTMLElement,
        } as IItem,
        idx,
      );
    }
  }

  trackByIndex(_position: number, item: ListItemProps<T>) {
    return item.index;
  }

  getItemContext(item: ListItemProps<T>): VirtualizedListItemContext<T> {
    return {
      $implicit: item.data,
      data: item.data,
      index: item.index,
    };
  }

  private setVisibleItems = (items: ListItemProps<T>[]) => {
    this.visibleItems = items;
  };

  private flushVisibleItems = () => {
    this.changeDetectorRef.detectChanges();
    this.commit();
  };

  private commit() {
    const renderedRefs = new Map<number, Element>();

    this.itemRefs.forEach((itemRef, position) => {
      const item = this.visibleItems[position];

      if (item) {
        renderedRefs.set(item.index, itemRef.nativeElement);
      }
    });

    this.renderer?.commit(renderedRefs);
  }
}
