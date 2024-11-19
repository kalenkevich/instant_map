import { MapTile } from '../../tile/tile';

import { MapFeatureFlags } from '../../flags';
import { GlyphsManager } from '../../glyphs/glyphs_manager';
import { FontManager } from '../../font/font_manager';
import { SceneCamera } from '../renderer';

import { WebGlRenderer, WebGlRendererOptions } from './webgl_renderer';
import { MapTileRenderer, MapTileRendererType } from '../renderer';
import { MapTile2WebglObjects } from './webgl_map_tile_to_webgl_object';

/**
 * Wrapper for WebGlRenderer to fit the MapTileRenderer interface.
 * Extracts object buffered groups from tiles and deligates render to WebGlRenderer.
 */
export class WebGlMapTileRenderer implements MapTileRenderer {
  private readonly renderer: WebGlRenderer;

  constructor(
    rootEl: HTMLElement,
    private readonly featureFlags: MapFeatureFlags,
    type: MapTileRendererType.webgl | MapTileRendererType.webgl2,
    private readonly devicePixelRatio: number,
    private readonly fontManager: FontManager,
    private readonly textureManager: GlyphsManager,
  ) {
    this.renderer = new WebGlRenderer(rootEl, featureFlags, type, devicePixelRatio, fontManager, textureManager);
  }

  init(): Promise<void> {
    return this.renderer.init();
  }

  destroy(): void {
    return this.renderer.destroy();
  }

  resize(width: number, height: number): void {
    return this.renderer.resize(width, height);
  }

  render(tiles: MapTile[], camera: SceneCamera, renderOptions?: WebGlRendererOptions): void {
    const objectGroups = [];

    for (const tile of tiles) {
      if (tile.layers.length > 0 && !tile.prerendedData) {
        continue;
      }

      const tileObjectGroups = MapTile2WebglObjects(
        tile,
        this.featureFlags,
        this.fontManager,
        this.textureManager,
        this.devicePixelRatio,
      );

      for (let tileObjGroupIdx = 0; tileObjGroupIdx < tileObjectGroups.length; tileObjGroupIdx++) {
        objectGroups.push(tileObjectGroups[tileObjGroupIdx]);
      }
    }

    return this.renderer.render(objectGroups, camera, renderOptions);
  }

  getObjectId(tiles: MapTile[], camera: SceneCamera, x: number, y: number): number {
    const objectGroups = [];

    for (const tile of tiles) {
      const tileObjectGroups = MapTile2WebglObjects(
        tile,
        this.featureFlags,
        this.fontManager,
        this.textureManager,
        this.devicePixelRatio,
      );

      for (let tileObjGroupIdx = 0; tileObjGroupIdx < tileObjectGroups.length; tileObjGroupIdx++) {
        objectGroups.push(tileObjectGroups[tileObjGroupIdx]);
      }
    }

    return this.renderer.getObjectId(objectGroups, camera, x, y);
  }
}
