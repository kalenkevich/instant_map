import {describe, expect, it} from '@jest/globals';
import {toMatchImageSnapshot} from 'jest-image-snapshot';
import { goToPageAndWaitForMapRender } from './_utils';

expect.extend({ toMatchImageSnapshot });

describe('HTML render', () => {
  describe('Png images', () => {
    it('should render osm png images', async () => {
      await goToPageAndWaitForMapRender(page, 'http://localhost:3000/?sm=html_png_osm&ls');

      const image = await page.screenshot();

      //@ts-ignore
      expect(image).toMatchImageSnapshot({
        failureThreshold: 0.02,
        failureThresholdType: 'percent',
        customSnapshotIdentifier: 'html_render_png_osm',
      });
    });

    it('should render satellite png images', async () => {
      await goToPageAndWaitForMapRender(page, 'http://localhost:3000/?sm=html_png_maptiler&ls');

      const image = await page.screenshot();

      //@ts-ignore
      expect(image).toMatchImageSnapshot({
        failureThreshold: 0.02,
        failureThresholdType: 'percent',
        customSnapshotIdentifier: 'html_render_png_maptiler',
      });
    });
  });
});
