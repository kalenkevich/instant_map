import { MapTile } from '../../tile/tile';
import { MapRenderer } from '../renderer';
import { MapState } from '../../map_state';
import { GlideMap, MapEventType } from '../../map';
import { PngMapTile } from '../../tile/png_tile';

export class PngMapRenderer extends MapRenderer {
  animationFrameTaskIdSet = new Set<number>();
  el: HTMLElement;
  images: HTMLImageElement[] = [];

  constructor(
    protected readonly map: GlideMap,
    protected readonly devicePixelRatio: number,
  ) {
    super(map, devicePixelRatio);
    this.el = this.createDivEl();
    this.resizeEventListener = this.resizeEventListener.bind(this);
  }

  public init() {
    this.map.addEventListener({
      eventType: MapEventType.RESIZE,
      handler: this.resizeEventListener,
    });
  }

  private resizeEventListener() {
    const width = this.map.getWidth();
    const height = this.map.getHeight();

    this.el.style.width = `${width}px`;
    this.el.style.height = `${height}px`;
  }

  public destroy() {
    this.map.removeEventListener({
      eventType: MapEventType.RESIZE,
      handler: this.resizeEventListener,
    });
    this.map.rootEl.removeChild(this.el);
    this.stopRender();
  }

  private createDivEl(): HTMLElement {
    const div = document.createElement('div');
    const width = this.map.getWidth();
    const height = this.map.getHeight();

    div.style.width = `${width}px`;
    div.style.height = `${height}px`;
    div.style.position = 'relative';
    div.style.overflow = 'hidden';
    this.map.rootEl.appendChild(div);

    return div;
  }

  public renderTiles(tiles: MapTile[], mapState: MapState) {
    for (const image of this.images) {
      image.style.display = 'none';
    }

    for (let i = 0; i < tiles.length; i++) {
      this.renderTile(tiles[i] as PngMapTile, i, mapState);
    }
  }

  public stopRender(): void {
    for (const taskId of this.animationFrameTaskIdSet) {
      cancelAnimationFrame(taskId);
    }
  }

  private renderTile(tile: PngMapTile, tileIndex: number, mapState: MapState) {
    if (!tile.isReady()) {
      throw new Error('Png tile is not ready yet.');
    }

    if (this.images[tileIndex] === undefined) {
      this.images.push(tile.image);
      this.el.appendChild(tile.image);
    }

    const image = this.images[tileIndex];

    if (tile.tileUrl) {
      this.setupImage(image, tile, tile.tileUrl, mapState);
    }
  }

  private setupImage(
    image: HTMLImageElement,
    tile: PngMapTile,
    imageSrc: string,
    mapState: MapState,
  ) {
    const tileScale = this.getTileScale(mapState);
    let tileX = tile.x * tileScale;
    let tileY = tile.y * tileScale;

    if (tileScale < 1) {
      tileX -= (tile.width * (1 - tileScale)) / 2;
      tileY -= (tile.height * (1 - tileScale)) / 2;
    } else {
      tileX += (tile.width * (tileScale - 1)) / 2;
      tileY += (tile.height * (tileScale - 1)) / 2;
    }

    image.src = imageSrc;
    image.style.display = 'block';
    image.style.width = `${tile.width}px`;
    image.style.height = `${tile.height}px`;
    image.style.position = 'absolute';
    image.style.userSelect = 'none';
    image.style.transform = `translate3d(${tileX}px, ${tileY}px, 0)scale(${tileScale}, ${tileScale})`;
  }
}