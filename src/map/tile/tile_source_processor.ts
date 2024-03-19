import { MapTile, MapTileLayer, getTileRef } from './tile';
import { ProjectionType } from '../geo/projection/projection';
import { MapFeatureFlags } from '../flags';
import { DataTileSource, DataTileStyles, DataLayerStyle, DataTileSourceType } from '../styles/styles';
import { MapTileRendererType } from '../renderer/renderer';
// TODO: remove
import { FontAtlas } from '../font/font_config';
import { GlyphsManagerMappingState } from '../glyphs/glyphs_manager';

export interface FetchTileOptions {
  tileId: string;
  tileStyles: DataTileStyles;
  tileSize: number;
  rendererType: MapTileRendererType;
  projectionViewMat: [number, number, number, number, number, number, number, number, number];
  canvasWidth: number;
  canvasHeight: number;
  pixelRatio: number;
  zoom: number;
  minZoom: number;
  maxZoom: number;
  projectionType: ProjectionType;
  fontManagerState: Record<string, FontAtlas>;
  atlasTextureMappingState: GlyphsManagerMappingState;
  featureFlags: MapFeatureFlags;
}

export type SourceTileProcessor = (
  tileUrl: string,
  source: DataTileSource,
  sourceLayers: DataLayerStyle[],
  options: FetchTileOptions,
  abortController: AbortController,
  onLayerReady: (tileLayer: MapTileLayer) => void
) => Promise<MapTileLayer[]>;

/** Format tile source url with current z, x, y values. */
export function formatTileURL(tileId: string, source: DataTileSource) {
  const [x, y, z] = tileId.split('/');
  const u = getU([parseInt(x), parseInt(y), parseInt(z)]);

  return source.url.replace('{x}', x).replace('{y}', y).replace('{z}', z).replace('{u}', u);
}

export function getU(coord: [number, number, number]): string {
  let u = '';

  for (var zoom = coord[2]; zoom > 0; zoom--) {
    var b = 0;
    var mask = 1 << (zoom - 1);
    if ((coord[0] & mask) !== 0) b++;
    if ((coord[1] & mask) !== 0) b += 2;
    u += b.toString();
  }

  return u;
}

/** Return list of actually used sources based on layers definition. */
export function getEnabledSources(tileStyles: DataTileStyles): DataTileSource[] {
  const sources: DataTileSource[] = [];
  const usedTileSources = new Set();

  for (const layer of Object.values(tileStyles.layers)) {
    if (layer.show === undefined || layer.show === true) {
      usedTileSources.add(layer.source);
    }
  }

  for (const tileSource of Object.values(tileStyles.sources)) {
    if (usedTileSources.has(tileSource.name)) {
      sources.push(tileSource);
    }
  }

  return sources;
}

/** Return all layers which describes target source. */
export function getSourceLayers(tileStyles: DataTileStyles, targetSource: DataTileSource): DataLayerStyle[] {
  const layers: DataLayerStyle[] = [];

  for (const layer of Object.values(tileStyles.layers)) {
    if (layer.source === targetSource.name) {
      layers.push(layer);
    }
  }

  return layers;
}

export function getSortedLayers(tiles: MapTile[]): MapTileLayer[] {
  const layers: MapTileLayer[] = [];

  for (const tile of tiles) {
    layers.push(...tile.layers);
  }

  return layers.sort((l1, l2) => l1.zIndex - l2.zIndex);
}

/** General class that accepts tile source processors for specific renderer. */
export class TileSourceProcessor {
  constructor(private readonly processorsMap: Record<DataTileSourceType, SourceTileProcessor>) {}

  async getMapTile(
    options: FetchTileOptions,
    abortController: AbortController,
    onLayerReady: (tileLayer: MapTileLayer) => void
  ): Promise<MapTile> {
    const { tileId } = options;
    const enabledSources = getEnabledSources(options.tileStyles);

    const layersPromises = [];
    for (const source of enabledSources) {
      const tileURL = formatTileURL(tileId, source);
      const sourceLayers = getSourceLayers(options.tileStyles, source);
      const sourceProcessor = this.processorsMap[source.type];

      layersPromises.push(sourceProcessor(tileURL, source, sourceLayers, options, abortController, onLayerReady));
    }

    const tileLayers = (await Promise.all(layersPromises)).flatMap(l => l);

    if (options.featureFlags.debugLayer) {
      tileLayers.push(...(await this.getDebugLayers(options, abortController, onLayerReady)));
    }

    return {
      tileId: options.tileId,
      ref: getTileRef(options.tileId),
      layers: tileLayers,
    };
  }

  async getDebugLayers(
    options: FetchTileOptions,
    abortController: AbortController,
    onLayerReady: (tileLayer: MapTileLayer) => void
  ): Promise<MapTileLayer[]> {
    const sourceProcessor = this.processorsMap[DataTileSourceType.debug];

    return sourceProcessor(null, null, [], options, abortController, onLayerReady);
  }
}
