import axios from 'axios';
import earcut from 'earcut';
import Protobuf from 'pbf';
import { VectorTile, VectorTileLayer } from '@mapbox/vector-tile';
import { Feature, LineString, MultiPolygon, Polygon, MultiLineString, Point } from 'geojson';
import { MapTileFeatureType } from '../tile';
import { PbfTileLayer } from './pbf_tile';

export enum FeaturePrimitiveType {
  POINTS = 0x0000,
  LINES = 0x0001,
  LINE_LOOP = 0x0002,
  LINE_STRIP = 0x0003,
  TRIANGLES = 0x0004,
  TRIANGLE_STRIP = 0x0005,
  TRIANGLE_FAN = 0x0006,
}

export type SupportedGeometry = Polygon | MultiPolygon | LineString | MultiLineString | Point;

export interface FetchTileOptions {
  tileId: string;
  url: string;
  layers: Record<string, VectorTileLayer>;
}

// convert a GeoJSON polygon into triangles
function verticesFromPolygon(result: number[], coordinates: number[][][]): number[] {
  const data = earcut.flatten(coordinates);
  const triangles = earcut(data.vertices, data.holes, 2);

  for (let i = 0; i < triangles.length; i++) {
    const point = triangles[i];
    result.push(data.vertices[point * 2]);
    result.push(data.vertices[point * 2 + 1]);
  }

  return result;
}

// when constructing a line with gl.LINES, every 2 coords are connected,
// so we always duplicate the last starting point to draw a continuous line
function verticesFromLine(result: number[], coordinates: number[][]): number[] {
  if (result.length) {
    const prevX = result[result.length - 3];
    const prevY = result[result.length - 2];

    result.push(prevX, prevY, -1);
  }

  // seed with initial line segment
  result.push(coordinates[0][0], coordinates[0][1], -1);
  result.push(coordinates[0][0], coordinates[0][1], 1);
  result.push(coordinates[1][0], coordinates[1][1], 1);

  for (let i = 2; i < coordinates.length; i++) {
    const prevX = result[result.length - 3];
    const prevY = result[result.length - 2];
    const prevZ = result[result.length - 1];
    result.push(prevX, prevY, prevZ); // duplicate prev coord
    result.push(coordinates[i][0], coordinates[i][1], 1);
  }

  return result;
}

function verticesFromPoint(result: number[], coordinates: number[]): number[] {
  const radius = 0.0001;
  const components = 32;
  const center = coordinates as [number, number];
  const step = 360 / components;

  let offset = 0;
  for (let i = 0; i <= 360; i += step) {
    result[offset++] = center[0];
    result[offset++] = center[1];

    let j1 = (i * Math.PI) / 180;
    result[offset++] = center[0] + Math.sin(j1) * radius;
    result[offset++] = center[1] + Math.cos(j1) * radius;

    let j2 = ((i + step) * Math.PI) / 180;
    result[offset++] = center[0] + Math.sin(j2) * radius;
    result[offset++] = center[1] + Math.cos(j2) * radius;
  }

  return result;
}

// convert a GeoJSON geometry to webgl vertices
export function geometryToVertices(result: number[], geometry: SupportedGeometry): number[] {
  if (geometry.type === 'Polygon') {
    return verticesFromPolygon(result, geometry.coordinates);
  }

  if (geometry.type === 'MultiPolygon') {
    for (const polygons of geometry.coordinates) {
      verticesFromPolygon(result, [polygons[0]]);
    }

    return result;
  }

  if (geometry.type === 'LineString') {
    return verticesFromLine(result, geometry.coordinates);
  }

  if (geometry.type === 'MultiLineString') {
    return [];
    // const positions: number[] = [];

    // for (const line of geometry.coordinates) {
    //   const vertecies = verticesFromLine(line);
    //   for (const v of vertecies) {
    //     positions.push(v);
    //   }
    // }

    // return positions;
  }

  if (geometry.type === 'Point') {
    return verticesFromPoint(result, geometry.coordinates);
  }

  return [];
}

function formatTileURL(tileId: string, url: string) {
  const [x, y, z] = tileId.split('/');
  return url.replace('{x}', x).replace('{y}', y).replace('{z}', z);
}

function getLayerPrimitive(feature: Feature<SupportedGeometry>): MapTileFeatureType {
  const type = feature.geometry.type;
  if (type === 'Polygon' || type === 'MultiPolygon') {
    return MapTileFeatureType.polygon;
  }

  if (type === 'Point') {
    return MapTileFeatureType.point;
  }

  if (type === 'LineString' || type === 'MultiLineString') {
    return MapTileFeatureType.line;
  }

  console.log('Unknown feature type', type);

  return MapTileFeatureType.polygon;
}

// Fetch tile from server, and convert layer coordinates to vertices
export async function fetchTile({ tileId, layers, url }: FetchTileOptions): Promise<PbfTileLayer[]> {
  const [x, y, z] = tileId.split('/').map(Number);

  const tileURL = formatTileURL(tileId, url);
  const res = await axios.get(tileURL, {
    responseType: 'arraybuffer',
  });

  const pbf = new Protobuf(res.data);
  const vectorTile = new VectorTile(pbf);

  const tileLayers: PbfTileLayer[] = [];
  for (const layer in layers) {
    if (!vectorTile?.layers?.[layer]) {
      continue;
    }
    // @ts-ignore
    const numFeatures = vectorTile.layers[layer]?._features?.length || 0;

    const features = [];

    const points: number[] = [];
    const lines: number[] = [];
    const polygons: number[] = [];

    for (let i = 0; i < numFeatures; i++) {
      const geojson = vectorTile.layers[layer].feature(i).toGeoJSON(x, y, z) as Feature<SupportedGeometry>;
      const type = getLayerPrimitive(geojson);

      if (type === 'point') {
        geometryToVertices(points, geojson.geometry);
        continue;
      }

      if (type === 'line') {
        geometryToVertices(lines, geojson.geometry);
        continue;
      }

      if (type === 'polygon') {
        geometryToVertices(polygons, geojson.geometry);
        continue;
      }
    }

    if (polygons.length) {
      features.push({
        type: MapTileFeatureType.polygon,
        primitiveType: FeaturePrimitiveType.TRIANGLES,
        numElements: polygons.length / 2,
        buffer: new Float32Array(polygons),
      });
    }

    if (lines.length) {
      features.push({
        type: MapTileFeatureType.line,
        primitiveType: FeaturePrimitiveType.TRIANGLES,
        numElements: lines.length / 3,
        buffer: new Float32Array(lines),
      });
    }

    if (points.length) {
      features.push({
        type: MapTileFeatureType.point,
        primitiveType: FeaturePrimitiveType.TRIANGLES,
        numElements: points.length / 2,
        buffer: new Float32Array(points),
      });
    }

    tileLayers.push({ layer, features });
  }

  return tileLayers;
}
