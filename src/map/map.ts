import { WebGlPainter, GlProgram } from '../webgl';

import { Pan } from './pan';
import { MapTile } from './tile/tile';
import { TilesGrid } from './tile/tiles_grid';
import { MapState } from './map_state';
import { MapOptions, MapRendererType, MapRendererOptions, MapRenderer } from './types';

/**
 * Visual Map class
 * Core of the map. Controls user events like mousemove, click, drag, wheel and converts it to the maps events like drag, zoom, move.
 * Based on center and zoom fetch tiles.
 *
 * TODO: should support combination of the webgl (development), webgl2, webgpu as render engine and vector, xml, json as a data source format.
 */
export class GlideMap extends Pan {
  renderer: MapRenderer;
  tilesGrid: TilesGrid;

  width: number;
  height: number;
  devicePixelRatio: number;

  constructor(options: MapOptions) {
    super(options.el);

    this.devicePixelRatio = options.devicePixelRatio || window.devicePixelRatio || 1;
    this.width = (this.el as HTMLCanvasElement).width;
    this.height = (this.el as HTMLCanvasElement).height;

    this.state = this.prevState = {
      zoom: options.zoom || 0,
      center: options.center || [0, 0],
    };

    this.renderer = getRenderer(options.renderer || MapRendererType.webgl, options.el as HTMLCanvasElement);
    this.tilesGrid = new TilesGrid({
      tilesMetaUrl: options.tilesMetaUrl,
      mapWidth: this.width,
      mapHeight: this.height,
    });

    this.init();
  }

  init() {
    super.init();
    this.renderer.init();
    this.tilesGrid.init().then(() => {
      this.tilesGrid.update(this.state).then(tiles => this.rerenderMap(tiles));
    });
  }

  onMapStateChange(newState: MapState) {
    this.prevState = this.state;
    this.state = newState;

    this.tilesGrid.update(this.state).then(tiles => this.rerenderMap(tiles));
  }

  renderedTiles: MapTile[] = [];
  rerenderMap(tilesToRender: MapTile[]) {
    const renderScene = (tiles: MapTile[]) => {
      if (this.isAlreadyRendered(this.renderedTiles, tiles)) {
        return;
      }

      const glPrograms = tiles.flatMap(tile => tile.getRenderPrograms());

      console.time('map_render');
      this.renderer.setPrograms(glPrograms);
      this.renderer.draw();
      console.timeEnd('map_render');

      this.renderedTiles = tiles;
    };

    requestAnimationFrame(() => {
      renderScene(tilesToRender);
    });
  }

  private isAlreadyRendered(renderedTiles: MapTile[], tilesToRender: MapTile[]): boolean {
    const renderedKeys = renderedTiles
      .map(t => t.id)
      .sort()
      .join('');
    const tilesKeys = tilesToRender
      .map(t => t.id)
      .sort()
      .join('');

    return renderedKeys === tilesKeys;
  }
}

export const getRenderer = (renderer: MapRendererType | MapRendererOptions, canvasEl: HTMLCanvasElement): MapRenderer => {
  if ((renderer as MapRendererOptions).renderer) {
    return (renderer as MapRendererOptions).renderer;
  }

  const type = renderer as MapRendererType;

  if (type === MapRendererType.webgl) {
    const gl = canvasEl.getContext('webgl', {
      powerPreference: 'high-performance',
    });

    return new WebGlPainter(gl, []);
  }

  throw new Error(`Renderer ${type} is not supported.`);
};
