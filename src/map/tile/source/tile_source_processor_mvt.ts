import Protobuf from 'pbf';
import { VectorTile } from '@mapbox/vector-tile';
import geometryCenter from '@turf/center';
import { Feature, LineString, MultiPolygon, Polygon, MultiLineString, Point, MultiPoint } from 'geojson';
import { TileSourceProcessOptions } from './tile_source_processor';
import { MapTile, MapTileLayer, getTileRef } from '../tile';
import {
  GlyphMapFeature,
  MapFeatureType,
  PointMapFeature,
  PolygonMapFeature,
  TextMapFeature,
  LineJoinStyle,
  LineFillStyle,
  LineMapFeature,
} from '../feature';
import { MapFeatureFlags } from '../../flags';
import {
  DataLayerStyle,
  MvtTileSource,
  GlyphStyle,
  LineStyle,
  PointStyle,
  PolygonStyle,
  TextStyle,
} from '../../styles/styles';
import { compileStatement } from '../../styles/style_statement_utils';
import { getProjectionFromType } from '../../geo/projection/projection';

export type SupportedGeometry = Polygon | MultiPolygon | LineString | MultiLineString | Point | MultiPoint;

function getMapTileFeatureType(feature: Feature<SupportedGeometry>): MapFeatureType {
  const type = feature.geometry.type;

  if (type === 'Polygon' || type === 'MultiPolygon') {
    return MapFeatureType.polygon;
  }

  if (type === 'Point' || type === 'MultiPoint') {
    return MapFeatureType.point;
  }

  if (type === 'LineString' || type === 'MultiLineString') {
    return MapFeatureType.line;
  }

  console.log('Unknown feature type', type);

  return MapFeatureType.polygon;
}

export async function MvtTileSourceProcessor(
  featureFlags: MapFeatureFlags,
  tileSourceUrl: string,
  abortController: AbortController,
  source: MvtTileSource,
  sourceLayers: DataLayerStyle[],
  processOptions: TileSourceProcessOptions,
): Promise<MapTile> {
  const tileId = processOptions.tileId;
  const tileRef = getTileRef(tileId);
  const [x, y, z] = tileId.split('/').map(Number);
  const projection = getProjectionFromType(processOptions.projectionType);
  const resData = await fetch(tileSourceUrl, { signal: abortController.signal }).then(data => data.arrayBuffer());
  const pbf = new Protobuf(resData);
  const vectorTile = new VectorTile(pbf);
  const tileLayers: MapTileLayer[] = [];

  for (const styleLayer of sourceLayers) {
    if (styleLayer.show === false || !vectorTile?.layers?.[styleLayer.sourceLayer]) {
      continue;
    }

    const layer: MapTileLayer = {
      tileId,
      source: source.name,
      layerName: styleLayer.styleLayerName,
      zIndex: styleLayer.zIndex,
      features: [],
    };

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const numFeatures = vectorTile.layers[styleLayer.sourceLayer]?._features?.length || 0;

    for (let i = 0; i < numFeatures; i++) {
      const geojson: Feature<SupportedGeometry> = vectorTile.layers[styleLayer.sourceLayer]
        .feature(i)
        .toGeoJSON(x, y, z) as Feature<SupportedGeometry>;

      const featureType = getMapTileFeatureType(geojson);
      const possibleText = styleLayer.feature.type === MapFeatureType.text && featureType === MapFeatureType.point;
      const possibleGlyph = styleLayer.feature.type === MapFeatureType.glyph;
      const isTextOrGlyph = [MapFeatureType.glyph, MapFeatureType.text].includes(styleLayer.feature.type);

      if (featureType !== styleLayer.feature.type && !possibleText && !possibleGlyph) {
        continue;
      }

      const showFeature =
        styleLayer.feature.show !== undefined ? compileStatement(styleLayer.feature.show, geojson) : true;
      if (!showFeature) {
        continue;
      }

      if (featureType === MapFeatureType.point && !isTextOrGlyph) {
        const pointStyle = styleLayer.feature as PointStyle;

        if (geojson.geometry.type === 'Point') {
          const pointFeature = geojson as Feature<Point>;

          layer.features.push({
            id: pointFeature.id! as number,
            type: MapFeatureType.point,
            color: compileStatement(pointStyle.color, pointFeature),
            center: projection.fromLngLat(pointFeature.geometry.coordinates as [number, number]),
            radius: pointStyle.radius ? compileStatement(pointStyle.radius, pointFeature) : 1,
            components: 32,
            borderWidth: pointStyle.border?.width ? compileStatement(pointStyle.border.width, pointFeature) : 1,
            borderColor: pointStyle.border?.color && compileStatement(pointStyle.border.color, pointFeature),
            margin: {
              top: pointStyle.margin?.top ? compileStatement(pointStyle.margin?.top, pointFeature) : 0,
              left: pointStyle.margin?.left ? compileStatement(pointStyle.margin?.left, pointFeature) : 0,
            },
          } as PointMapFeature);

          continue;
        }

        if (geojson.geometry.type === 'MultiPoint') {
          const pointFeature = geojson as Feature<MultiPoint>;

          for (const point of geojson.geometry.coordinates) {
            layer.features.push({
              id: pointFeature.id! as number,
              type: MapFeatureType.point,
              color: compileStatement(pointStyle.color, pointFeature),
              center: projection.fromLngLat(point as [number, number]),
              radius: pointStyle.radius ? compileStatement(pointStyle.radius, pointFeature) : 1,
              components: 32,
              borderWidth: pointStyle.border?.width ? compileStatement(pointStyle.border.width, pointFeature) : 1,
              borderColor: pointStyle.border?.color && compileStatement(pointStyle.border.color, pointFeature),
              margin: {
                top: pointStyle.margin?.top ? compileStatement(pointStyle.margin?.top, pointFeature) : 0,
                left: pointStyle.margin?.left ? compileStatement(pointStyle.margin?.left, pointFeature) : 0,
              },
            } as PointMapFeature);
          }
        }

        continue;
      }

      if (featureType === MapFeatureType.point && styleLayer.feature.type === MapFeatureType.text) {
        const textStyle = styleLayer.feature as TextStyle;

        if (geojson.geometry.type === 'Point') {
          const pointFeature = geojson as Feature<Point>;

          layer.features.push({
            id: pointFeature.id! as number,
            type: MapFeatureType.text,
            color: compileStatement(textStyle.color, pointFeature),
            borderColor: compileStatement(textStyle.borderColor, pointFeature),
            text: compileStatement(textStyle.text, pointFeature),
            center: projection.fromLngLat(pointFeature.geometry.coordinates as [number, number]),
            font: textStyle.font ? compileStatement(textStyle.font, pointFeature) : 'opensans',
            fontSize: compileStatement(textStyle.fontSize, pointFeature),
            borderWidth: 1,
            margin: {
              top: textStyle.margin?.top ? compileStatement(textStyle.margin?.top, pointFeature) : 0,
              left: textStyle.margin?.left ? compileStatement(textStyle.margin?.left, pointFeature) : 0,
            },
          } as TextMapFeature);

          continue;
        }

        if (geojson.geometry.type === 'MultiPoint') {
          const pointFeature = geojson as Feature<MultiPoint>;

          for (const point of geojson.geometry.coordinates) {
            layer.features.push({
              id: pointFeature.id! as number,
              type: MapFeatureType.text,
              color: compileStatement(textStyle.color, pointFeature),
              borderColor: compileStatement(textStyle.borderColor, pointFeature),
              text: compileStatement(textStyle.text, pointFeature),
              center: projection.fromLngLat(point as [number, number]),
              font: textStyle.font ? compileStatement(textStyle.font, pointFeature) : 'opensans',
              fontSize: compileStatement(textStyle.fontSize, pointFeature),
              borderWidth: 1,
              margin: {
                top: textStyle.margin?.top ? compileStatement(textStyle.margin?.top, pointFeature) : 0,
                left: textStyle.margin?.left ? compileStatement(textStyle.margin?.left, pointFeature) : 0,
              },
            } as TextMapFeature);
          }
        }

        continue;
      }

      if (featureType === MapFeatureType.point && styleLayer.feature.type === MapFeatureType.glyph) {
        let center: [number, number];

        if (geojson.geometry.type === 'Point') {
          center = geojson.geometry.coordinates as [number, number];
        } else {
          center = geometryCenter(geojson).geometry.coordinates as [number, number];
        }

        const pointFeature = geojson as Feature<Point>;
        const glyphStyle = styleLayer.feature as GlyphStyle;

        layer.features.push({
          id: pointFeature.id! as number,
          type: MapFeatureType.glyph,
          atlas: compileStatement(glyphStyle.atlas, pointFeature),
          name: compileStatement(glyphStyle.name, pointFeature),
          center: projection.fromLngLat(center),
          width: glyphStyle.width ?? compileStatement(glyphStyle.width, pointFeature),
          height: glyphStyle.height ?? compileStatement(glyphStyle.height, pointFeature),
          margin: {
            top: glyphStyle.margin?.top ? compileStatement(glyphStyle.margin?.top, pointFeature) : 0,
            left: glyphStyle.margin?.left ? compileStatement(glyphStyle.margin?.left, pointFeature) : 0,
          },
        } as GlyphMapFeature);

        continue;
      }

      if (isTextOrGlyph) {
        continue;
      }

      if (featureType === MapFeatureType.polygon) {
        const polygonStyle = styleLayer.feature as PolygonStyle;

        if (geojson.geometry.type === 'Polygon') {
          const polygonFeature = geojson as Feature<Polygon>;

          layer.features.push({
            id: polygonFeature.id! as number,
            type: MapFeatureType.polygon,
            color: compileStatement(polygonStyle.color, polygonFeature),
            vertecies: (geojson.geometry.coordinates as Array<Array<[number, number]>>).map(arr =>
              arr.map(p => projection.fromLngLat(p)),
            ),
            borderWidth: 1,
            borderColor: [0, 0, 0, 1],
            borderJoin: LineJoinStyle.bevel,
          } as PolygonMapFeature);

          continue;
        }

        if (geojson.geometry.type === 'MultiPolygon') {
          const polygonFeature = geojson as Feature<MultiPolygon>;

          for (const polygons of geojson.geometry.coordinates) {
            layer.features.push({
              id: polygonFeature.id! as number,
              type: MapFeatureType.polygon,
              color: compileStatement(polygonStyle.color, polygonFeature),
              vertecies: ([polygons[0]] as Array<Array<[number, number]>>).map(arr =>
                arr.map(p => projection.fromLngLat(p)),
              ),
              borderWidth: 1,
              borderColor: [0, 0, 0, 1],
              borderJoin: LineJoinStyle.bevel,
            } as PolygonMapFeature);
          }
        }

        continue;
      }

      if (featureType === MapFeatureType.line) {
        const lineStyle = styleLayer.feature as LineStyle;

        if (geojson.geometry.type === 'LineString') {
          const lineFeature = geojson as Feature<LineString>;

          layer.features.push({
            id: lineFeature.id! as number,
            type: MapFeatureType.line,
            color: compileStatement(lineStyle.color, lineFeature),
            vertecies: (lineFeature.geometry.coordinates as Array<[number, number]>).map(p => projection.fromLngLat(p)),
            width: lineStyle.width ? compileStatement(lineStyle.width, lineFeature) : 1,
            borderWidth: lineStyle.borderWidth ? compileStatement(lineStyle.borderWidth, lineFeature) : 0,
            borderColor: lineStyle.borderColor ? compileStatement(lineStyle.borderColor, lineFeature) : [0, 0, 0, 0],
            fill: lineStyle.fillStyle ? compileStatement(lineStyle.fillStyle, lineFeature) : LineFillStyle.solid,
            join: lineStyle.joinStyle && compileStatement(lineStyle.joinStyle, lineFeature),
            cap: lineStyle.capStyle && compileStatement(lineStyle.capStyle, lineFeature),
          } as LineMapFeature);

          continue;
        }

        if (geojson.geometry.type === 'MultiLineString') {
          const lineFeature = geojson as Feature<MultiLineString>;

          for (const lineGeometry of lineFeature.geometry.coordinates) {
            layer.features.push({
              id: lineFeature.id! as number,
              type: MapFeatureType.line,
              color: compileStatement(lineStyle.color, lineFeature),
              vertecies: (lineGeometry as Array<[number, number]>).map(p => projection.fromLngLat(p)),
              width: lineStyle.width ? compileStatement(lineStyle.width, lineFeature) : 1,
              borderWidth: lineStyle.borderWidth ? compileStatement(lineStyle.borderWidth, lineFeature) : 0,
              borderColor: lineStyle.borderColor ? compileStatement(lineStyle.borderColor, lineFeature) : [0, 0, 0, 0],
              fill: lineStyle.fillStyle ? compileStatement(lineStyle.fillStyle, lineFeature) : LineFillStyle.solid,
              join: lineStyle.joinStyle && compileStatement(lineStyle.joinStyle, lineFeature),
              cap: lineStyle.capStyle && compileStatement(lineStyle.capStyle, lineFeature),
            } as LineMapFeature);
          }
        }

        continue;
      }
    }

    if (layer.features.length) {
      tileLayers.push(layer);
    }
  }

  return {
    ref: tileRef,
    tileId,
    layers: tileLayers,
  };
}
