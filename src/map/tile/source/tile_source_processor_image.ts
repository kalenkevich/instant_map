import tilebelt from '@mapbox/tilebelt';
import { MapTile, MapTileLayer, getTileRef } from '../tile';
import { ImageMapFeature, MapFeatureType } from '../feature';
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

  const [x, y, z] = tileRef;
  const projection = getProjectionFromType(processOptions.projectionType);
  const sourceArrayBuffer = await fetch(tileSourceUrl, { signal: abortController.signal }).then(res => res.blob());
  const textureSource = await blobToBitmapImageTextureSource(sourceArrayBuffer);
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
          name: tileId,
          bbox: [
            [...projection.fromLngLat([tilebbox[0], tilebbox[1]])],
            [...projection.fromLngLat([tilebbox[2], tilebbox[3]])],
          ],
          topLeft: tilePolygon.coordinates[0][0] as [number, number],
          source: textureSource,
          width: imageFeatureStyle.width ? compileStatement(imageFeatureStyle.width, {}) : tileSize,
          height: imageFeatureStyle.height ? compileStatement(imageFeatureStyle.height, {}) : tileSize,
          pixelRatio: source.pixelRatio || 1,
          margin: imageFeatureStyle.margin ?? compileStatement(imageFeatureStyle.margin, {}),
        } as ImageMapFeature,
      ],
    });
  }

  return {
    ref: tileRef,
    tileId,
    layers,
  };
}
