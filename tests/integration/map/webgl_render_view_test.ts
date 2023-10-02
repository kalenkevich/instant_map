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
        failureThreshold: 0.02,
        failureThresholdType: 'percent',
        customSnapshotIdentifier: 'webgl_render_png_osm',
      });
    });

    it('should render maptiler images on canvas as a map background.', async () => {
      await page.goto('http://localhost:3000/?sm=webgl_png_maptiler&ls');
      await page.waitForTimeout(2000);
  
      const image = await page.screenshot();
  
      //@ts-ignore
      expect(image).toMatchImageSnapshot({
        failureThreshold: 0.02,
        failureThresholdType: 'percent',
        customSnapshotIdentifier: 'webgl_render_png_maptiler',
      });
    });
  });

  describe('Vector tiles.', () => {
    it('should render vector tile data using native webgl.', async () => {
      await page.goto('http://localhost:3000/?sm=webgl_vt_maptiler&ls');
      await page.waitForTimeout(2000);
  
      const image = await page.screenshot();
  
      //@ts-ignore
      expect(image).toMatchImageSnapshot({
        failureThreshold: 0.02,
        failureThresholdType: 'percent',
        customSnapshotIdentifier: 'webgl_render_vt_maptiler',
      });
    });

    it('should render vector tile data using threejs.', async () => {
      await page.goto('http://localhost:3000/?sm=threejs_vt_maptiler&ls');
      await page.waitForTimeout(2000);
  
      const image = await page.screenshot();
  
      //@ts-ignore
      expect(image).toMatchImageSnapshot({
        failureThreshold: 0.02,
        failureThresholdType: 'percent',
        customSnapshotIdentifier: 'threejs_render_vt_maptiler',
      });
    });
  });
});
