import { test, expect, type Page } from '@playwright/test';
import type ScrollableContainer from '../../../src/ScrollableContainer/ScrollableContainer';

const BASE_URL = 'http://localhost:5173/scrollable-container.html';
let page: Page;
const scrollHeight = 10101;

test.describe('Scrollable Container Methods', () => {
  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.viewportContainer > .contentLayer');
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('setScrollHeight() method', async () => {
    const scrollableContainer = page.locator('.scrollableContainer').first();
    const scrollHeightFiller = page.locator('.scrollHeightFiller').first();
    const contentLayer = page.locator('.contentLayer').first();

    await page.evaluate((scrollHeight) => {
      ((window as any).scrollableContainer as ScrollableContainer).setScrollHeight(scrollHeight);
    }, scrollHeight);

    const scHeight = await scrollableContainer.evaluate(
      (node) => getComputedStyle(node).height
    );

    const scScrollHeight = await scrollableContainer.evaluate(
      (node) => node.scrollHeight
    );

    const shfHeight = await scrollHeightFiller.evaluate(
      (node) => getComputedStyle(node).height
    );

    const clHeight = await contentLayer.evaluate(
      (node) => getComputedStyle(node).height
    );

    expect(scScrollHeight - parseInt(scHeight)).toBe(9951);
    expect(shfHeight).toBe(`${scrollHeight}px`);
    expect(clHeight).toBe(`${scrollHeight}px`);
  });

  test('updateContentPosition() moves content layer correctly', async () => {
    const contentLayer = page.locator('.contentLayer').first();
    const container = page.locator('.scrollableContainer').first();
    const scrollHeight = await container.evaluate(node => node.scrollHeight);
    const containerTop = await container.evaluate(node => node.getBoundingClientRect().top);

    const updateContentPosition = async (offset: number) => {
      await ((window as any).scrollableContainer as ScrollableContainer).updateContentPosition(offset);
    };

    // scroll halfway
    await page.evaluate(updateContentPosition, scrollHeight / 2);
    const halfTop = await contentLayer.evaluate(node => node.getBoundingClientRect().top);
    expect(halfTop).toBe(-((scrollHeight / 2) - containerTop));

    // scroll to end
    await page.evaluate(updateContentPosition, scrollHeight);
    const endTop = await contentLayer.evaluate(node => node.getBoundingClientRect().top);
    expect(endTop).toBe(-(scrollHeight - containerTop));

    // scroll back to start
    await page.evaluate(updateContentPosition, 0);
    const startTop = await contentLayer.evaluate(node => node.getBoundingClientRect().top);
    expect(startTop).toBe(containerTop);
  });

  test('getContentPosition() returns correct value', async () => {
    const updateContentPosition = async (offset: number) => {
      await ((window as any).scrollableContainer as ScrollableContainer).updateContentPosition(offset);
    };

    const getContentPosition = async () => ((window as any).scrollableContainer as ScrollableContainer).getContentPostion();

    await page.evaluate(updateContentPosition, 100);
    expect(await page.evaluate(getContentPosition)).toBe(100);
  });

  test('clear() method deletes all elements from content layer', async () => {
    const contentLayer = page.locator('.contentLayer').first();

    const childCountBefore = await contentLayer.evaluate((node) => node.children.length);

    await page.evaluate(() => {
      ((window as any).scrollableContainer as ScrollableContainer).clear();
    });

    const childCountAfter = await contentLayer.evaluate((node) => node.children.length);

    expect(childCountBefore).toBeGreaterThan(0);
    expect(childCountAfter).toBe(0);
  });
});