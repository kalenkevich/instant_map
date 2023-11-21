import axios from 'axios';
import earcut from 'earcut';
import Protobuf from 'pbf';
import { VectorTile, VectorTileLayer } from '@mapbox/vector-tile';
import { Feature, LineString, MultiPolygon, Polygon, MultiLineString, Point } from 'geojson';
import MercatorCoordinate from './mercator-coordinate';

export type SupportedGeometry = Polygon | MultiPolygon | LineString | MultiLineString | Point;

export interface FetchTileOptions {
  tile: string;
  url: string;
  layers: Record<string, VectorTileLayer>;
}

// convert a GeoJSON polygon into triangles
const verticesFromPolygon = (coordinates: number[][][]): number[] => {
  const data = earcut.flatten(coordinates);
  const triangles = earcut(data.vertices, data.holes, 2);

  const vertices = new Array(triangles.length * 2);
  for (let i = 0; i < triangles.length; i++) {
    const point = triangles[i];
    const lng = data.vertices[point * 2];
    const lat = data.vertices[point * 2 + 1];
    const [x, y] = MercatorCoordinate.fromLngLat([lng, lat]);
    vertices[i * 2] = x;
    vertices[i * 2 + 1] = y;
  }

  return vertices;
};

// when constructing a line with gl.LINES, every 2 coords are connected,
// so we always duplicate the last starting point to draw a continuous line
const verticesFromLine = (coordinates: number[][]): number[] => {
  // seed with initial line segment
  const vertices = [
    ...MercatorCoordinate.fromLngLat(coordinates[0] as [number, number]),
    ...MercatorCoordinate.fromLngLat(coordinates[1] as [number, number]),
  ];

  for (let i = 2; i < coordinates.length; i++) {
    const prevX = vertices[vertices.length - 2];
    const prevY = vertices[vertices.length - 1];
    vertices.push(prevX, prevY); // duplicate prev coord
    vertices.push(...MercatorCoordinate.fromLngLat(coordinates[i] as [number, number]));
  }

  return vertices;
};

// doing an array.push with too many values can cause
// stack size errors, so we manually iterate and append
const append = (arr1: number[], arr2: number[]) => {
  arr2.forEach(n => {
    arr1[arr1.length] = n;
  });
};

// convert a GeoJSON geometry to webgl vertices
export const geometryToVertices = (geometry: SupportedGeometry): number[] => {
  if (geometry.type === 'Polygon') {
    return verticesFromPolygon(geometry.coordinates);
  }

  if (geometry.type === 'MultiPolygon') {
    const positions: number[] = [];
    geometry.coordinates.forEach((polygon, i) => {
      append(positions, verticesFromPolygon([polygon[0]]));
    });

    return positions;
  }

  if (geometry.type === 'LineString') {
    return verticesFromLine(geometry.coordinates);
  }

  if (geometry.type === 'MultiLineString') {
    const positions: number[] = [];
    geometry.coordinates.forEach((lineString, i) => {
      append(positions, verticesFromLine(lineString));
    });

    return positions;
  }

  if (geometry.type === 'Point') {
    return MercatorCoordinate.fromLngLat(geometry.coordinates as [number, number]);
  }

  return [];
};

const formatTileURL = (tileId: string, url: string) => {
  const [x, y, z] = tileId.split('/');
  return url.replace('{x}', x).replace('{y}', y).replace('{z}', z);
};

const getLayerPrimitive = (feature: Feature<SupportedGeometry>) => {
  const type = feature.geometry.type;
  if (type === 'Polygon' || type === 'MultiPolygon') {
    return 'polygon';
  }
  if (type === 'Point') {
    return 'point';
  }
  if (type === 'LineString' || type === 'MultiLineString') {
    return 'line';
  }
  console.log('Unknown feature type', type);
  return 'unknown';
};

// Fetch tile from server, and convert layer coordinates to vertices
export const fetchTile = async ({ tile, layers, url }: FetchTileOptions) => {
  const [x, y, z] = tile.split('/').map(Number);

  const tileURL = formatTileURL(tile, url);
  const res = await axios.get(tileURL, {
    responseType: 'arraybuffer',
  });

  const pbf = new Protobuf(res.data);
  const vectorTile = new VectorTile(pbf);

  const tileData = []; // layers -> featureSets
  for (const layer in layers) {
    if (vectorTile?.layers?.[layer]) {
      // @ts-ignore
      const numFeatures = vectorTile.layers[layer]?._features?.length || 0;

      const polygons = [];
      const points = [];
      const lines = [];

      // convert feature to vertices
      for (let i = 0; i < numFeatures; i++) {
        const geojson = vectorTile.layers[layer].feature(i).toGeoJSON(x, y, z) as Feature<SupportedGeometry>;
        const type = getLayerPrimitive(geojson);

        if (type === 'polygon') {
          const polyData = geometryToVertices(geojson.geometry);
          for (const pd of polyData) {
            polygons.push(pd);
          }
        } else if (type === 'point') {
          points.push(...geometryToVertices(geojson.geometry));
        } else if (type === 'line') {
          lines.push(...geometryToVertices(geojson.geometry));
        }
      }

      tileData.push({ layer, type: 'polygon', vertices: Float32Array.from(polygons) });
      tileData.push({ layer, type: 'point', vertices: Float32Array.from(points) });
      tileData.push({ layer, type: 'line', vertices: Float32Array.from(lines) });
    }
  }

  return tileData;
};
