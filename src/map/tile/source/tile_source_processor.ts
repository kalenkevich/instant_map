import { MapTile, MapTileLayer, getTileRef } from '../tile';
import { TileSourceType } from './tile_source';
import { DataTileSource, DataTileStyles, DataLayerStyle } from '../../styles/styles';
import { MapFeatureFlags } from '../../flags';
import { ProjectionType } from '../../geo/projection/projection';
import { DebugTileSourceProcessor } from './tile_source_processor_debug';
import { MvtTileSourceProcessor } from './tile_source_processor_mvt';
import { ImageTileSourceProcessor } from './tile_source_processor_image';

import { MapTile2WebglObjects } from '../../renderer/webgl/webgl_map_tile_to_webgl_object';
import { MapTileRendererType } from '../../renderer/renderer';
import { FontAtlas } from '../../font/font_config';
import { GlyphsManager, GlyphsManagerMappingState } from '../../glyphs/glyphs_manager';
import { FontManager } from '../../font/font_manager';

export interface TileProcessingOptions {
  featureFlags: MapFeatureFlags;
  tileSource: TileSourceProcessOptions;
  tilePrerender: MapTilePrerenderOptions;
}

export interface TileSourceProcessOptions {
  tileId: string;
  tileStyles: DataTileStyles;
  tileSize: number;
  projectionType: ProjectionType;
}

interface MapTilePrerenderOptions {
  rendererType: MapTileRendererType;
  fontManagerState: Record<string, FontAtlas>;
  atlasTextureMappingState: GlyphsManagerMappingState;
}

export type TileSourceTypeProcessorHandler = (
  featureFlags: MapFeatureFlags,
  tileSourceUrl: string,
  abortController: AbortController,
  source: DataTileSource,
  sourceLayers: DataLayerStyle[],
  processOptions: TileSourceProcessOptions,
) => Promise<MapTile>;

export const TILE_SOURCE_PROCESSOR_CONFIG_MAP: Record<TileSourceType, TileSourceTypeProcessorHandler> = {
  [TileSourceType.debug]: DebugTileSourceProcessor,
  [TileSourceType.mvt]: MvtTileSourceProcessor,
  [TileSourceType.image]: ImageTileSourceProcessor,
};

/** Format tile source url with current z, x, y values. */
export function formatTileURL(tileId: string, source: DataTileSource) {
  const [x, y, z] = tileId.split('/');
  const u = getU([parseInt(x), parseInt(y), parseInt(z)]);

  return source.url.replace('{x}', x).replace('{y}', y).replace('{z}', z).replace('{u}', u);
}

export function getU(coord: [number, number, number]): string {
  let u = '';

  for (let zoom = coord[2]; zoom > 0; zoom--) {
    let b = 0;
    const mask = 1 << (zoom - 1);
    if ((coord[0] & mask) !== 0) b++;
    if ((coord[1] & mask) !== 0) b += 2;
    u += b.toString();
  }

  return u;
}

/** Return list of actually used sources based on layers definition. */
export function getEnabledTileDataSources(tileStyles: DataTileStyles): DataTileSource[] {
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
  constructor(
    private readonly tileSourceProcessors: Record<
      TileSourceType,
      TileSourceTypeProcessorHandler
    > = TILE_SOURCE_PROCESSOR_CONFIG_MAP,
  ) {}

  async getMapTile(
    featureFlags: MapFeatureFlags,
    options: TileSourceProcessOptions,
    abortController: AbortController,
  ): Promise<MapTile> {
    const { tileId } = options;
    const enabledTileSources = getEnabledTileDataSources(options.tileStyles);

    const tileLayerPromisesPromises = [];
    for (const tileDataSource of enabledTileSources) {
      const tileURL = formatTileURL(tileId, tileDataSource);
      const sourceLayers = getSourceLayers(options.tileStyles, tileDataSource);
      const tileSourceProcessor = this.tileSourceProcessors[tileDataSource.type];

      tileLayerPromisesPromises.push(
        tileSourceProcessor(featureFlags, tileURL, abortController, tileDataSource, sourceLayers, options),
      );
    }

    const tileLayers = (await Promise.all(tileLayerPromisesPromises)).flatMap(tile => tile.layers);

    if (featureFlags.debugLayer) {
      const debugTile = await this.getDebugTile(featureFlags, options, abortController);

      tileLayers.push(...debugTile.layers);
    }

    return {
      ref: getTileRef(tileId),
      tileId,
      layers: tileLayers,
    };
  }

  async prerenderTile(
    featureFlags: MapFeatureFlags,
    mapTile: MapTile,
    prerenderOptions: MapTilePrerenderOptions,
  ): Promise<MapTile> {
    if (
      prerenderOptions.rendererType !== MapTileRendererType.webgl &&
      prerenderOptions.rendererType !== MapTileRendererType.webgl2
    ) {
      return mapTile;
    }

    const fontManager = new FontManager(featureFlags, {}, prerenderOptions.fontManagerState);
    const glyphsManager = new GlyphsManager(featureFlags, {}, {}, prerenderOptions.atlasTextureMappingState);

    mapTile.prerendedData = MapTile2WebglObjects(mapTile, featureFlags, fontManager, glyphsManager);

    return mapTile;
  }

  private getDebugTile(
    featureFlags: MapFeatureFlags,
    options: TileSourceProcessOptions,
    abortController: AbortController,
  ): Promise<MapTile> {
    return this.tileSourceProcessors[TileSourceType.debug](featureFlags, null, abortController, null, [], options);
  }
}
