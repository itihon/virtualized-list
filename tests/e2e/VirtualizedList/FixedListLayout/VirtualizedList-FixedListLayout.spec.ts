import { test, expect } from '@playwright/test';

  /**
   *  Conditions to be checked in each test case:
   *  + first rendered item never appears lower than the heigher viewport boundary 
   *  + last rendered item never appears heigher than the lower viewport boundary 
   *  + indeces of the rendered items are consecutive
   *  + total rendered items' height never exceeds viewport height plus two overscan heights
   *  + (optional) content layer is not empty
   *  + rendered items correspond to scrollTop
   *
   *  Additional conditions to be checked in specific test cases: 
   * 
   *    Checking overscan height:
   *    - total rendered items' height depends on overscan heights and viewport height (resizing)
   * 
   *    Scrolled to start:
   *    + items are rendered starting from the very first index 
   * 
   *    Scrolled to end:
   *    + items are rendered ending with the very last index 
   * 
   *  Test cases:
   *  + Slow scroll (incremental strategy) from/to start/middle/end.
   *  + Fast scroll (jump strategy) from/to start/middle/end.
   *  + Transition from slow to fast scroll at start/middle/end.
   *  + Transition from fast to slow scroll at start/middle/end.
   */

const fromStartSlow = [
 { top: 0 },
 { top: 0.5203251838684082 },
 { top: 2.601625919342041 },
 { top: 5.72357702255249 },
 { top: 9.886178970336914 },
 { top: 15.089430809020996 },
 { top: 21.33333396911621 },
 { top: 27.05691146850586 },
 { top: 31.739837646484375 },
 { top: 35.90243911743164 },
 { top: 38.504066467285156 },
 { top: 39.544715881347656 },
 { top: 40.065040588378906 },
 { top: 53.5934944152832 },
 { top: 66.60162353515625 },
 { top: 80.13008117675781 },
 { top: 93.13821411132812 },
 { top: 106.66666412353516 },
 { top: 120.19512176513672 },
 { top: 133.2032470703125 },
 { top: 146.73170471191406 },
 { top: 160.26016235351562 },
 { top: 173.26829528808594 },
 { top: 186.7967529296875 },
 { top: 199.80487060546875 },
 { top: 213.3333282470703 },
 { top: 226.86178588867188 },
 { top: 239.8699188232422 },
 { top: 253.39837646484375 },
 { top: 266.92681884765625 },
 { top: 279.9349670410156 },
 { top: 293.4634094238281 },
 { top: 306.4715576171875 },
 { top: 320 },
];

const toStartSlow = fromStartSlow.slice().reverse();

const fromStartFaster = [
 { top: 0 },
 { top: 17.691057205200195 },
 { top: 73.36585235595703 },
 { top: 152.97561645507812 },
 { top: 223.21951293945312 },
 { top: 258.60162353515625 },
 { top: 262.243896484375 },
 { top: 349.6585388183594 },
 { top: 437.07318115234375 },
 { top: 526.0487670898438 },
 { top: 613.4634399414062 },
 { top: 700.8780517578125 },
 { top: 788.2926635742188 },
 { top: 875.7073364257812 },
 { top: 963.1219482421875 },
 { top: 1050.53662109375 },
 { top: 1137.951171875 },
 { top: 1225.3658447265625 },
 { top: 1312.780517578125 },
 { top: 1400.195068359375 },
 { top: 1487.6097412109375 },
 { top: 1575.0244140625 },
 { top: 1662.43896484375 },
 { top: 1749.8536376953125 },
 { top: 1837.268310546875 },
];

const toStartFaster = fromStartFaster.slice().reverse();

const fromStartFast = [
  { top: 0 },
  { top: 81.17073059082031 },
  { top: 164.42276000976562 },
  { top: 415.2195129394531 },
  { top: 582.243896484375 },
  { top: 833.0406494140625 },
  { top: 1167.6097412109375 },
  { top: 1585.430908203125 },
  { top: 1836.2276611328125 },
  { top: 2254.048828125 },
  { top: 2671.869873046875 },
  { top: 3173.46337890625 },
  { top: 3591.28466796875 },
  { top: 4092.8779296875 },
  { top: 4761.49609375 },
  { top: 5513.36572265625 },
  { top: 6181.98388671875 },
  { top: 7268.94287109375 },
  { top: 8522.40625 },
  { top: 9692.6181640625 },
  { top: 10612.0322265625 },
];

const toStartFast = fromStartFast.slice().reverse();

const fromEndSlow = [
  { top: 39699.7734375 },
  { top: 39699.25390625 },
  { top: 39697.171875 },
  { top: 39693.52734375 },
  { top: 39688.84375 },
  { top: 39683.12109375 },
  { top: 39676.87890625 },
  { top: 39671.15625 },
  { top: 39666.47265625 },
  { top: 39662.828125 },
  { top: 39660.74609375 },
  { top: 39659.70703125 },
  { top: 39646.69921875 },
  { top: 39633.171875 },
  { top: 39619.640625 },
  { top: 39606.6328125 },
  { top: 39593.10546875 },
  { top: 39579.578125 },
  { top: 39566.5703125 },
  { top: 39553.0390625 },
  { top: 39539.51171875 },
  { top: 39526.50390625 },
  { top: 39512.9765625 },
  { top: 39499.96875 },
  { top: 39486.4375 },
  { top: 39472.91015625 },
  { top: 39459.90234375 },
  { top: 39446.375 },
];

const toEndSlow = fromEndSlow.slice().reverse();

const fromEndFaster = [
  { top: 39699.7734375 },
  { top: 39680 },
  { top: 39619.12109375 },
  { top: 39529.10546875 },
  { top: 39463.0234375 },
  { top: 39438.046875 },
  { top: 39437.52734375 },
  { top: 39350.11328125 },
  { top: 39262.69921875 },
  { top: 39175.28515625 },
  { top: 39087.87109375 },
  { top: 39000.45703125 },
  { top: 38913.0390625 },
  { top: 38825.625 },
  { top: 38738.2109375 },
  { top: 38650.796875 },
  { top: 38563.3828125 },
  { top: 38475.96875 },
  { top: 38388.5546875 },
  { top: 38301.13671875 },
  { top: 38213.72265625 },
  { top: 38126.30859375 },
  { top: 38038.89453125 },
  { top: 37951.48046875 },
  { top: 37864.06640625 },
];

const toEndFaster = fromEndFaster.slice().reverse();

const fromEndFast = [
  { top: 39699.7734375 },
  { top: 39697.171875 },
  { top: 39530.14453125 },
  { top: 38944.78125 },
  { top: 38192.91015625 },
  { top: 37273.49609375 },
  { top: 35936.26171875 },
  { top: 34013.66015625 },
  { top: 31589.984375 },
  { top: 29333.333984375 },
  { top: 27076.68359375 },
  { top: 23566.568359375 },
  { top: 21560.71484375 },
  { top: 17883.056640625 },
  { top: 15793.951171875 },
  { top: 15041.560546875 },
  { top: 14790.7646484375 },
  { top: 13955.1220703125 },
  { top: 12868.6826171875 },
];

const toEndFast = fromEndFast.slice().reverse();

// positions that surely caused rendering errors

const positions1 = [
  { top: 248.19512939453125 },
  { top: 164.42276000976562 },
  { top: 81.17073059082031 },
  { top: 0 },
];

const positions2 = [
  { top: 3925.333251953125 },
  { top: 2588.09765625 },
  { top: 2504.845458984375 },
  { top: 2421.0732421875 },
];

const positions3 = [
  { top: 241.9512176513672 },
  { top: 158.17886352539062 },
  { top: 74.40650177001953 },
  { top: 0 },
];

const positions4 = [
  { top: 87.41463470458984 },
  { top: 105.1056900024414 },
  { top: 239.34959411621094 },
  { top: 309.593505859375 },
  { top: 345.4959411621094 },
  { top: 349.6585388183594 },
  { top: 437.07318115234375 },
  { top: 524.48779296875 },
  { top: 611.9024658203125 },
  { top: 700.3577270507812 },
  { top: 787.7723388671875 },
  { top: 875.18701171875 },
  { top: 962.6016235351562 },
  { top: 1050.0162353515625 },
  { top: 1137.430908203125 },
  { top: 1224.8455810546875 },
  { top: 1312.2601318359375 },
  { top: 1399.6748046875 },
  { top: 1487.0894775390625 },
  { top: 1574.5040283203125 },
  { top: 1661.918701171875 },
  { top: 1749.3333740234375 },
  { top: 1836.7479248046875 },
  { top: 1924.16259765625 },
  { top: 2011.5772705078125 },
];

const positions5 = [
  { top: 15000.455078125 },
  { top: 14913.041015625 },
  { top: 14825.6259765625 },
  { top: 14738.2109375 },
  { top: 14650.796875 },
  { top: 14563.3818359375 },
  { top: 14475.9677734375 },
  { top: 14388.552734375 },
  { top: 14301.138671875 },
  { top: 14213.7236328125 },
  { top: 14126.30859375 },
  { top: 14038.89453125 },
  { top: 13951.4794921875 },
  { top: 13864.0654296875 },
  { top: 13776.650390625 },
  { top: 13689.2353515625 },
  { top: 13601.8212890625 },
  { top: 13514.40625 },
  { top: 13426.9921875 },
  { top: 13339.5771484375 },
  { top: 13252.1630859375 },
  { top: 13164.748046875 },
  { top: 13077.3330078125 },
  { top: 12989.9189453125 },
  { top: 12902.50390625 },
  { top: 12815.08984375 },
  { top: 12727.6748046875 },
];

const scroll = (container: HTMLElement, scrollOptions: ScrollToOptions[]) => new Promise<void>(resolve => {
  const positions = scrollOptions.slice();
  let timeout: NodeJS.Timeout;

  function animateScroll() {
    const position = positions.shift();

    if (position) {
      container.scroll(position);
      requestAnimationFrame(animateScroll);
    }
    else {
      clearTimeout(timeout);
      timeout = setTimeout(resolve, 64);
    }
  }

  requestAnimationFrame(animateScroll);
});

test('Renders items correctly', async ({ page }) => {
  await page.goto('http://localhost:5173/VirtualizedList/FixedListLayout/index.html?auto=true');
  const list = await page.waitForSelector('#virtualized-list');

  await page.waitForSelector('.test-conditions-set');

  page.on('console', (msg) => {
    console.log(msg);
  });

  page.on('pageerror', (err) => { throw err; });

  await expect(page.locator('#virtualized-list')).toBeVisible();

  await list.evaluate(scroll, positions1);
  await page.waitForTimeout(32);

  await list.evaluate(scroll, positions2);
  await page.waitForTimeout(32);

  await list.evaluate(scroll, positions3);
  await page.waitForTimeout(32);

  await list.evaluate(scroll, positions4);
  await page.waitForTimeout(32);

  await list.evaluate(scroll, positions5);
  await page.waitForTimeout(32);

  // from start (incremental strategy)

  await list.evaluate(scroll, fromStartSlow);
  await page.waitForTimeout(32);

  await list.evaluate(scroll, fromStartFaster);
  await page.waitForTimeout(32);

  // to start (incremental strategy)

  await list.evaluate(scroll, toStartSlow);
  await page.waitForTimeout(32);

  await list.evaluate(scroll, toStartFaster);
  await page.waitForTimeout(32);

  // from end (incremental strategy)

  await list.evaluate(scroll, fromEndSlow);
  await page.waitForTimeout(32);

  await list.evaluate(scroll, fromEndFaster);
  await page.waitForTimeout(32);

  // to end (incremental strategy)

  await list.evaluate(scroll, toEndSlow);
  await page.waitForTimeout(32);

  await list.evaluate(scroll, toEndFaster);
  await page.waitForTimeout(32);

  // from start (jump strategy)

  await list.evaluate(scroll, fromStartFast);
  await page.waitForTimeout(32);

  // to start (jump strategy)

  await list.evaluate(scroll, toStartFast);
  await page.waitForTimeout(32);

  // from end (jump strategy)

  await list.evaluate(scroll, fromEndFast);
  await page.waitForTimeout(32);

  // to end (jump strategy)

  await list.evaluate(scroll, toEndFast);
  await page.waitForTimeout(32);

  // from start to end (transition from incremental to jump strategy)

  await list.evaluate(scroll, fromStartFaster.concat(toEndFast));
  await page.waitForTimeout(32);

  // from end to start (transition from jump to incremental strategy)

  await list.evaluate(scroll, fromEndFast.concat(toStartFaster));
  await page.waitForTimeout(32);

  // from start to end (transition from jump to incremental strategy)

  await list.evaluate(scroll, fromStartFast.concat(toEndFaster));
  await page.waitForTimeout(32);

  // from end to start (transition from incremental to jump strategy)

  await list.evaluate(scroll, fromEndFaster.concat(toStartFast));
  await page.waitForTimeout(32);
});