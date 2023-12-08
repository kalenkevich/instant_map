import axios from 'axios';
import earcut from 'earcut';
import Protobuf from 'pbf';
import { VectorTile, VectorTileLayer } from '@mapbox/vector-tile';
import { Feature, LineString, MultiPolygon, Polygon, MultiLineString, Point } from 'geojson';
import { MapTileFeatureType } from '../tile';
import { PbfTileLayer } from './pbf_tile';
import { getVerticiesFromText, getTextRectangleSize } from '../../../webgl/object/text/text_utils';
import { FontManager, FontManagerState } from '../../font_manager/font_manager';

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
  fontManagerState: FontManagerState;
}

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

function verticesFromLine(result: number[], coordinates: number[][]): number[] {
  // Dublicate last point from prev line
  if (result.length) {
    const prevX = result[result.length - 3];
    const prevY = result[result.length - 2];

    result.push(prevX, prevY, -1);
  }

  // Duplicate first point from new line
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

  for (let i = 0; i <= 360; i += step) {
    result.push(center[0]);
    result.push(center[1]);

    let j1 = (i * Math.PI) / 180;
    result.push(center[0] + Math.sin(j1) * radius);
    result.push(center[1] + Math.cos(j1) * radius);

    let j2 = ((i + step) * Math.PI) / 180;
    result.push(center[0] + Math.sin(j2) * radius);
    result.push(center[1] + Math.cos(j2) * radius);
  }

  return result;
}

const fontsCache: Record<string, Record<string, number[]>> = {};
export function textToVertices(
  result: number[],
  fontName: string,
  fontSize: number,
  fontManager: FontManager,
  text: string,
  point: number[]
): number[] {
  if (!text) {
    return result;
  }

  const font = fontManager.getFont(fontName);

  if (!fontsCache[fontName]) {
    fontsCache[fontName] = {};
  }
  const fontCache = fontsCache[fontName];
  const boundaries = getTextRectangleSize(font, 'G', [0, 0], fontSize);
  const upperLetterWidth = boundaries.width;

  let xOffset = 0;
  const textVerticies: number[] = [];
  for (const c of text) {
    if (!fontCache[c]) {
      const charVertecies: number[] = [];

      const { vertices, indices } = getVerticiesFromText(font, c, [0, 0], fontSize, true);
      for (const index of indices) {
        charVertecies.push(vertices[index * 2]);
        charVertecies.push(vertices[index * 2 + 1]);
      }

      fontCache[c] = charVertecies;
    }

    for (let i = 0; i < fontCache[c].length; i += 2) {
      textVerticies.push(point[0] + fontCache[c][i] + xOffset);
      textVerticies.push(point[1] + fontCache[c][i + 1]);
    }

    if (c === ' ') {
      xOffset += upperLetterWidth;
    } else {
      xOffset += getTextRectangleSize(font, c, [0, 0], fontSize).width * 1.3;
    }
  }

  // Center the text
  const halfWidthSize = xOffset / 2;
  for (let i = 0; i < textVerticies.length; i += 2) {
    result.push(textVerticies[i] - halfWidthSize);
    result.push(textVerticies[i + 1]);
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
    for (const line of geometry.coordinates) {
      verticesFromLine(result, line);
    }

    return result;
  }

  if (geometry.type === 'Point') {
    return verticesFromPoint(result, geometry.coordinates);
  }

  return result;
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
export async function fetchTile({ tileId, layers, url, fontManagerState }: FetchTileOptions): Promise<PbfTileLayer[]> {
  const [x, y, z] = tileId.split('/').map(Number);

  const tileURL = formatTileURL(tileId, url);
  const res = await axios.get(tileURL, {
    responseType: 'arraybuffer',
  });
  const fontManager = FontManager.fromState(fontManagerState);

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

    const text: number[] = [];
    const points: number[] = [];
    const lines: number[] = [];
    const polygons: number[] = [];

    for (let i = 0; i < numFeatures; i++) {
      const geojson = vectorTile.layers[layer].feature(i).toGeoJSON(x, y, z) as Feature<SupportedGeometry>;
      const type = getLayerPrimitive(geojson);

      if (type === 'point') {
        geometryToVertices(points, geojson.geometry);

        const textValue = geojson.properties.name || geojson.properties.label;
        if (textValue) {
          textToVertices(text, 'opensansBold', 2, fontManager, textValue, (geojson.geometry as Point).coordinates);
        }

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

    if (text.length) {
      features.push({
        type: MapTileFeatureType.text,
        primitiveType: FeaturePrimitiveType.TRIANGLES,
        numElements: points.length / 2,
        buffer: new Float32Array(text),
      });
    }

    tileLayers.push({ layer, features });
  }

  return tileLayers;
}
