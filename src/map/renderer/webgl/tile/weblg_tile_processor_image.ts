import { vec2 } from 'gl-matrix';
import tilebelt from '@mapbox/tilebelt';
// Common
import { MercatorProjection } from '../../../geo/projection/mercator_projection';
// Tile
import { MapTileFeatureType } from '../../../tile/tile';
import { FetchTileOptions } from '../../../tile/tile_source_processor';
import { WebGlMapLayer } from './webgl_tile';
// Styles
import { DataLayerStyle, ImageStyle, ImageTileSource } from '../../../styles/styles';
import { compileStatement } from '../../../styles/style_statement_utils';
// WebGl objects
import { SceneCamera } from '../../renderer';
import { ImageGroupBuilder } from '../objects/image/image_group_builder';
import { ImageBitmapTextureSource } from '../../../texture/texture';
import { blobToBitmapImageTextureSource } from '../../../texture/texture_utils';

export async function ImageTile2WebglLayers(
  tileURL: string,
  source: ImageTileSource,
  sourceLayers: DataLayerStyle[],
  {
    tileId,
    tileStyles,
    canvasWidth,
    canvasHeight,
    pixelRatio,
    zoom,
    tileSize,
    projectionViewMat,
    featureFlags,
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
  const tileLayers: WebGlMapLayer[] = [];

  const sourceArrayBuffer = await fetch(tileURL, { signal: abortController.signal }).then(res => res.blob());
  const textureSource: ImageBitmapTextureSource = await blobToBitmapImageTextureSource(sourceArrayBuffer);

  const tilePolygon = tilebelt.tileToGeoJSON([x, y, z]);
  const tilebbox = tilebelt.tileToBBOX([x, y, z]);

  for (const styleLayer of sourceLayers) {
    if (styleLayer.show === false) {
      continue;
    }

    const imageFeatureStyle = styleLayer.feature as ImageStyle;
    const showFeature = styleLayer.feature.show !== undefined ? compileStatement(styleLayer.feature.show, {}) : true;
    if (!showFeature) {
      continue;
    }

    const imageGroupBuilder = new ImageGroupBuilder(featureFlags, pixelRatio);
    imageGroupBuilder.addObject({
      id: 0,
      type: MapTileFeatureType.image,
      name: tileId,
      bbox: [
        [...projection.fromLngLat([tilebbox[0], tilebbox[1]])],
        [...projection.fromLngLat([tilebbox[2], tilebbox[3]])],
      ],
      topLeft: tilePolygon.coordinates[0][0] as vec2,
      source: textureSource,
      width: imageFeatureStyle.width ? compileStatement(imageFeatureStyle.width, {}) : tileSize,
      height: imageFeatureStyle.height ? compileStatement(imageFeatureStyle.height, {}) : tileSize,
      pixelRatio: source.pixelRatio || 1,
      margin: imageFeatureStyle.margin ?? compileStatement(imageFeatureStyle.margin, {}),
    });

    const layers: WebGlMapLayer = {
      tileId,
      source: source.name,
      layerName: styleLayer.styleLayerName,
      zIndex: styleLayer.zIndex,
      objectGroups: [
        imageGroupBuilder.build(camera, `${tileId}_${styleLayer.styleLayerName}_images`, styleLayer.zIndex),
      ],
    };
    onLayerReady(layers);
    tileLayers.push(layers);
  }

  return tileLayers;
}
