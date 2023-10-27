import { describe, expect, it } from '@jest/globals';
import { toMatchImageSnapshot } from 'jest-image-snapshot';
import { BASE_TEST_LOCATION } from './_const';
import { goToPageAndWaitForMapRender } from './_utils';

expect.extend({ toMatchImageSnapshot });

describe('HTML render', () => {
  describe('Png images', () => {
    it('should render osm png images', async () => {
      await goToPageAndWaitForMapRender(page, `http://localhost:3000/?sm=html_png_osm&env=test&${BASE_TEST_LOCATION}`);

      const image = await page.screenshot();

      //@ts-ignore
      expect(image).toMatchImageSnapshot({
        failureThreshold: 0.02,
        failureThresholdType: 'percent',
        customSnapshotIdentifier: 'html_render_png_osm',
      });
    });

    it('should render satellite png images', async () => {
      await goToPageAndWaitForMapRender(
        page,
        `http://localhost:3000/?sm=html_png_maptiler&env=test&${BASE_TEST_LOCATION}`
      );

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
