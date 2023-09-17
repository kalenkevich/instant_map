import { MapTile } from '../../tile/tile';
import { MapRenderer } from '../renderer';
import { MapState } from '../../map_state';
import { GlideMap } from '../../map';
import { PngMapTile } from '../../tile/png_tile';

export class PngMapRenderer implements MapRenderer {
  animationFrameTaskIdSet = new Set<number>();
  el: HTMLElement;
  images: HTMLImageElement[] = [];

  constructor(
    private readonly map: GlideMap,
  ) {
    this.map = map;
    this.el = this.createDivEl();
  }

  init() {}

  private createDivEl(): HTMLElement {
    const div = document.createElement('div');

    div.style.width = `${this.map.width}px`;
    div.style.height = `${this.map.height}px`;
    div.style.position = 'relative';
    div.style.overflow = 'hidden';
    this.map.rootEl.appendChild(div);

    return div;
  }

  private createImgEl(): HTMLImageElement {
    const img = document.createElement('img');

    return img;
  }

  renderTiles(tiles: MapTile[], mapState: MapState) {
    for (const image of this.images) {
      image.style.display = 'none';
    }

    for (let i = 0; i < tiles.length; i++) {
      this.renderTile(tiles[i] as PngMapTile, i, mapState);
    }
  }

  stopRender(): void {
    for (const taskId of this.animationFrameTaskIdSet) {
      cancelAnimationFrame(taskId);
    }
  }

  renderTile(tile: PngMapTile, tileIndex: number, mapState: MapState) {
    if (this.images[tileIndex] === undefined) {
      const image = this.createImgEl();
      this.images.push(image);
      this.el.appendChild(image);
    }

    const image = this.images[tileIndex];

    if (tile.tileUrl) {
      this.setupImage(image, tile, tile.tileUrl, mapState);
    }
  }

  setupImage(
    image: HTMLImageElement,
    tile: PngMapTile,
    imageSrc: string,
    mapState: MapState,
  ) {
    const tileScale = this.getTileScale(mapState);
    let tileX = tile.x * tileScale;
    let tileY = tile.y * tileScale;

    if (tileScale < 1) {
      tileX -= (tile.width * tileScale) * (1 - tileScale);
      tileY -= (tile.height * tileScale) * (1 - tileScale);
    }

    image.src = imageSrc;
    image.style.display = 'block';
    image.style.width = `${tile.width}px`;
    image.style.height = `${tile.height}px`;
    image.style.position = 'absolute';
    image.style.transform = `translate3d(${tileX}px, ${tileY}px, 0)scale(${tileScale}, ${tileScale})`;
  }

  getTileScale(mapState: MapState): number {
    const tileZoom = this.getTileZoom(mapState);

    return this.map.getZoomScale(mapState.zoom, tileZoom);
  }

  getTileZoom(mapState: MapState): number | undefined {
    let tileZoom = Math.round(mapState.zoom);

    if (tileZoom > this.map.getMaxZoom() || tileZoom < this.map.getMinZoom()) {
      return undefined;
    }

    return this.clampZoom(tileZoom);
  }

  clampZoom(zoom: number) {
    const minZoom = this.map.getMinZoom();
    const maxZoom = this.map.getMaxZoom();

    if (zoom < minZoom) {
      return minZoom;
    }

    if (maxZoom < zoom) {
      return maxZoom;
    }

    return zoom;
  }
}