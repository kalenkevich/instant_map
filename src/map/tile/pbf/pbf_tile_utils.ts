import { Feature, Polygon, MultiLineString } from 'geojson';
import { VectorTile, VectorTileFeature, VectorTileLayer } from '@mapbox/vector-tile';
import { DataTileStyles } from '../../styles/styles';
import { TileLayers } from '../tile';
import { TileLayer } from '../tile_layer';

export function getTileLayers(tileData: VectorTile, tileStyles: DataTileStyles): TileLayers {
  if (!tileData) {
    return {};
  }

  const tileLayersMap: TileLayers = {};

  for (const layerName of Object.keys(tileData.layers)) {
    const layer: VectorTileLayer | undefined = tileData?.layers[layerName];

    const features: Feature[] = [];
    for (let i = 0; i < layer.length; i++) {
      features.push(getGeoJsonFeatureFromVectorTile(layer.feature(i)));
    }

    tileLayersMap[layerName] = new TileLayer({
      name: layerName,
      features,
      properties: {},
      styles: tileStyles?.[layerName],
    });
  }

  return tileLayersMap;
}

export const getGeoJsonFeatureFromVectorTile = (vectorTileFeature: VectorTileFeature): Feature => {
  return {
    id: vectorTileFeature.id,
    type: 'Feature',
    bbox: vectorTileFeature.bbox(),
    geometry: getGeometry(vectorTileFeature),
    properties: vectorTileFeature.properties,
  };
};

const getGeometry = (vectorTileFeature: VectorTileFeature): MultiLineString | Polygon => {
  const geometry = vectorTileFeature.loadGeometry().map(points => points.map(p => [p.x, p.y]));

  return {
    type: 'MultiLineString',
    coordinates: geometry,
  };
};
