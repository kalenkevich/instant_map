import tilebelt from '@mapbox/tilebelt';
import geometryCenter from '@turf/center';
// Common
import { MercatorProjection } from '../../../geo/projection/mercator_projection';
import { FontManager } from '../../../font/font_manager';
import { FontFormatType } from '../../../font/font_config';
// Tile
import { WebGlMapLayer } from './webgl_tile';
import { MapTileFeatureType } from '../../../tile/tile';
import { FetchTileOptions } from '../../../tile/tile_source_processor';
// Styles
import { DataTileSource, DataLayerStyle } from '../../../styles/styles';
// WebGl objects
import { SceneCamera } from '../../renderer';
import { LineGroupBuilder } from '../objects/line/line_builder';
import { LineJoinStyle, LineCapStyle, LineFillStyle } from '../objects/line/line';
import { TextVectorBuilder } from '../objects/text_vector/text_vector_builder';
import { TextTextureGroupBuilder } from '../objects/text_texture/text_texture_builder';

export async function DebugTile2WebglLayers(
  tileURL: string,
  source: DataTileSource,
  sourceLayers: DataLayerStyle[],
  {
    tileId,
    tileStyles,
    canvasWidth,
    canvasHeight,
    pixelRatio,
    zoom,
    tileSize,
    featureFlags,
    projectionViewMat,
    fontManagerState,
  }: FetchTileOptions,
  abortController: AbortController,
  onLayerReady: (tileLayer: WebGlMapLayer) => void
): Promise<WebGlMapLayer[]> {
  const [x, y, z] = tileId.split('/').map(Number);
  const projection = new MercatorProjection();
  const camera: SceneCamera = {
    distance: Math.pow(2, zoom) * tileSize,
    viewMatrix: projectionViewMat,
  };
  const fontManager = new FontManager(featureFlags, {}, fontManagerState);
  const tileLayers: WebGlMapLayer[] = [];

  const tilePolygon = tilebelt.tileToGeoJSON([x, y, z]);
  const tileCenter = geometryCenter(tilePolygon).geometry.coordinates as [number, number];
  const tileBbox = tilePolygon.coordinates[0] as Array<[number, number]>;
  const lineGroupBuilder = new LineGroupBuilder(featureFlags, pixelRatio);
  const textTextureGroupBuilder =
    featureFlags.webglRendererFontFormatType === FontFormatType.vector
      ? new TextVectorBuilder(featureFlags, pixelRatio, fontManager)
      : new TextTextureGroupBuilder(featureFlags, pixelRatio, fontManager);

  textTextureGroupBuilder.addObject({
    id: 1,
    type: MapTileFeatureType.text,
    text: tileId,
    center: projection.fromLngLat(tileCenter),
    font: 'defaultFont',
    fontSize: 24,
    borderWidth: 1,
    color: [0, 0, 0, 1],
    borderColor: [1, 1, 1, 1],
    margin: {
      top: 0,
      left: 0,
    },
  });

  lineGroupBuilder.addObject({
    id: 2,
    type: MapTileFeatureType.line,
    color: [1, 0, 0, 1],
    borderColor: [0, 0, 0, 1],
    vertecies: tileBbox.map(p => projection.fromLngLat(p)),
    width: 3,
    borderWidth: 0,
    fill: LineFillStyle.solid,
    join: LineJoinStyle.miter,
    cap: LineCapStyle.square,
  });

  const debugObjectGroups = [
    textTextureGroupBuilder.build(camera, `${tileId}_debugLayer_text`, 99),
    lineGroupBuilder.build(camera, `${tileId}_debugLayer_line`, 99),
  ];
  const debugLayer: WebGlMapLayer = {
    source: 'debug',
    layerName: 'debugLayer',
    tileId,
    zIndex: 99,
    objectGroups: debugObjectGroups,
  };
  tileLayers.push(debugLayer);
  onLayerReady(debugLayer);

  return tileLayers;
}
