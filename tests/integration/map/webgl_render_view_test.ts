import {describe, expect, it} from '@jest/globals';
import {toMatchImageSnapshot} from 'jest-image-snapshot';
import { BASE_TEST_LOCATION } from './_const';
import { goToPageAndWaitForMapRender, interactAndWaitForMapEvent } from './_utils';
import { MapEventType } from '../../../src/map/map';

expect.extend({ toMatchImageSnapshot });

describe('Webgl render', () => {
  describe('PNG images.', () => {
    it('should render osm images on canvas as a map background.', async () => {
      await goToPageAndWaitForMapRender(page, `http://localhost:3000/?sm=webgl_png_osm&ls&${BASE_TEST_LOCATION}`);
  
      const image = await page.screenshot();
  
      //@ts-ignore
      expect(image).toMatchImageSnapshot({
        failureThreshold: 0.02,
        failureThresholdType: 'percent',
        customSnapshotIdentifier: 'webgl_render_png_osm',
      });
    });

    it('should render maptiler images on canvas as a map background.', async () => {
      await goToPageAndWaitForMapRender(page, `http://localhost:3000/?sm=webgl_png_maptiler&ls&${BASE_TEST_LOCATION}`);
  
      const image = await page.screenshot();
  
      //@ts-ignore
      expect(image).toMatchImageSnapshot({
        failureThreshold: 0.02,
        failureThresholdType: 'percent',
        customSnapshotIdentifier: 'webgl_render_png_maptiler',
      });
    });

    it('should move up.', async () => {
      await goToPageAndWaitForMapRender(page, `http://localhost:3000/?sm=webgl_png_osm&ls&${BASE_TEST_LOCATION}`);

      const upMoveButton = await page.$('.move-up');

      await interactAndWaitForMapEvent(page, () => upMoveButton.click(), MapEventType.RENDER);

      const image = await page.screenshot();

      //@ts-ignore
      expect(image).toMatchImageSnapshot({
        failureThreshold: 0.02,
        failureThresholdType: 'percent',
        customSnapshotIdentifier: 'webgl_render_png_move_up',
      });
    });

    it('should move down.', async () => {
      await goToPageAndWaitForMapRender(page, `http://localhost:3000/?sm=webgl_png_osm&ls&${BASE_TEST_LOCATION}`);

      const downMoveButton = await page.$('.move-down');

      await interactAndWaitForMapEvent(page, () => downMoveButton.click(), MapEventType.RENDER);

      const image = await page.screenshot();

      //@ts-ignore
      expect(image).toMatchImageSnapshot({
        failureThreshold: 0.02,
        failureThresholdType: 'percent',
        customSnapshotIdentifier: 'webgl_render_png_move_down',
      });
    });

    it('should move left.', async () => {
      await goToPageAndWaitForMapRender(page, `http://localhost:3000/?sm=webgl_png_osm&ls&${BASE_TEST_LOCATION}`);

      const leftMoveButton = await page.$('.move-left');

      await interactAndWaitForMapEvent(page, () => leftMoveButton.click(), MapEventType.RENDER);

      const image = await page.screenshot();

      //@ts-ignore
      expect(image).toMatchImageSnapshot({
        failureThreshold: 0.02,
        failureThresholdType: 'percent',
        customSnapshotIdentifier: 'webgl_render_png_move_left',
      });
    });

    it('should move right.', async () => {
      await goToPageAndWaitForMapRender(page, `http://localhost:3000/?sm=webgl_png_osm&ls&${BASE_TEST_LOCATION}`);

      const rightMoveButton = await page.$('.move-right');

      await interactAndWaitForMapEvent(page, () => rightMoveButton.click(), MapEventType.RENDER);

      const image = await page.screenshot();

      //@ts-ignore
      expect(image).toMatchImageSnapshot({
        failureThreshold: 0.02,
        failureThresholdType: 'percent',
        customSnapshotIdentifier: 'webgl_render_png_move_right',
      });
    });
  });

  describe('Vector tiles.', () => {
    it('should render vector tile data using native webgl.', async () => {
      await goToPageAndWaitForMapRender(page, `http://localhost:3000/?sm=webgl_vt_maptiler&ls&${BASE_TEST_LOCATION}`);
  
      const image = await page.screenshot();
  
      //@ts-ignore
      expect(image).toMatchImageSnapshot({
        failureThreshold: 0.02,
        failureThresholdType: 'percent',
        customSnapshotIdentifier: 'webgl_render_vt_maptiler',
      });
    });

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
