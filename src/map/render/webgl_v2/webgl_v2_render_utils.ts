import { Point } from 'geojson';
import { MapState } from '../../map_state';
import { TileLayer } from '../../tile/tile_layer';
import { ColorValue } from '../../styles/style_statement';
import { compileStatement } from '../../styles/style_statement_utils';
import { TileFeature } from '../../tile/tile_feature';
import { LineStyle, PointStyle, FeatureStyleType, TextStyle } from '../../styles/styles';
import { FontManager } from '../../font/font_manager';

import { Vector2, Vector4 } from '../../../webgl_v2/types';
import { WebGl2Object } from '../../../webgl_v2/objects/object';
import { WebGl2Circle } from '../../../webgl_v2/objects/circle';
import { WebGl2Line } from '../../../webgl_v2/objects/line';
import { WebGl2Polygon } from '../../../webgl_v2/objects/polygon';
import { WebGl2Rectangle } from '../../../webgl_v2/objects/rectangle';
import { WebGl2Text } from '../../../webgl_v2/objects/text';
// import { WebGl2Text } from '../../../webgl_v2/objects/text_v2';

export const GL_COLOR_BLACK: Vector4 = [0, 0, 0, 1];
export const GL_COLOR_WHITE: Vector4 = [1, 1, 1, 1];

export interface LayerGl2ObjectsProps {
  layer: TileLayer;
  mapState: MapState;
  width: number;
  height: number;
  image?: HTMLImageElement;
  fontManager: FontManager;
  devicePixelRatio: number;
}

export const getLayerGl2Objects = (props: LayerGl2ObjectsProps): WebGl2Object[] => {
  if (!props.layer.shouldBeRendered(props.mapState)) {
    return [];
  }

  const objects: WebGl2Object[] = [];
  const backgroundPrograms = getLayerBackground(props);
  objects.push(...backgroundPrograms);

  for (const feature of props.layer.getFeatures()) {
    const featureGlGrograms = getFeatureGl2Objects(feature, props);

    if (featureGlGrograms.length) {
      objects.push(...featureGlGrograms);
    }
  }

  return objects;
};

export const getFeatureGl2Objects = (feature: TileFeature, props: LayerGl2ObjectsProps): WebGl2Object[] => {
  const featureStyle = feature.getStyles();

  if (!feature.shouldBeRendered(props.mapState) || !featureStyle) {
    return [];
  }

  switch (featureStyle.type) {
    case FeatureStyleType.point:
      return getPointFeatureGl2Objects(feature, props);
    case FeatureStyleType.polygon:
      return getPolygonFeatureGl2Objects(feature, props);
    case FeatureStyleType.line:
      return getLineFeatureGl2Objects(feature, props);
    case FeatureStyleType.text:
      return getTextFeatureGl2Objects(feature, props);
    case FeatureStyleType.image:
    // return getImageFeatureGl2Objects(feature, props);
    default:
      // console.info(`${featureStyle.type} is not supported by WebGL2 rendrer.`);
      return [];
  }
};

export const getPointFeatureGl2Objects = (feature: TileFeature, props: LayerGl2ObjectsProps): WebGl2Object[] => {
  const featureStyle = feature.getStyles()! as PointStyle;
  const geojsonFeature = feature.getGeoJsonFeature();
  const radius = featureStyle.radius ? compileStatement<number>(featureStyle.radius, geojsonFeature) : 50;
  const color = featureStyle.color ? getGlColor(compileStatement(featureStyle.color, geojsonFeature)) : GL_COLOR_WHITE;
  const center = feature.getGeometry() as Point;
  const programs: WebGl2Object[] = [];

  if (featureStyle.border) {
    const borderStyle = featureStyle.border;
    const borderRadius =
      radius + (featureStyle.radius ? compileStatement<number>(borderStyle.width, geojsonFeature) : 5) * 2;
    const borderColor = borderStyle.color
      ? getGlColor(compileStatement(borderStyle.color, geojsonFeature))
      : GL_COLOR_BLACK;

    programs.push(
      new WebGl2Circle({
        components: 32,
        center: center.coordinates as Vector2,
        radius: borderRadius,
        color: borderColor,
      })
    );
  }

  programs.push(
    new WebGl2Circle({
      components: 32,
      center: center.coordinates as Vector2,
      radius,
      color,
    })
  );

  return programs;
};

export const getLineFeatureGl2Objects = (feature: TileFeature, props: LayerGl2ObjectsProps): WebGl2Object[] => {
  const featureStyle = feature.getStyles()! as LineStyle;
  const geojsonFeature = feature.getGeoJsonFeature();
  const lineWidth = featureStyle.width ? compileStatement<number>(featureStyle.width, geojsonFeature) : 1;
  const color = featureStyle.color ? getGlColor(compileStatement(featureStyle.color, geojsonFeature)) : GL_COLOR_BLACK;

  const programs: WebGl2Object[] = [];
  for (const lineStrip of feature.getGeometry().coordinates) {
    programs.push(
      new WebGl2Line({
        color,
        lineWidth,
        points: lineStrip as Vector2[],
      })
    );
  }

  return programs;
};

export const getPolygonFeatureGl2Objects = (feature: TileFeature, props: LayerGl2ObjectsProps): WebGl2Object[] => {
  const featureStyle = feature.getStyles()! as LineStyle;
  const geojsonFeature = feature.getGeoJsonFeature();
  const color = featureStyle.color ? getGlColor(compileStatement(featureStyle.color, geojsonFeature)) : GL_COLOR_BLACK;

  const programs: WebGl2Object[] = [];

  for (const area of feature.getGeometry().coordinates) {
    programs.push(
      new WebGl2Polygon({
        color,
        points: area as Vector2[],
      })
    );
  }

  return programs;
};

// export const getImageFeatureGl2Objects = (feature: TileFeature, props: LayerGl2ObjectsProps): WebGl2Object[] => {
//   return [
//     new WebGlImage({
//       width: props.width,
//       height: props.height,
//       image: props.image!,
//       translation: [props.x, props.y],
//       scale: props.scale,
//     }),
//   ];
// };

export const getTextFeatureGl2Objects = (feature: TileFeature, props: LayerGl2ObjectsProps): WebGl2Object[] => {
  const featureStyle = feature.getStyles()! as TextStyle;
  const geojsonFeature = feature.getGeoJsonFeature();
  const text = compileStatement<string>(featureStyle.text, geojsonFeature);

  if (!text) {
    return [];
  }

  const font = featureStyle.font ? compileStatement<string>(featureStyle.font, geojsonFeature) : 'roboto';
  const fontSize = featureStyle.fontSize ? compileStatement<number>(featureStyle.fontSize, geojsonFeature) : 14;
  const point = (feature.getGeometry() as Point).coordinates;
  const color = featureStyle.color ? getGlColor(compileStatement(featureStyle.color, geojsonFeature)) : GL_COLOR_BLACK;

  return [
    new WebGl2Text({
      center: point as Vector2,
      text,
      font: props.fontManager.getFont(font),
      fontSize: fontSize * props.devicePixelRatio,
      color,
    }),
  ];
};

export const getLayerBackground = (props: LayerGl2ObjectsProps): WebGl2Object[] => {
  const backgroundStyle = props.layer.getStyles().background;
  if (!backgroundStyle || !backgroundStyle.color) {
    return [];
  }

  return [
    new WebGl2Rectangle({
      p: [0, 0],
      width: props.width,
      height: props.height,
      color: getGlColor(compileStatement(backgroundStyle.color, props.layer)),
    }),
  ];
};

export const getGlColor = (stylesColor: ColorValue): Vector4 => {
  if (stylesColor[0] !== '$rgb' && stylesColor[0] !== '$rgba') {
    throw new Error(`Style color statement is not supported: ${JSON.stringify(stylesColor)}`);
  }

  return [stylesColor[1] / 255, stylesColor[2] / 255, stylesColor[3] / 255, 1];
};
