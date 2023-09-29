import {describe, expect, it} from '@jest/globals';
import {toMatchImageSnapshot} from 'jest-image-snapshot';

expect.extend({ toMatchImageSnapshot });

describe('Webgl render ', () => {
  describe('PNG images.', () => {
    it('should render osm images on canvas as a map background.', async () => {
      await page.goto('http://localhost:3000/?sm=webgl_png_osm&ls');
      await page.waitForTimeout(2000);
  
      const image = await page.screenshot();
  
      //@ts-ignore
      expect(image).toMatchImageSnapshot({
        customDiffConfig: { threshold: 0.1 },
        dumpInlineDiffToConsole: true,
        customSnapshotIdentifier: 'webgl_render_png_osm',
      });
    });

    it('should render maptiler images on canvas as a map background.', async () => {
      await page.goto('http://localhost:3000/?sm=webgl_png_maptiler&ls');
      await page.waitForTimeout(2000);
  
      const image = await page.screenshot();
  
      //@ts-ignore
      expect(image).toMatchImageSnapshot({
        customDiffConfig: { threshold: 0.1 },
        dumpInlineDiffToConsole: true,
        customSnapshotIdentifier: 'webgl_render_png_maptiler',
      });
    });
  });

  describe.skip('Vector tiles.', () => {
    it('should render osm images on canvas as a map background.', async () => {
      await page.goto('http://localhost:3000/?sm=webgl_vt_maptiler&ls');
      await page.waitForTimeout(10000);
  
      const image = await page.screenshot();
  
      //@ts-ignore
      expect(image).toMatchImageSnapshot({
        customDiffConfig: { threshold: 0.1 },
        dumpInlineDiffToConsole: true,
        customSnapshotIdentifier: 'webgl_render_vt_maptiler',
      });
    });
  });
});
