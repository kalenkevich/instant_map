import { describe, expect, it } from '@jest/globals';
import { toMatchImageSnapshot } from 'jest-image-snapshot';
import { BASE_TEST_LOCATION } from './_const';
import { goToPageAndWaitForMapRender } from './_utils';

expect.extend({ toMatchImageSnapshot });

describe('ThreeJS render', () => {
  describe('Vector tiles.', () => {
    it('should render vector tile data using threejs.', async () => {
      await goToPageAndWaitForMapRender(page, `http://localhost:3000/?sm=threejs_vt_maptiler&ls&${BASE_TEST_LOCATION}`);

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
