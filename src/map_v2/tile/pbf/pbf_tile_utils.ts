import axios from 'axios';
import earcut from 'earcut';
import Protobuf from 'pbf';
import { VectorTile, VectorTileLayer } from '@mapbox/vector-tile';
import { Feature, LineString, MultiPolygon, Polygon, MultiLineString, Point } from 'geojson';
import { MapTileFeatureType } from '../tile';
import { PbfTileLayer } from './pbf_tile';

export enum FeaturePrimiiveType {
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
function verticesFromPolygon(coordinates: number[][][]): number[] {
  const data = earcut.flatten(coordinates);
  const triangles = earcut(data.vertices, data.holes, 2);

  const vertices = new Array(triangles.length * 2);
  for (let i = 0; i < triangles.length; i++) {
    const point = triangles[i];
    vertices[i * 2] = data.vertices[point * 2];
    vertices[i * 2 + 1] = data.vertices[point * 2 + 1];
  }

  return vertices;
}

// when constructing a line with gl.LINES, every 2 coords are connected,
// so we always duplicate the last starting point to draw a continuous line
function verticesFromLine(coordinates: number[][]): number[] {
  // seed with initial line segment
  const vertices: number[] = [coordinates[0][0], coordinates[0][1], coordinates[1][0], coordinates[1][1]];

  for (let i = 2; i < coordinates.length; i++) {
    const prevX = vertices[vertices.length - 2];
    const prevY = vertices[vertices.length - 1];
    vertices.push(prevX, prevY); // duplicate prev coord
    vertices.push(coordinates[i][0], coordinates[i][1]);
  }

  return vertices;
}

function verticesFromPoint(coordinates: number[]): number[] {
  const radius = 0.0001;
  const components = 32;
  const center = coordinates as [number, number];
  const step = 360 / components;

  const data = [];
  let offset = 0;
  for (let i = 0; i <= 360; i += step) {
    data[offset++] = center[0];
    data[offset++] = center[1];

    let j1 = (i * Math.PI) / 180;
    data[offset++] = center[0] + Math.sin(j1) * radius;
    data[offset++] = center[1] + Math.cos(j1) * radius;

    let j2 = ((i + step) * Math.PI) / 180;
    data[offset++] = center[0] + Math.sin(j2) * radius;
    data[offset++] = center[1] + Math.cos(j2) * radius;
  }

  return data;
}

// convert a GeoJSON geometry to webgl vertices
export function geometryToVertices(geometry: SupportedGeometry): number[] {
  if (geometry.type === 'Polygon') {
    return verticesFromPolygon(geometry.coordinates);
  }

  if (geometry.type === 'MultiPolygon') {
    const positions: number[] = [];

    for (const polygons of geometry.coordinates) {
      const vertecies = verticesFromPolygon([polygons[0]]);

      for (const v of vertecies) {
        positions.push(v);
      }
    }

    return positions;
  }

  if (geometry.type === 'LineString') {
    return verticesFromLine(geometry.coordinates);
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
    return verticesFromPoint(geometry.coordinates);
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
    const lineFeatures = [];
    let pointsCount = 0;

    // convert feature to vertices
    for (let i = 0; i < numFeatures; i++) {
      const geojson = vectorTile.layers[layer].feature(i).toGeoJSON(x, y, z) as Feature<SupportedGeometry>;
      const type = getLayerPrimitive(geojson);

      if (type === 'point') {
        pointsCount++;
        points.push(...geometryToVertices(geojson.geometry));

        continue;
      }

      if (type === 'line') {
        const lineData = geometryToVertices(geojson.geometry);

        if (lineData.length) {
          features.push({
            type: MapTileFeatureType.line,
            primitiveType: FeaturePrimiiveType.TRIANGLES,
            numElements: lineData.length / 2,
            buffer: new Float32Array(lineData),
          });
        }

        continue;
      }

      if (type === 'polygon') {
        const polyData = geometryToVertices(geojson.geometry);
        for (const pd of polyData) {
          polygons.push(pd);
        }

        continue;
      }
    }

    if (points.length) {
      features.push({
        type: MapTileFeatureType.point,
        primitiveType: FeaturePrimiiveType.TRIANGLES,
        numElements: points.length / 2,
        buffer: new Float32Array(points),
      });
    }

    if (polygons.length) {
      features.push({
        type: MapTileFeatureType.polygon,
        primitiveType: FeaturePrimiiveType.TRIANGLES,
        numElements: polygons.length / 2,
        buffer: new Float32Array(polygons),
      });
    }

    tileLayers.push({ layer, features });
  }

  return tileLayers;
}
