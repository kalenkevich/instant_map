import {describe, expect, it} from '@jest/globals';
import {toMatchImageSnapshot} from 'jest-image-snapshot';

expect.extend({ toMatchImageSnapshot });

describe('HTML render', () => {
  describe('Png images', () => {
    it('should render osm png images', async () => {
      await page.goto('http://localhost:3000/?sm=html_png_osm&ls');
      await page.waitForTimeout(2000);

      const image = await page.screenshot();
  
      //@ts-ignore
      expect(image).toMatchImageSnapshot({
        customDiffConfig: { threshold: 0.1 },
        dumpInlineDiffToConsole: true,
        customSnapshotIdentifier: 'html_render_png_osm',
      });
    });

    it('should render osm png images', async () => {
      await page.goto('http://localhost:3000/?sm=html_png_maptiler&ls');
      await page.waitForTimeout(2000);

      const image = await page.screenshot();
  
      //@ts-ignore
      expect(image).toMatchImageSnapshot({
        customDiffConfig: { threshold: 0.1 },
        dumpInlineDiffToConsole: true,
        customSnapshotIdentifier: 'html_render_png_maptiler',
      });
    });
  });
});
