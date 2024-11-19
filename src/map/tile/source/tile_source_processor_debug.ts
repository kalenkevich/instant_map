import tilebelt from '@mapbox/tilebelt';
import geometryCenter from '@turf/center';
import { MapTile, getTileRef } from '../tile';
import { MapFeatureType, LineFillStyle, LineJoinStyle, LineCapStyle, TextAlign } from '../feature';
import { MapFeatureFlags } from '../../flags';
import { DataTileSource, DataLayerStyle } from '../../styles/styles';
import { TileSourceProcessOptions } from './tile_source_processor';
import { getProjectionFromType } from '../../geo/projection/projection';

export async function DebugTileSourceProcessor(
  featureFlags: MapFeatureFlags,
  tileSourceUrl: string,
  abortController: AbortController,
  source: DataTileSource,
  sourceLayers: DataLayerStyle[],
  processOptions: TileSourceProcessOptions,
): Promise<MapTile> {
  const tileId = processOptions.tileId;
  const tileRef = getTileRef(tileId);
  const [x, y, z] = tileRef.map(Number);
  const projection = getProjectionFromType(processOptions.projectionType);
  const tilePolygon = tilebelt.tileToGeoJSON([x, y, z]);
  const tileCenter = geometryCenter(tilePolygon).geometry.coordinates as [number, number];
  const tileBbox = tilePolygon.coordinates[0] as Array<[number, number]>;

  return Promise.resolve({
    ref: tileRef,
    tileId,
    layers: [
      {
        source: 'debug',
        layerName: 'debugLayer',
        tileId,
        zIndex: 99,
        features: [
          {
            id: 2,
            type: MapFeatureType.line,
            color: [1, 0, 0, 1],
            borderColor: [0, 0, 0, 1],
            vertecies: tileBbox.map(p => projection.project(p, { normalize: true, clip: false })),
            width: 10,
            borderWidth: 0,
            fill: LineFillStyle.solid,
            join: LineJoinStyle.miter,
            cap: LineCapStyle.square,
            visible: true,
          },
          {
            id: 1,
            type: MapFeatureType.text,
            text: processOptions.tileId,
            center: projection.project(tileCenter, { normalize: true, clip: false }),
            font: 'defaultFont',
            fontSize: 28,
            borderWidth: 1,
            color: [1, 0, 0, 1],
            borderColor: [1, 1, 1, 1],
            align: TextAlign.center,
            visible: true,
            rank: 0,
          },
        ],
      },
    ],
  });
}
