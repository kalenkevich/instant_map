import { TileSourceProcessor } from './tile/tile_source_processor';
import { DataTileSourceType } from './tile/tile_source/tile_source';
import { MapTileRendererType } from './renderer/renderer';
// WebGl processors
import { MvtTile2WebglLayers } from './renderer/webgl/tile/weblg_tile_processor_mvt';
import { ImageTile2WebglLayers } from './renderer/webgl/tile/weblg_tile_processor_image';
import { DebugTile2WebglLayers } from './renderer/webgl/tile/weblg_tile_processor_debug';

export const TILE_RENDERER_SOURCE_PROCESSOR_CONFIG_MAP: Record<MapTileRendererType, TileSourceProcessor> = {
  [MapTileRendererType.webgl]: new TileSourceProcessor({
    [DataTileSourceType.debug]: DebugTile2WebglLayers,
    [DataTileSourceType.mvt]: MvtTile2WebglLayers,
    [DataTileSourceType.image]: ImageTile2WebglLayers,
  }),
  [MapTileRendererType.webgl2]: new TileSourceProcessor({
    [DataTileSourceType.debug]: DebugTile2WebglLayers,
    [DataTileSourceType.mvt]: MvtTile2WebglLayers,
    [DataTileSourceType.image]: ImageTile2WebglLayers,
  }),
};
