import { MapTileRenderer, MapTileRendererType } from '../renderer';
import { MapFeatureFlags } from '../../flags';
import { GlyphsManager } from '../../glyphs/glyphs_manager';
import { FontManager } from '../../font/font_manager';

import { WebGlSceneCamera } from './webgl_camera';
import { WebGlRenderer, WebGlRendererOptions } from './webgl_renderer';
import { WebGlMapTile } from './tile/webgl_tile';

/**
 * Wrapper for WebGlRenderer to fit the MapTileRenderer interface.
 * Extracts object buffered groups from tiles and deligates render to WebGlRenderer.
 */
export class WebGlMapTileRenderer implements MapTileRenderer {
  private readonly renderer: WebGlRenderer;

  constructor(
    rootEl: HTMLElement,
    featureFlags: MapFeatureFlags,
    type: MapTileRendererType.webgl | MapTileRendererType.webgl2,
    devicePixelRatio: number,
    fontManager: FontManager,
    textureManager: GlyphsManager,
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

  render(tiles: WebGlMapTile[], camera: WebGlSceneCamera, renderOptions?: WebGlRendererOptions): void {
    const objectGroups = [];

    for (const tile of tiles) {
      for (const layer of tile.layers) {
        objectGroups.push(...layer.objectGroups);
      }
    }

    return this.renderer.render(objectGroups, camera, renderOptions);
  }

  getObjectId(tiles: WebGlMapTile[], camera: WebGlSceneCamera, x: number, y: number): number {
    const objectGroups = [];

    for (const tile of tiles) {
      for (const layer of tile.layers) {
        objectGroups.push(...layer.objectGroups);
      }
    }

    return this.renderer.getObjectId(objectGroups, camera, x, y);
  }
}
