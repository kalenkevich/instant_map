import tilebelt from '@mapbox/tilebelt';
import { MapTile, MapTileLayer, getTileRef } from '../tile';
import { MapFeatureType } from '../feature';
import { TileSourceProcessOptions } from './tile_source_processor';
import { MapFeatureFlags } from '../../flags';
import { ImageTileSource, DataLayerStyle, ImageStyle } from '../../styles/styles';
import { compileStatement } from '../../styles/style_statement_utils';
import { getProjectionFromType } from '../../geo/projection/projection';
import { blobToBitmapImageTextureSource } from '../../texture/texture_utils';

export async function ImageTileSourceProcessor(
  featureFlags: MapFeatureFlags,
  tileSourceUrl: string,
  abortController: AbortController,
  source: ImageTileSource,
  sourceLayers: DataLayerStyle[],
  processOptions: TileSourceProcessOptions,
): Promise<MapTile> {
  const tileId = processOptions.tileId;
  const tileRef = getTileRef(tileId);
  const tileSize = processOptions.tileSize;

  const [x, y, z] = tileRef.map(Number);
  const projection = getProjectionFromType(processOptions.projectionType);
  const textureSource = await fetch(tileSourceUrl, { signal: abortController.signal })
    .then(res => res.blob())
    .then(sourceArrayBuffer => blobToBitmapImageTextureSource(sourceArrayBuffer));
  const tilePolygon = tilebelt.tileToGeoJSON([x, y, z]);
  const tilebbox = tilebelt.tileToBBOX([x, y, z]);

  const layers: MapTileLayer[] = [];

  for (const styleLayer of sourceLayers) {
    if (styleLayer.show === false) {
      continue;
    }

    const imageFeatureStyle = styleLayer.feature as ImageStyle;
    const showFeature = styleLayer.feature.show !== undefined ? compileStatement(styleLayer.feature.show, {}) : true;
    if (!showFeature) {
      continue;
    }

    layers.push({
      tileId,
      source: source.name,
      layerName: styleLayer.styleLayerName,
      zIndex: styleLayer.zIndex,
      features: [
        {
          id: 0,
          type: MapFeatureType.image,
          bbox: [
            [...projection.project([tilebbox[0], tilebbox[1]], { normalize: true, clip: false })],
            [...projection.project([tilebbox[2], tilebbox[3]], { normalize: true, clip: false })],
          ],
          topLeft: tilePolygon.coordinates[0][0] as [number, number],
          source: textureSource,
          width: imageFeatureStyle.width ? compileStatement(imageFeatureStyle.width, {}) : tileSize,
          height: imageFeatureStyle.height ? compileStatement(imageFeatureStyle.height, {}) : tileSize,
          pixelRatio: source.pixelRatio || 1,
          offset: {
            top: imageFeatureStyle.offset?.top ? compileStatement(imageFeatureStyle.offset?.top, {}) : 0,
            left: imageFeatureStyle.offset?.left ? compileStatement(imageFeatureStyle.offset?.left, {}) : 0,
          },
        },
      ],
    });
  }

  return {
    ref: tileRef,
    tileId,
    layers,
  };
}
