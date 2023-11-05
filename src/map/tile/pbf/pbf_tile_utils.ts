import { Feature, Polygon, Point, MultiLineString } from 'geojson';
import { VectorTile, VectorTileFeature, VectorTileLayer } from '@mapbox/vector-tile';
import { DataLayerStyle, DataTileStyles } from '../../styles/styles';
import { TileLayers } from '../tile';
import { TileLayer } from '../tile_layer';
import { v2 } from '../../../webgl';
import { simplify } from './simplify';

enum VectorTileFeatureType {
  Unknown = 0,
  Point = 1,
  LineString = 2,
  Polygon = 3,
}

export function getTileLayers(tileData: VectorTile, tileStyles: DataTileStyles): TileLayers {
  if (!tileData) {
    return {};
  }

  const tileLayersMap: TileLayers = {};

  for (const styleLayer of Object.values(tileStyles.layers)) {
    const sourceLayer = getSourceName(styleLayer);
    const layer: VectorTileLayer | undefined = tileData.layers[sourceLayer];

    if (!layer || styleLayer.show === false) {
      continue;
    }

    const features: Feature<Point | MultiLineString | Polygon>[] = [];
    for (let i = 0; i < layer.length; i++) {
      features.push(getGeoJsonFeatureFromVectorTile(layer.feature(i)));
    }

    tileLayersMap[styleLayer.styleLayerName] = new TileLayer({
      name: sourceLayer,
      features,
      properties: {},
      styles: styleLayer,
    });
  }

  return tileLayersMap;
}

export const getGeoJsonFeatureFromVectorTile = (
  vectorTileFeature: VectorTileFeature
): Feature<Point | MultiLineString | Polygon> => {
  return {
    id: vectorTileFeature.id,
    type: 'Feature',
    bbox: vectorTileFeature.bbox(),
    geometry: getVectorTileGeometry(vectorTileFeature),
    properties: vectorTileFeature.properties,
  };
};

export const getVectorTileGeometry = (vectorTileFeature: VectorTileFeature): Point | MultiLineString | Polygon => {
  const geometry = vectorTileFeature.loadGeometry();

  if (vectorTileFeature.type === VectorTileFeatureType.Point) {
    const coordinates: v2 = [geometry[0][0].x, geometry[0][0].y];

    return {
      type: 'Point',
      coordinates,
    };
  }

  if (vectorTileFeature.type === VectorTileFeatureType.LineString) {
    const lines: v2[][] = [];

    for (const line of geometry) {
      const newLine: v2[] = [];

      for (const point of line) {
        newLine.push([point.x, point.y]);
      }

      lines.push(simplify(newLine, 10, false) as v2[]);
    }

    return {
      type: 'MultiLineString',
      coordinates: lines,
    };
  }

  if (vectorTileFeature.type === VectorTileFeatureType.Polygon) {
    const rings: v2[][] = [];

    for (const ring of geometry) {
      const newRing: v2[] = [];

      for (const point of ring) {
        newRing.push([point.x, point.y]);
      }

      rings.push(simplify(newRing, 10, true) as v2[]);
    }

    return {
      type: 'Polygon',
      coordinates: rings,
    };
  }
};

export const getSourceName = (style: DataLayerStyle): string => {
  if (typeof style.sourceLayer === 'string') {
    return style.sourceLayer;
  }

  return style.sourceLayer.name;
};
