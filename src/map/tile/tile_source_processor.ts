import { MapTile, MapTileLayer, getTileRef } from './tile';
import { ProjectionType } from '../geo/projection/projection';
import { MapFeatureFlags } from '../flags';
import { DataTileSource, DataTileStyles, DataTileSourceType } from '../styles/styles';
import { MapTileRendererType } from '../renderer/renderer';
// TODO: remove
import { FontManagerState } from '../font/font_manager';
import { AtlasTextureMappingState } from '../atlas/atlas_manager';

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
  projectionType: ProjectionType;
  fontManagerState: FontManagerState;
  atlasTextureMappingState: AtlasTextureMappingState;
  featureFlags: MapFeatureFlags;
}

export type SourceTileProcessor = (
  tileUrl: string,
  options: FetchTileOptions,
  abortController: AbortController,
  onLayerReady: (tileLayer: MapTileLayer) => void
) => Promise<MapTileLayer[]>;

/** Format tile source url with current z, x, y values. */
export function formatTileURL(tileId: string, source: DataTileSource) {
  const [x, y, z] = tileId.split('/');

  return source.url.replace('{x}', x).replace('{y}', y).replace('{z}', z);
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
    for (const tileSource of enabledSources) {
      const tileURL = formatTileURL(tileId, tileSource);
      const sourceProcessor = this.processorsMap[tileSource.type];

      layersPromises.push(sourceProcessor(tileURL, options, abortController, onLayerReady));
    }

    const tileLayers = (await Promise.all(layersPromises)).flatMap(l => l);

    return {
      tileId: options.tileId,
      ref: getTileRef(options.tileId),
      layers: tileLayers,
    };
  }
}
