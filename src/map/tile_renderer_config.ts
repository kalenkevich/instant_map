import { DataTileSourceType } from './styles/styles';
import { TileSourceProcessor } from './tile/tile_source_processor';
import { MapTileRendererType } from './renderer/renderer';
// Webgl processors
import { PbfTile2WebglLayers } from './renderer/webgl/tile/weblg_tile_processor_pbf';
import { PngTile2WebglLayers } from './renderer/webgl/tile/weblg_tile_processor_png';

export const TILE_RENDERER_SOURCE_PROCESSOR_CONFIG_MAP: Record<MapTileRendererType, TileSourceProcessor> = {
  [MapTileRendererType.webgl]: new TileSourceProcessor({
    [DataTileSourceType.pbf]: PbfTile2WebglLayers,
    [DataTileSourceType.png]: PngTile2WebglLayers,
  }),
};
