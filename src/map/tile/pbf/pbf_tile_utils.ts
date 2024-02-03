import Protobuf from 'pbf';
import { mat3, vec4 } from 'gl-matrix';
import { VectorTile } from '@mapbox/vector-tile';
import geometryCenter from '@turf/center';
import { Feature, LineString, MultiPolygon, Polygon, MultiLineString, Point, MultiPoint } from 'geojson';
import { MapTileFeatureType } from '../tile';
import { PbfTileLayer } from './pbf_tile';
import { ProjectionType } from '../../geo/projection/projection';
import { AtlasTextureMappingState } from '../../atlas/atlas_manager';
import { MapFeatureFlags } from '../../flags';
// Styles
import { DataTileStyles, GlyphStyle, LineStyle, PointStyle, PolygonStyle, TextStyle } from '../../styles/styles';
import { compileStatement } from '../../styles/style_statement_utils';
// WEBGL specific
import { WebGlObjectBufferredGroup } from '../../renderer/webgl/object/object';
import { LineJoinStyle, LineCapStyle, LineFillStyle } from '../../renderer/webgl/line/line';
import { PointGroupBuilder } from '../../renderer/webgl/point/point_builder';
import { PolygonGroupBuilder } from '../../renderer/webgl/polygon/polygon_builder';
import { LineGroupBuilder } from '../../renderer/webgl/line/line_builder';
import { GlyphGroupBuilder } from '../../renderer/webgl/glyph/glyph_group_builder';
import { GlyphTextGroupBuilder } from '../../renderer/webgl/glyph/glyph_text_group_builder';
import { MercatorProjection } from '../../geo/projection/mercator_projection';
import { WebGlText } from '../../renderer/webgl/text/text';

export type SupportedGeometry = Polygon | MultiPolygon | LineString | MultiLineString | Point | MultiPoint;

export interface FetchTileOptions {
  tileId: string;
  url: string;
  projectionViewMat: [number, number, number, number, number, number, number, number, number];
  canvasWidth: number;
  canvasHeight: number;
  zoom: number;
  tileSize: number;
  tileStyles: DataTileStyles;
  projectionType: ProjectionType;
  atlasTextureMappingState: AtlasTextureMappingState;
  featureFlags: MapFeatureFlags;
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
  {
    tileId,
    url,
    tileStyles,
    canvasWidth,
    canvasHeight,
    zoom,
    tileSize,
    atlasTextureMappingState,
    projectionViewMat: projectionViewMatSource,
    featureFlags,
  }: FetchTileOptions,
  abortController: AbortController
): Promise<PbfTileLayer[]> {
  const [x, y, z] = tileId.split('/').map(Number);
  const projectionViewMat = mat3.fromValues(...projectionViewMatSource);

  const tileURL = formatTileURL(tileId, url);
  const resData = await fetch(tileURL, { signal: abortController.signal }).then(data => data.arrayBuffer());
  const pbf = new Protobuf(resData);
  const vectorTile = new VectorTile(pbf);

  const projection = new MercatorProjection();
  const tileLayers: PbfTileLayer[] = [];

  console.time('ProcessTile');

  for (const styleLayer of Object.values(tileStyles.layers)) {
    if (styleLayer.show === false || !vectorTile?.layers?.[styleLayer.sourceLayer]) {
      continue;
    }

    // @ts-ignore
    const numFeatures = vectorTile.layers[styleLayer.sourceLayer]?._features?.length || 0;

    const objectGroups: WebGlObjectBufferredGroup[] = [];
    const pointsGroupBuilder = new PointGroupBuilder(
      projectionViewMat,
      canvasWidth,
      canvasHeight,
      zoom,
      tileSize,
      projection,
      featureFlags
    );
    const polygonGroupBuilder = new PolygonGroupBuilder(
      projectionViewMat,
      canvasWidth,
      canvasHeight,
      zoom,
      tileSize,
      projection,
      featureFlags
    );
    const lineGroupBuilder = new LineGroupBuilder(
      projectionViewMat,
      canvasWidth,
      canvasHeight,
      zoom,
      tileSize,
      projection,
      featureFlags
    );
    const glyphGroupBuilder = new GlyphGroupBuilder(
      projectionViewMat,
      canvasWidth,
      canvasHeight,
      zoom,
      tileSize,
      projection,
      featureFlags,
      atlasTextureMappingState
    );
    const glyphTextGroupBuilder = new GlyphTextGroupBuilder(
      projectionViewMat,
      canvasWidth,
      canvasHeight,
      zoom,
      tileSize,
      projection,
      featureFlags,
      atlasTextureMappingState
    );

    for (let i = 0; i < numFeatures; i++) {
      const geojson: Feature<SupportedGeometry> = vectorTile.layers[styleLayer.sourceLayer]
        .feature(i)
        .toGeoJSON(x, y, z) as Feature<SupportedGeometry>;

      const featureType = getMapTileFeatureType(geojson);
      const possibleText =
        styleLayer.feature.type === MapTileFeatureType.text && featureType === MapTileFeatureType.point;
      const possibleGlyph = styleLayer.feature.type === MapTileFeatureType.glyph;
      const isTextOrGlyph = [MapTileFeatureType.glyph, MapTileFeatureType.text].includes(styleLayer.feature.type);

      if (featureType !== styleLayer.feature.type && !possibleText && !possibleGlyph) {
        continue;
      }

      const showFeature =
        styleLayer.feature.show !== undefined ? compileStatement(styleLayer.feature.show, geojson) : true;
      if (!showFeature) {
        continue;
      }

      if (featureType === MapTileFeatureType.point && !isTextOrGlyph) {
        const pointStyle = styleLayer.feature as PointStyle;

        if (geojson.geometry.type === 'Point') {
          const pointFeature = geojson as Feature<Point>;

          pointsGroupBuilder.addObject({
            type: MapTileFeatureType.point,
            color: compileStatement(pointStyle.color, pointFeature),
            center: pointFeature.geometry.coordinates as [number, number],
            radius: pointStyle.radius ? compileStatement(pointStyle.radius, pointFeature) : 1,
            components: 32,
            borderWidth: pointStyle.border?.width ? compileStatement(pointStyle.border.width, pointFeature) : 1,
            borderColor: pointStyle.border?.color && compileStatement(pointStyle.border.color, pointFeature),
          });
        } else if (geojson.geometry.type === 'MultiPoint') {
          const pointFeature = geojson as Feature<MultiPoint>;

          for (const point of geojson.geometry.coordinates) {
            pointsGroupBuilder.addObject({
              type: MapTileFeatureType.point,
              color: compileStatement(pointStyle.color, pointFeature),
              center: point as [number, number],
              radius: pointStyle.radius ? compileStatement(pointStyle.radius, pointFeature) : 1,
              components: 32,
              borderWidth: pointStyle.border?.width ? compileStatement(pointStyle.border.width, pointFeature) : 1,
              borderColor: pointStyle.border?.color && compileStatement(pointStyle.border.color, pointFeature),
            });
          }
        }
      } else if (featureType === MapTileFeatureType.point && styleLayer.feature.type === MapTileFeatureType.text) {
        const textStyle = styleLayer.feature as TextStyle;

        if (geojson.geometry.type === 'Point') {
          const pointFeature = geojson as Feature<Point>;

          const textObject: WebGlText = {
            type: MapTileFeatureType.text,
            color: compileStatement(textStyle.color, pointFeature),
            text: compileStatement(textStyle.text, pointFeature),
            center: pointFeature.geometry.coordinates as [number, number],
            font: textStyle.font ? compileStatement(textStyle.font, pointFeature) : 'opensansBold',
            fontSize: 2,
            // fontSize ? compileStatement(textStyle.fontSize, pointFeature) : 2,
            borderWidth: 1,
            borderColor: vec4.fromValues(0, 0, 0, 1),
          };

          glyphTextGroupBuilder.addObject(textObject);
        } else if (geojson.geometry.type === 'MultiPoint') {
          const pointFeature = geojson as Feature<MultiPoint>;

          for (const point of geojson.geometry.coordinates) {
            const textObject: WebGlText = {
              type: MapTileFeatureType.text,
              color: compileStatement(textStyle.color, pointFeature),
              text: compileStatement(textStyle.text, pointFeature),
              center: point as [number, number],
              font: textStyle.font ? compileStatement(textStyle.font, pointFeature) : 'opensansBold',
              fontSize: 2,
              // fontSize ? compileStatement(textStyle.fontSize, pointFeature) : 2,
              borderWidth: 1,
              borderColor: vec4.fromValues(0, 0, 0, 1),
            };

            glyphTextGroupBuilder.addObject(textObject);
          }
        }
      } else if (featureType === MapTileFeatureType.point && styleLayer.feature.type === MapTileFeatureType.glyph) {
        let center: [number, number];

        if (geojson.geometry.type === 'Point') {
          center = geojson.geometry.coordinates as [number, number];
        } else {
          center = geometryCenter(geojson).geometry.coordinates as [number, number];
        }

        const pointFeature = geojson as Feature<Point>;
        const glyphStyle = styleLayer.feature as GlyphStyle;

        glyphGroupBuilder.addObject({
          type: MapTileFeatureType.glyph,
          atlas: compileStatement(glyphStyle.atlas, pointFeature),
          name: compileStatement(glyphStyle.name, pointFeature),
          center,
          width: glyphStyle.width ?? compileStatement(glyphStyle.width, pointFeature),
          height: glyphStyle.height ?? compileStatement(glyphStyle.height, pointFeature),
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
            width: lineStyle.width ? compileStatement(lineStyle.width, lineFeature) : 1,
            borderWidth: 0,
            borderColor: vec4.fromValues(0, 0, 0, 1),
            fill: lineStyle.fillStyle ? compileStatement(lineStyle.fillStyle, lineFeature) : LineFillStyle.solid,
            join: lineStyle.joinStyle && compileStatement(lineStyle.joinStyle, lineFeature),
            cap: lineStyle.capStyle && compileStatement(lineStyle.capStyle, lineFeature),
          });
        } else if (geojson.geometry.type === 'MultiLineString') {
          const lineFeature = geojson as Feature<MultiLineString>;

          for (const lineGeometry of lineFeature.geometry.coordinates) {
            lineGroupBuilder.addObject({
              type: MapTileFeatureType.line,
              color: compileStatement(lineStyle.color, lineFeature),
              vertecies: lineGeometry as Array<[number, number]>,
              width: lineStyle.width ? compileStatement(lineStyle.width, lineFeature) : 1,
              borderWidth: 0,
              borderColor: vec4.fromValues(0, 0, 0, 1),
              fill: lineStyle.fillStyle ? compileStatement(lineStyle.fillStyle, lineFeature) : LineFillStyle.solid,
              join: lineStyle.joinStyle && compileStatement(lineStyle.joinStyle, lineFeature),
              cap: lineStyle.capStyle && compileStatement(lineStyle.capStyle, lineFeature),
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

    if (!glyphTextGroupBuilder.isEmpty()) {
      objectGroups.push(glyphTextGroupBuilder.build());
    }

    if (!glyphGroupBuilder.isEmpty()) {
      objectGroups.push(glyphGroupBuilder.build());
    }

    tileLayers.push({ layerName: styleLayer.sourceLayer, zIndex: styleLayer.zIndex, objectGroups });
  }

  console.timeEnd('ProcessTile');

  return tileLayers;
}
