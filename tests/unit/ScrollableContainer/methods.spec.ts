import { test, expect, type Page } from '@playwright/test';
import type ScrollableContainer from '../../../src/ScrollableContainer/ScrollableContainer';

const BASE_URL = 'http://localhost:5173/scrollable-container.html';
let page: Page;
const scrollHeight = 10101;

test.describe('Scrollable Container Methods', () => {
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

  test('setScrollHeight() method', async () => {
    const scrollHeightFiller = page.locator('.scrollHeightFiller').first();
    const scrolledPane = page.locator('.scrolledPane').first();

    const shfHeight = await scrollHeightFiller.evaluate(
      (node) => getComputedStyle(node).height
    );

    const spHeight = await scrolledPane.evaluate(
      (node) => getComputedStyle(node).height
    );

    expect(shfHeight).toBe(`${scrollHeight}px`);
    expect(spHeight).toBe(`${scrollHeight}px`);
  });
});