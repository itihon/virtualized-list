import { test, expect, type Page } from '@playwright/test';
import type ScrollableContainer from '../../../src/ScrollableContainer/ScrollableContainer';

const BASE_URL = 'http://localhost:5173/scrollable-container.html';
let page: Page;
const scrollHeight = 10000;

test.describe('Scrollable Container Behavior', () => {
  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.viewportContainer > .scrolledPane');

    await page.evaluate((scrollHeight) => {
      ((window as any).scrollableContainer as ScrollableContainer).setScrollHeight(scrollHeight);
    }, scrollHeight);
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('.viewportContainer stays put while scrolling', async () => {
    const scrollableContainer = page.locator('.scrollableContainer').first();
    const viewportContainer = page.locator('.viewportContainer').first();

    // make scrollable container an offsetParent for the viewport container
    await scrollableContainer.evaluate(
      (node) => node.style.position = 'relative'
    );

    let scScrollTop = await scrollableContainer.evaluate(
      (node) => node.scrollTop
    );

    let vcOffsetTop = await viewportContainer.evaluate(
      (node: HTMLElement) => node.offsetTop
    );

    expect(scScrollTop).toBe(0);
    expect(vcOffsetTop).toBe(0);

    await scrollableContainer.evaluate((node) => {
      node.scrollTo({ top: 5000 });
    });

    scScrollTop = await scrollableContainer.evaluate(
      (node) => node.scrollTop
    );

    vcOffsetTop = await viewportContainer.evaluate(
      (node: HTMLElement) => node.offsetTop
    );

    expect(Math.round(scScrollTop)).toBe(vcOffsetTop);
  });
});