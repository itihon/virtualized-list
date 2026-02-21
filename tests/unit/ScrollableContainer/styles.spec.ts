import { test, expect, type Page } from '@playwright/test';

const BASE_URL = 'http://localhost:5173/scrollable-container.html';
let page: Page;

test.describe('Scrollable Container Styles', () => {
  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.viewportContainer > .scrolledPane');
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('.scrollableContainer has overflow-y: auto', async () => {
    const el = page.locator('.scrollableContainer').first();
    await expect(el).toBeVisible();
    const overflowY = await el.evaluate((node) =>
      getComputedStyle(node).overflowY
    );
    expect(overflowY).toBe('auto');
  });

  test('.scrollHeightFiller has correct styles', async () => {
    const el = page.locator('.scrollHeightFiller').first();
    await expect(el).toBeAttached();

    const styles = await el.evaluate((node) => {
      const cs = getComputedStyle(node);
      return {
        display: cs.display,
        position: cs.position,
        width: cs.width,
        minHeight: cs.minHeight,
        visibility: cs.visibility,
        float: cs.float,
      };
    });

    expect(styles.display).toBe('block');
    expect(styles.position).toBe('relative');
    expect(styles.width).toBe('0px');
    expect(styles.minHeight).toBe('100%');
    expect(styles.visibility).toBe('hidden');
    expect(styles.float).toBe('left');
  });

  test('.viewportContainer has correct styles', async () => {
    const el = page.locator('.viewportContainer').first();
    await expect(el).toBeAttached();

    const styles = await el.evaluate((node) => {
      const cs = getComputedStyle(node);
      return {
        display: cs.display,
        position: cs.position,
        width: cs.width,
        height: cs.height,
        overflow: cs.overflow,
      };
    });

    expect(styles.display).toBe('block');
    expect(styles.position).toBe('sticky');
    // width and height should be 100% of parent — check they are non-zero and equal parent dimensions
    const parentDimensions = await el.evaluate((node) => {
      const parent = node.parentElement;
      if (!parent) return null;
      const pcs = getComputedStyle(parent);
      return { width: pcs.width, height: pcs.height };
    });

    if (parentDimensions) {
      expect(styles.width).toBe(parentDimensions.width);
      expect(styles.height).toBe(parentDimensions.height);
    }

    expect(styles.overflow).toBe('hidden');
  });

  test('.scrolledPane has correct styles', async () => {
    const el = page.locator('.scrolledPane').first();
    await expect(el).toBeAttached();

    const styles = await el.evaluate((node) => {
      const cs = getComputedStyle(node);
      return {
        display: cs.display,
        position: cs.position,
        width: cs.width,
        minHeight: cs.minHeight,
      };
    });

    expect(styles.display).toBe('block');
    expect(styles.position).toBe('absolute');

    // width should equal 100% of parent
    const parentWidth = await el.evaluate((node) => {
      const parent = node.parentElement;
      if (!parent) return null;
      return getComputedStyle(parent).width;
    });

    if (parentWidth) {
      expect(styles.width).toBe(parentWidth);
    }

    expect(styles.minHeight).toBe('100%');
  });
});