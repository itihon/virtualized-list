import '@angular/compiler';
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { VirtualizedListAngular } from '../../../../src/VirtualizedList/VirtualizedListAngular';

const itemsCount = Number(new URLSearchParams(window.location.search).get('itemsCount')) || 1000;

type Data = { i: number };

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, VirtualizedListAngular],
  template: `
    <virtualized-list-angular [data]="data" [overscanHeight]="100">
      <ng-template #renderItem let-data="data" let-index="index">
        <div class="list-item" [id]="'item-' + data.i" [attr.data-index]="index">
          Item {{ data.i }}.
          <div *ngFor="let text of extraLines(data.i)">{{ text }}</div>
        </div>
      </ng-template>
    </virtualized-list-angular>
  `,
})
class AppComponent {
  data = Array.from({ length: itemsCount }, (_, i): Data => ({ i }));

  extraLines(i: number) {
    return i % 5 === 0
      ? ['Second line.', 'Third line.', 'Fourth line.']
      : i % 3 === 0
        ? ['Second line.', 'Third line.']
        : i % 2 === 0
          ? ['Second line.']
          : [];
  }
}

bootstrapApplication(AppComponent).catch((error: unknown) => {
  console.error(error);
});
