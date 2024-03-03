import tilebelt from '@mapbox/tilebelt';
import geometryCenter from '@turf/center';
import { mat3 } from 'gl-matrix';
// Common
import { MercatorProjection } from '../../../geo/projection/mercator_projection';
import { FontManager } from '../../../font/font_manager';
// Tile
import { WebGlMapLayer } from './webgl_tile';
import { MapTileFeatureType } from '../../../tile/tile';
import { FetchTileOptions } from '../../../tile/tile_source_processor';
// Styles
import { DataTileSource, DataLayerStyle } from '../../../styles/styles';
// WebGl objects
import { LineGroupBuilder } from '../objects/line/line_builder';
import { LineJoinStyle, LineCapStyle, LineFillStyle } from '../objects/line/line';
import { TextPolygonBuilder } from '../objects/text_polygon/text_polygon_builder';
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
    projectionViewMat: projectionViewMatSource,
    fontManagerState,
  }: FetchTileOptions
): Promise<WebGlMapLayer[]> {
  const minZoom = tileStyles.minzoom || 0;
  const maxZoom = tileStyles.maxzoom || 0;
  const [x, y, z] = tileId.split('/').map(Number);
  const projection = new MercatorProjection();
  const projectionViewMat = mat3.fromValues(...projectionViewMatSource);
  const fontManager = featureFlags.webglRendererUsePolygonText && FontManager.fromState(featureFlags, fontManagerState);
  const tileLayers: WebGlMapLayer[] = [];

  const tilePolygon = tilebelt.tileToGeoJSON([x, y, z]);
  const tileCenter = geometryCenter(tilePolygon).geometry.coordinates as [number, number];
  const tileBbox = tilePolygon.coordinates[0] as Array<[number, number]>;
  const lineGroupBuilder = new LineGroupBuilder(
    projectionViewMat,
    canvasWidth,
    canvasHeight,
    pixelRatio,
    zoom,
    minZoom,
    maxZoom,
    tileSize,
    projection,
    featureFlags
  );
  const textTextureGroupBuilder = featureFlags.webglRendererUsePolygonText
    ? new TextPolygonBuilder(
        projectionViewMat,
        canvasWidth,
        canvasHeight,
        pixelRatio,
        zoom,
        minZoom,
        maxZoom,
        tileSize,
        projection,
        featureFlags,
        fontManager
      )
    : new TextTextureGroupBuilder(
        projectionViewMat,
        canvasWidth,
        canvasHeight,
        pixelRatio,
        zoom,
        minZoom,
        maxZoom,
        tileSize,
        projection,
        featureFlags
      );

  textTextureGroupBuilder.addObject({
    id: 1,
    type: MapTileFeatureType.text,
    text: tileId,
    center: tileCenter,
    font: 'opensans',
    fontSize: 24,
    borderWidth: 1,
    color: [1, 1, 1, 1],
    borderColor: [0, 0, 0, 1],
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
    vertecies: tileBbox,
    width: 3,
    borderWidth: 0,
    fill: LineFillStyle.solid,
    join: LineJoinStyle.miter,
    cap: LineCapStyle.square,
  });

  const debugObjectGroups = [await textTextureGroupBuilder.build(), lineGroupBuilder.build()];
  const debugLayer: WebGlMapLayer = {
    source: 'debug',
    layerName: 'debugLayer',
    tileId,
    zIndex: 99,
    objectGroups: debugObjectGroups,
  };
  tileLayers.push(debugLayer);

  return tileLayers;
}
