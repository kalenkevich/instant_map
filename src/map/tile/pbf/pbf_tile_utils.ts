import axios from 'axios';
import Protobuf from 'pbf';
import { vec4 } from 'gl-matrix';
import { VectorTile } from '@mapbox/vector-tile';
import { Feature, LineString, MultiPolygon, Polygon, MultiLineString, Point, MultiPoint } from 'geojson';
import { MapTileFeatureType } from '../tile';
import { PbfTileLayer } from './pbf_tile';
import { FontManager, FontManagerState } from '../../font_manager/font_manager';
// Styles
import { DataTileStyles, LineStyle, PointStyle, PolygonStyle, TextStyle } from '../../styles/styles';
import { compileStatement } from '../../styles/style_statement_utils';
// WEBGL specific
import { WebGlObjectBufferredGroup } from '../../renderer/webgl/object/object';
import { LineJoinStyle, LineCapStyle, LineFillStyle } from '../../renderer/webgl/line/line';
import { PointGroupBuilder } from '../../renderer/webgl/point/point_builder';
import { PolygonGroupBuilder } from '../../renderer/webgl/polygon/polygon_builder';
import { LineGroupBuilder } from '../../renderer/webgl/line/line_builder';
import { TextGroupBuilder } from '../../renderer/webgl/text/text_builder';

export type SupportedGeometry = Polygon | MultiPolygon | LineString | MultiLineString | Point | MultiPoint;

export interface FetchTileOptions {
  tileId: string;
  url: string;
  tileStyles: DataTileStyles;
  fontManagerState: FontManagerState;
}

function formatTileURL(tileId: string, url: string) {
  const [x, y, z] = tileId.split('/');
  return url.replace('{x}', x).replace('{y}', y).replace('{z}', z);
}

function getMapTileFeatureType(feature: Feature<SupportedGeometry>): MapTileFeatureType {
  const type = feature.geometry.type;

  if (type === 'Polygon' || type === 'MultiPolygon') {
    return MapTileFeatureType.polygon;
  }

  if (type === 'Point' || type === 'MultiPoint') {
    return MapTileFeatureType.point;
  }

  if (type === 'LineString' || type === 'MultiLineString') {
    return MapTileFeatureType.line;
  }

  console.log('Unknown feature type', type);

  return MapTileFeatureType.polygon;
}

// Fetch tile from server, and convert layer coordinates to vertices
export async function fetchTile({
  tileId,
  url,
  tileStyles,
  fontManagerState,
}: FetchTileOptions): Promise<PbfTileLayer[]> {
  const [x, y, z] = tileId.split('/').map(Number);

  const tileURL = formatTileURL(tileId, url);
  const res = await axios.get(tileURL, {
    responseType: 'arraybuffer',
  });
  const fontManager = FontManager.fromState(fontManagerState);

  const pbf = new Protobuf(res.data);
  const vectorTile = new VectorTile(pbf);

  const tileLayers: PbfTileLayer[] = [];

  for (const styleLayer of Object.values(tileStyles.layers)) {
    if (styleLayer.show === false || !vectorTile?.layers?.[styleLayer.sourceLayer]) {
      continue;
    }

    // @ts-ignore
    const numFeatures = vectorTile.layers[styleLayer.sourceLayer]?._features?.length || 0;

    const objectGroups: WebGlObjectBufferredGroup[] = [];
    const pointsGroupBuilder = new PointGroupBuilder();
    const polygonGroupBuilder = new PolygonGroupBuilder();
    const lineGroupBuilder = new LineGroupBuilder();
    const textGroupBuilder = new TextGroupBuilder(fontManager);

    for (let i = 0; i < numFeatures; i++) {
      const geojson: Feature<SupportedGeometry> = vectorTile.layers[styleLayer.sourceLayer]
        .feature(i)
        .toGeoJSON(x, y, z) as Feature<SupportedGeometry>;

      const featureType = getMapTileFeatureType(geojson);
      const possibleText =
        styleLayer.feature.type === MapTileFeatureType.text && featureType === MapTileFeatureType.point;

      if (featureType !== styleLayer.feature.type && !possibleText) {
        continue;
      }

      const showFeature =
        styleLayer.feature.show !== undefined ? compileStatement(styleLayer.feature.show, geojson) : true;
      if (!showFeature) {
        continue;
      }

      if (featureType === MapTileFeatureType.point && styleLayer.feature.type !== MapTileFeatureType.text) {
        const pointStyle = styleLayer.feature as PointStyle;

        if (geojson.geometry.type === 'Point') {
          const pointFeature = geojson as Feature<Point>;

          pointsGroupBuilder.addObject({
            type: MapTileFeatureType.point,
            color: compileStatement(pointStyle.color, pointFeature),
            center: pointFeature.geometry.coordinates as [number, number],
            radius: 0.0001,
            components: 32,
            borderWidth: 1,
            borderColor: vec4.fromValues(0, 0, 0, 1),
          });
        } else if (geojson.geometry.type === 'MultiPoint') {
          const pointFeature = geojson as Feature<MultiPoint>;

          for (const point of geojson.geometry.coordinates) {
            pointsGroupBuilder.addObject({
              type: MapTileFeatureType.point,
              color: compileStatement(pointStyle.color, pointFeature),
              center: point as [number, number],
              radius: 0.0001,
              components: 32,
              borderWidth: 1,
              borderColor: vec4.fromValues(0, 0, 0, 1),
            });
          }
        }
      } else if (featureType === MapTileFeatureType.point && styleLayer.feature.type === MapTileFeatureType.text) {
        const textStyle = styleLayer.feature as TextStyle;

        if (geojson.geometry.type === 'Point') {
          const pointFeature = geojson as Feature<Point>;

          textGroupBuilder.addObject({
            type: MapTileFeatureType.text,
            color: compileStatement(textStyle.color, pointFeature),
            text: compileStatement(textStyle.text, pointFeature),
            center: pointFeature.geometry.coordinates as [number, number],
            font: textStyle.font ? compileStatement(textStyle.font, pointFeature) : 'opensansBold',
            fontSize: 2,
            // fontSize ? compileStatement(textStyle.fontSize, pointFeature) : 2,
            borderWidth: 1,
            borderColor: vec4.fromValues(0, 0, 0, 1),
          });
        } else if (geojson.geometry.type === 'MultiPoint') {
          const pointFeature = geojson as Feature<MultiPoint>;

          for (const point of geojson.geometry.coordinates) {
            textGroupBuilder.addObject({
              type: MapTileFeatureType.text,
              color: compileStatement(textStyle.color, pointFeature),
              text: compileStatement(textStyle.text, pointFeature),
              center: point as [number, number],
              font: textStyle.font ? compileStatement(textStyle.font, pointFeature) : 'opensansBold',
              fontSize: 2,
              // fontSize ? compileStatement(textStyle.fontSize, pointFeature) : 2,
              borderWidth: 1,
              borderColor: vec4.fromValues(0, 0, 0, 1),
            });
          }
        }
      } else if (featureType === MapTileFeatureType.polygon) {
        const polygonStyle = styleLayer.feature as PolygonStyle;

        if (geojson.geometry.type === 'Polygon') {
          const polygonFeature = geojson as Feature<Polygon>;

          polygonGroupBuilder.addObject({
            type: MapTileFeatureType.polygon,
            color: compileStatement(polygonStyle.color, polygonFeature),
            vertecies: geojson.geometry.coordinates as Array<Array<[number, number]>>,
            borderWidth: 1,
            borderColor: vec4.fromValues(0, 0, 0, 1),
            borderJoin: LineJoinStyle.bevel,
          });
        } else if (geojson.geometry.type === 'MultiPolygon') {
          const polygonFeature = geojson as Feature<MultiPolygon>;

          for (const polygons of geojson.geometry.coordinates) {
            polygonGroupBuilder.addObject({
              type: MapTileFeatureType.polygon,
              color: compileStatement(polygonStyle.color, polygonFeature),
              vertecies: [polygons[0]] as Array<Array<[number, number]>>,
              borderWidth: 1,
              borderColor: vec4.fromValues(0, 0, 0, 1),
              borderJoin: LineJoinStyle.bevel,
            });
          }
        }
      } else if (featureType === MapTileFeatureType.line) {
        const lineStyle = styleLayer.feature as LineStyle;

        if (geojson.geometry.type === 'LineString') {
          const lineFeature = geojson as Feature<LineString>;

          lineGroupBuilder.addObject({
            type: MapTileFeatureType.line,
            color: compileStatement(lineStyle.color, lineFeature),
            vertecies: lineFeature.geometry.coordinates as Array<[number, number]>,
            width: 0.003 / Math.pow(2, z),
            // lineStyle.width ? compileStatement(lineStyle.width, lineFeature) : 1,
            borderWidth: 0,
            borderColor: vec4.fromValues(0, 0, 0, 1),
            fill: LineFillStyle.solid,
            join: LineJoinStyle.miter,
            cap: LineCapStyle.butt,
          });
        } else if (geojson.geometry.type === 'MultiLineString') {
          const lineFeature = geojson as Feature<MultiLineString>;

          for (const lineGeometry of lineFeature.geometry.coordinates) {
            lineGroupBuilder.addObject({
              type: MapTileFeatureType.line,
              color: compileStatement(lineStyle.color, lineFeature),
              vertecies: lineGeometry as Array<[number, number]>,
              width: 0.003 / Math.pow(2, z),
              // lineStyle.width ? compileStatement(lineStyle.width, lineFeature) : 1,
              borderWidth: 0,
              borderColor: vec4.fromValues(0, 0, 0, 1),
              fill: LineFillStyle.solid,
              join: LineJoinStyle.miter,
              cap: LineCapStyle.butt,
            });
          }
        }
      }
    }

    if (!polygonGroupBuilder.isEmpty()) {
      objectGroups.push(polygonGroupBuilder.build());
    }

    if (!lineGroupBuilder.isEmpty()) {
      objectGroups.push(lineGroupBuilder.build());
    }

    if (!pointsGroupBuilder.isEmpty()) {
      objectGroups.push(pointsGroupBuilder.build());
    }

    if (!textGroupBuilder.isEmpty()) {
      objectGroups.push(textGroupBuilder.build());
    }

    tileLayers.push({ layer: styleLayer.sourceLayer, objectGroups });
  }

  return tileLayers;
}
