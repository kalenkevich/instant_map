import {beforeEach, describe, expect, it} from '@jest/globals';
import {toMatchImageSnapshot} from 'jest-image-snapshot';

import {GlideMap, DEFAULT_MAP_METADATA} from '../../../../src/map/map';
import {MapRendererType} from '../../../../src/map/render/renderer';
import {MapTileFormatType} from '../../../../src/map/tile/tile';
import {LatLng} from '../../../../src/map/geo/lat_lng';
import {SAMPLE_MAP_ZOOM, SAMPLE_MAP_CENTER_LAT, SAMPLE_MAP_CENTER_LNG} from '../consts';

expect.extend({ toMatchImageSnapshot });

describe('Basic map render', () => {
  // let rootEl: HTMLElement;

  beforeEach(() => {
    // rootEl = createRootEl();
  });

  afterEach(() => {
    // document.removeChild(rootEl);
  });

  describe('Google', () => {
    beforeAll(async () => {
      await page.goto('https://google.com');
    });
  
    it('should be titled "Google"', async () => {
      await expect(page.title()).resolves.toMatch('Google');
    });
  });

  // it.skip('should work', () => {
  //   const map = new GlideMap({
  //     rootEl,
  //     zoom: SAMPLE_MAP_ZOOM,
  //     center: new LatLng(SAMPLE_MAP_CENTER_LAT, SAMPLE_MAP_CENTER_LNG),
  //     renderer: MapRendererType.png,
  //     resizable: true,
  //     mapMeta: {
  //       ...DEFAULT_MAP_METADATA,
  //       maxzoom: 19,
  //       minzoom: 0,
  //       format: MapTileFormatType.png,
  //       tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
  //     }
  //   });
  // });

  const createRootEl = (width: number = 1024, height: number = 1024): HTMLElement => {
    const div = document.createElement('div');

    div.id = 'glide-gl';
    div.style.border = '1px solid';
    div.style.width = `${width}px`;
    div.style.height = `${height}px`;
    document.body.appendChild(div);

    return div;
  }
});
