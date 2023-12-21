import axios from 'axios';
import Protobuf from 'pbf';
import { vec4 } from 'gl-matrix';
import { VectorTile } from '@mapbox/vector-tile';
import geometryCenter from '@turf/center';
import { Feature, LineString, MultiPolygon, Polygon, MultiLineString, Point, MultiPoint } from 'geojson';
import { MapTileFeatureType } from '../tile';
import { PbfTileLayer } from './pbf_tile';
import { ProjectionType } from '../../geo/projection/projection';
import { FontManager, FontManagerState } from '../../font/font_manager';
import { AtlasTextureMappingState } from '../../atlas/atlas_manager';
// Styles
import { DataTileStyles, IconStyle, LineStyle, PointStyle, PolygonStyle, TextStyle } from '../../styles/styles';
import { compileStatement } from '../../styles/style_statement_utils';
// WEBGL specific
import { WebGlObjectBufferredGroup } from '../../renderer/webgl/object/object';
import { LineJoinStyle, LineCapStyle, LineFillStyle } from '../../renderer/webgl/line/line';
import { PointGroupBuilder } from '../../renderer/webgl/point/point_builder';
import { PolygonGroupBuilder } from '../../renderer/webgl/polygon/polygon_builder';
import { LineGroupBuilder } from '../../renderer/webgl/line/line_builder';
import { TextGroupBuilder } from '../../renderer/webgl/text/text_builder';
import { IconGroupBuilder } from '../../renderer/webgl/icon/icon_group_builder';
import { MercatorProjection } from '../../geo/projection/mercator_projection';

export type SupportedGeometry = Polygon | MultiPolygon | LineString | MultiLineString | Point | MultiPoint;

export interface FetchTileOptions {
  tileId: string;
  url: string;
  canvasWidth: number;
  canvasHeight: number;
  tileStyles: DataTileStyles;
  projectionType: ProjectionType;
  fontManagerState: FontManagerState;
  atlasTextureMappingState: AtlasTextureMappingState;
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
export async function fetchTile(
  { tileId, url, tileStyles, canvasWidth, canvasHeight, fontManagerState, atlasTextureMappingState }: FetchTileOptions,
  abortController: AbortController
): Promise<PbfTileLayer[]> {
  const [x, y, z] = tileId.split('/').map(Number);

  const tileURL = formatTileURL(tileId, url);
  const resData = await fetch(tileURL, { signal: abortController.signal }).then(data => data.arrayBuffer());
  const pbf = new Protobuf(resData);
  const vectorTile = new VectorTile(pbf);

  const fontManager = FontManager.fromState(fontManagerState);
  const projection = new MercatorProjection();
  const tileLayers: PbfTileLayer[] = [];

  for (const styleLayer of Object.values(tileStyles.layers)) {
    if (styleLayer.show === false || !vectorTile?.layers?.[styleLayer.sourceLayer]) {
      continue;
    }

    // @ts-ignore
    const numFeatures = vectorTile.layers[styleLayer.sourceLayer]?._features?.length || 0;

    const objectGroups: WebGlObjectBufferredGroup[] = [];
    const pointsGroupBuilder = new PointGroupBuilder(canvasWidth, canvasHeight, projection);
    const polygonGroupBuilder = new PolygonGroupBuilder(canvasWidth, canvasHeight, projection);
    const lineGroupBuilder = new LineGroupBuilder(canvasWidth, canvasHeight, projection);
    const textGroupBuilder = new TextGroupBuilder(canvasWidth, canvasHeight, projection, fontManager);
    const iconGroupBuilder = new IconGroupBuilder(canvasWidth, canvasHeight, projection, atlasTextureMappingState);

    for (let i = 0; i < numFeatures; i++) {
      const geojson: Feature<SupportedGeometry> = vectorTile.layers[styleLayer.sourceLayer]
        .feature(i)
        .toGeoJSON(x, y, z) as Feature<SupportedGeometry>;

      const featureType = getMapTileFeatureType(geojson);
      const possibleText =
        styleLayer.feature.type === MapTileFeatureType.text && featureType === MapTileFeatureType.point;
      const possibleIcon = styleLayer.feature.type === MapTileFeatureType.icon;
      const isTextOrIcon = [MapTileFeatureType.icon, MapTileFeatureType.text].includes(styleLayer.feature.type);

      if (featureType !== styleLayer.feature.type && !possibleText && !possibleIcon) {
        continue;
      }

      const showFeature =
        styleLayer.feature.show !== undefined ? compileStatement(styleLayer.feature.show, geojson) : true;
      if (!showFeature) {
        continue;
      }

      if (featureType === MapTileFeatureType.point && !isTextOrIcon) {
        const pointStyle = styleLayer.feature as PointStyle;

        if (geojson.geometry.type === 'Point') {
          const pointFeature = geojson as Feature<Point>;

          pointsGroupBuilder.addObject({
            type: MapTileFeatureType.point,
            color: compileStatement(pointStyle.color, pointFeature),
            center: pointFeature.geometry.coordinates as [number, number],
            radius: 0.000001,
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
              radius: 0.000001,
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
      } else if (featureType === MapTileFeatureType.point && styleLayer.feature.type === MapTileFeatureType.icon) {
        let center: [number, number];

        if (geojson.geometry.type === 'Point') {
          center = geojson.geometry.coordinates as [number, number];
        } else {
          center = geometryCenter(geojson).geometry.coordinates as [number, number];
        }

        const pointFeature = geojson as Feature<Point>;
        const iconStyle = styleLayer.feature as IconStyle;

        iconGroupBuilder.addObject({
          type: MapTileFeatureType.icon,
          atlas: compileStatement(iconStyle.atlas, pointFeature),
          name: compileStatement(iconStyle.name, pointFeature),
          center,
          width: iconStyle.width ?? compileStatement(iconStyle.width, pointFeature),
          height: iconStyle.height ?? compileStatement(iconStyle.height, pointFeature),
        });
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

    if (!iconGroupBuilder.isEmpty()) {
      objectGroups.push(iconGroupBuilder.build());
    }

    tileLayers.push({ layer: styleLayer.sourceLayer, objectGroups });
  }

  return tileLayers;
}
