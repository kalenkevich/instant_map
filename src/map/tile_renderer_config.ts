import { DataTileSourceType } from './styles/styles';
import { TileSourceProcessor } from './tile/tile_source_processor';
import { MapTileRendererType } from './renderer/renderer';
// Webgl processors
import { PbfTile2WebglLayers } from './renderer/webgl/tile/weblg_tile_processor_pbf';
import { ImageTile2WebglLayers } from './renderer/webgl/tile/weblg_tile_processor_image';
import { DebugTile2WebglLayers } from './renderer/webgl/tile/weblg_tile_processor_debug';

export const TILE_RENDERER_SOURCE_PROCESSOR_CONFIG_MAP: Record<MapTileRendererType, TileSourceProcessor> = {
  [MapTileRendererType.webgl]: new TileSourceProcessor({
    [DataTileSourceType.debug]: DebugTile2WebglLayers,
    [DataTileSourceType.pbf]: PbfTile2WebglLayers,
    [DataTileSourceType.image]: ImageTile2WebglLayers,
  }),
};
